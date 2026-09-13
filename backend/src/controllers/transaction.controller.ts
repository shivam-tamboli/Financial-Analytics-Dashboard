import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose, { FilterQuery } from 'mongoose';
import { Transaction, TransactionDocument } from '../models/Transaction';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import {
  buildTransactionFilter,
  computePaidTotals,
  EXPORTABLE_COLUMNS,
  ExportableColumn,
  PAID_STATUS,
  round2,
  toTransactionDTO,
  transactionFilterSchema,
  transactionQuerySchema,
} from '../services/transaction.service';
import { streamTransactionsAsCsv } from '../services/csv.service';
import { getCached, setCached } from '../services/cache.service';

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  const query = transactionQuerySchema.parse(req.query);
  const filter = buildTransactionFilter(query);
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const skip = (query.page - 1) * query.limit;

  const [data, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ [query.sortBy]: sortDirection, _id: 1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    data: data.map(toTransactionDTO),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  });
});

export const getTransactionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid transaction id');
  }
  const doc = await Transaction.findById(id).lean();
  if (!doc) {
    throw new ApiError(404, 'Transaction not found');
  }
  res.json({ data: toTransactionDTO(doc) });
});

const recentTransactionsQuerySchema = z.object({
  filterBy: z.enum(['date', 'status', 'user', 'month', 'year']).optional(),
  user: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

function buildRecentTransactionsFilter(
  baseFilter: FilterQuery<TransactionDocument>,
  input: z.infer<typeof recentTransactionsQuerySchema>
): FilterQuery<TransactionDocument> {
  const filter: FilterQuery<TransactionDocument> = { ...baseFilter };

  if (input.user) {
    const escaped = input.user.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ user_id: input.user }, { user_name: new RegExp(escaped, 'i') }];
  }

  return filter;
}

const MONTH_KEYS_2_DIGIT = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

export const getTransactionSummary = asyncHandler(async (req: Request, res: Response) => {
  const filterInput = transactionFilterSchema.parse(req.query);
  const filter = buildTransactionFilter(filterInput);
  const recentInput = recentTransactionsQuerySchema.parse(req.query);

  // Pending transactions show up in the table/recent list, but never count toward
  // any financial total. This has to *intersect* with the caller's own status
  // filter, not overwrite it — spreading `filter` and then unconditionally setting
  // status: 'Paid' would silently discard an explicit status=Pending filter and
  // show the full Paid total as if no filter were applied at all. If the caller
  // asked for Pending, the honest Paid-only answer is zero, not "ignore your filter."
  const paidFilter: FilterQuery<TransactionDocument> = { ...filter };
  if (filter.status && filter.status !== PAID_STATUS) {
    paidFilter.status = { $in: [] as TransactionDocument['status'][] };
  } else {
    paidFilter.status = PAID_STATUS;
  }
  const recentFilter = buildRecentTransactionsFilter(filter, recentInput);

  // year/month/category/date/amount/userId/status all narrow this cache key, so two
  // different filtered views never collide — but recentTransactions is intentionally
  // excluded from both the key and the cached payload; it's read fresh every time.
  const cacheKey = `summary:${JSON.stringify(filterInput)}`;
  let cached = getCached<{
    revenue: number;
    expenses: number;
    categoryBreakdown: { category: string; total: number; count: number }[];
    yearly: Record<string, { revenue: number; expenses: number; monthly: Record<string, { revenue: number; expenses: number }> }>;
  }>(cacheKey);

  if (!cached) {
    const [totalsByCategory, monthlyRaw] = await Promise.all([
      Transaction.aggregate([
        { $match: paidFilter },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: paidFilter },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' }, category: '$category' },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const revenue = totalsByCategory.find((t) => t._id === 'Revenue')?.total ?? 0;
    const expenses = totalsByCategory.find((t) => t._id === 'Expense')?.total ?? 0;

    const yearly: Record<string, { revenue: number; expenses: number; monthly: Record<string, { revenue: number; expenses: number }> }> = {};
    for (const row of monthlyRaw) {
      const yearKey = String(row._id.year);
      if (!yearly[yearKey]) {
        yearly[yearKey] = {
          revenue: 0,
          expenses: 0,
          monthly: Object.fromEntries(MONTH_KEYS_2_DIGIT.map((m) => [`${yearKey}-${m}`, { revenue: 0, expenses: 0 }])),
        };
      }
      const monthKey = `${yearKey}-${String(row._id.month).padStart(2, '0')}`;
      if (row._id.category === 'Revenue') {
        yearly[yearKey].revenue += row.total;
        yearly[yearKey].monthly[monthKey].revenue += row.total;
      } else {
        yearly[yearKey].expenses += row.total;
        yearly[yearKey].monthly[monthKey].expenses += row.total;
      }
    }
    for (const year of Object.keys(yearly)) {
      yearly[year].revenue = round2(yearly[year].revenue);
      yearly[year].expenses = round2(yearly[year].expenses);
      for (const monthKey of Object.keys(yearly[year].monthly)) {
        yearly[year].monthly[monthKey].revenue = round2(yearly[year].monthly[monthKey].revenue);
        yearly[year].monthly[monthKey].expenses = round2(yearly[year].monthly[monthKey].expenses);
      }
    }

    cached = {
      revenue: round2(revenue),
      expenses: round2(expenses),
      categoryBreakdown: totalsByCategory.map((t) => ({
        category: t._id as string,
        total: round2(t.total),
        count: t.count as number,
      })),
      yearly,
    };
    setCached(cacheKey, cached);
  }

  const recentTransactions = await Transaction.find(recentFilter).sort({ date: -1 }).limit(recentInput.limit).lean();
  const recentTotal = await Transaction.countDocuments(recentFilter);

  res.json({
    // Revenue/expenses/balance are all Paid-only (see paidFilter above). There's no
    // separate "savings" field — it was always identical to balance once Pending
    // transactions stopped counting, so it didn't carry any information balance
    // didn't already have.
    summary: {
      balance: round2(cached.revenue - cached.expenses),
      revenue: cached.revenue,
      expenses: cached.expenses,
    },
    categoryBreakdown: cached.categoryBreakdown,
    yearly: cached.yearly,
    recentTransactions: {
      data: recentTransactions.map(toTransactionDTO),
      total: recentTotal,
      limit: recentInput.limit,
    },
  });
});

export const listTransactionUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await Transaction.aggregate([
    { $group: { _id: '$user_id', user_name: { $first: '$user_name' }, user_profile: { $first: '$user_profile' } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    users: users.map((u) => ({ user_id: u._id as string, user_name: u.user_name, user_profile: u.user_profile })),
  });
});

export const getTransactionStats = asyncHandler(async (_req: Request, res: Response) => {
  // Deliberately not Paid-only: this is about the shape of the dataset itself
  // (how many transactions, how much money has moved through it, how it splits
  // by status/category), not the "what's actually settled" business totals that
  // /summary and /analytics/kpis report. Pending transactions are real rows and
  // belong in a count/volume breakdown.
  const [totalCount, volumeAgg, byStatus, byCategory] = await Promise.all([
    Transaction.countDocuments({}),
    Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    Transaction.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
    Transaction.aggregate([{ $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
  ]);

  res.json({
    totalCount,
    totalVolume: round2(volumeAgg[0]?.total ?? 0),
    byStatus: byStatus.map((s) => ({ status: s._id as string, count: s.count as number, total: round2(s.total) })),
    byCategory: byCategory.map((c) => ({ category: c._id as string, count: c.count as number, total: round2(c.total) })),
  });
});

const compareQuerySchema = z.object({
  periodA: z.string().regex(/^\d{4}-\d{2}$/, 'Expected YYYY-MM'),
  periodB: z.string().regex(/^\d{4}-\d{2}$/, 'Expected YYYY-MM'),
});

function periodFilter(period: string): FilterQuery<TransactionDocument> {
  const [year, month] = period.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { date: { $gte: start, $lt: end } };
}

export const compareSummaryPeriods = asyncHandler(async (req: Request, res: Response) => {
  const { periodA, periodB } = compareQuerySchema.parse(req.query);

  const [a, b] = await Promise.all([computePaidTotals(periodFilter(periodA)), computePaidTotals(periodFilter(periodB))]);

  res.json({
    periodA: { period: periodA, ...a },
    periodB: { period: periodB, ...b },
    difference: {
      revenue: round2(b.revenue - a.revenue),
      expenses: round2(b.expenses - a.expenses),
      balance: round2(b.balance - a.balance),
    },
  });
});

const exportSchema = z.object({
  columns: z.array(z.enum(EXPORTABLE_COLUMNS)).optional(),
  filters: transactionFilterSchema.optional(),
});

export const exportTransactionsCsv = asyncHandler(async (req: Request, res: Response) => {
  const body = exportSchema.parse(req.body);
  const columns: ExportableColumn[] = body.columns && body.columns.length > 0 ? body.columns : [...EXPORTABLE_COLUMNS];
  const filter = buildTransactionFilter(body.filters ?? {});

  const count = await Transaction.countDocuments(filter);
  if (count === 0) {
    throw new ApiError(404, 'No transactions match the selected filters, nothing to export');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `transactions-export-${timestamp}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const cursor = Transaction.find(filter).sort({ date: -1 }).cursor();
  await streamTransactionsAsCsv(res, columns, cursor as AsyncIterable<InstanceType<typeof Transaction>>);
});
