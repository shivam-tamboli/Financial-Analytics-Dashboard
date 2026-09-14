import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose, { FilterQuery } from 'mongoose';
import { Transaction, TransactionDocument } from '../models/Transaction';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import {
  buildTransactionFilter,
  computeTotals,
  EXPORTABLE_COLUMNS,
  ExportableColumn,
  PAID_STATUS,
  resolveStatusMatch,
  round2,
  statusFilterQuerySchema,
  toTransactionDTO,
  transactionFilterSchema,
  transactionQuerySchema,
} from '../services/transaction.service';
import { streamTransactionsAsCsv } from '../services/csv.service';
import { streamTransactionsAsJson } from '../services/json.service';
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

// The most-recent-by-date transactions can genuinely all belong to one user/category
// for stretches of the sample data (e.g. a run of same-day expense entries). Pulling
// a wider pool than we need and swapping in the most recent transaction of a missing
// category keeps the widget honest about there being two categories at all, while
// staying sorted by date and never touching the list when the top N are already mixed.
function diversifyByCategory<T extends { category: string; date: Date }>(pool: T[], limit: number): T[] {
  const top = pool.slice(0, limit);
  if (top.length <= 1 || top.length < limit) return top;

  const presentCategories = new Set(top.map((t) => t.category));
  const missingCategory = pool.find((t) => !presentCategories.has(t.category))?.category;
  if (!missingCategory) return top;

  const replacement = pool.find((t) => t.category === missingCategory);
  if (!replacement) return top;

  const result = [...top];
  result[result.length - 1] = replacement;
  result.sort((a, b) => b.date.getTime() - a.date.getTime());
  return result;
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

  // Fetch a wider pool than requested so a same-category run at the very top of the
  // date-sorted list (see diversifyByCategory above) has somewhere to pull a mix from.
  const recentPoolSize = Math.min(100, Math.max(recentInput.limit * 10, 50));
  const recentPool = await Transaction.find(recentFilter).sort({ date: -1 }).limit(recentPoolSize).lean();
  const recentTransactions = diversifyByCategory(recentPool, recentInput.limit);
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

export const getTransactionStats = asyncHandler(async (req: Request, res: Response) => {
  // Defaults to Paid-only, same as every other aggregate endpoint — this used to
  // be unconditionally all-statuses, which meant its byCategory "Revenue" total
  // didn't match /summary or /analytics/kpis even though all three used the same
  // word. Pass status=all (or status=Pending) to see a different slice.
  const { status } = statusFilterQuerySchema.parse(req.query);
  const matchStatus = resolveStatusMatch(status);

  const [totalCount, volumeAgg, byStatus, byCategory] = await Promise.all([
    Transaction.countDocuments(matchStatus),
    Transaction.aggregate([{ $match: matchStatus }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Transaction.aggregate([{ $match: matchStatus }, { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
    Transaction.aggregate([{ $match: matchStatus }, { $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
  ]);

  res.json({
    data: {
      filter: status,
      totalCount,
      totalVolume: round2(volumeAgg[0]?.total ?? 0),
      byStatus: byStatus.map((s) => ({ status: s._id as string, count: s.count as number, total: round2(s.total) })),
      byCategory: byCategory.map((c) => ({ category: c._id as string, count: c.count as number, total: round2(c.total) })),
    },
  });
});

const compareQuerySchema = statusFilterQuerySchema.extend({
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
  const { periodA, periodB, status } = compareQuerySchema.parse(req.query);
  const matchStatus = resolveStatusMatch(status);

  const [a, b] = await Promise.all([
    computeTotals({ ...periodFilter(periodA), ...matchStatus }),
    computeTotals({ ...periodFilter(periodB), ...matchStatus }),
  ]);

  res.json({
    data: {
      // Explicit, not just implied by a doc comment — this is what was actually
      // compared, whichever status filter was in effect for this request.
      filter: status,
      periodA: { period: periodA, ...a },
      periodB: { period: periodB, ...b },
      difference: {
        revenue: round2(b.revenue - a.revenue),
        expenses: round2(b.expenses - a.expenses),
        balance: round2(b.balance - a.balance),
      },
    },
  });
});

const exportSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  columns: z.array(z.enum(EXPORTABLE_COLUMNS)).optional(),
  filters: transactionFilterSchema.optional(),
});

export const exportTransactions = asyncHandler(async (req: Request, res: Response) => {
  const body = exportSchema.parse(req.body);
  const columns: ExportableColumn[] = body.columns && body.columns.length > 0 ? body.columns : [...EXPORTABLE_COLUMNS];
  const filter = buildTransactionFilter(body.filters ?? {});

  const count = await Transaction.countDocuments(filter);
  if (count === 0) {
    throw new ApiError(404, 'No transactions match the selected filters, nothing to export');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const cursor = Transaction.find(filter).sort({ date: -1 }).cursor() as AsyncIterable<InstanceType<typeof Transaction>>;

  if (body.format === 'json') {
    const filename = `transactions-export-${timestamp}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await streamTransactionsAsJson(res, columns, cursor);
    return;
  }

  const filename = `transactions-export-${timestamp}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await streamTransactionsAsCsv(res, columns, cursor);
});
