import { Request, Response } from 'express';
import { z } from 'zod';
import { FilterQuery } from 'mongoose';
import { Transaction, TransactionDocument } from '../models/Transaction';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import {
  buildTransactionFilter,
  EXPORTABLE_COLUMNS,
  ExportableColumn,
  PAID_STATUS,
  toTransactionDTO,
  transactionFilterSchema,
  transactionQuerySchema,
} from '../services/transaction.service';
import { streamTransactionsAsCsv } from '../services/csv.service';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * The API historically only accepted the exact enum casing ('Paid' | 'Pending').
 * The recent-transactions filter spec uses 'completed' as a synonym for 'Paid' —
 * normalize both alias and casing here, before zod's strict enum check, so both
 * conventions work instead of one of them 400ing.
 */
function normalizeStatusQueryParam(query: Request['query']): Request['query'] {
  if (typeof query.status !== 'string') return query;
  const lower = query.status.toLowerCase();
  const normalized = lower === 'completed' ? 'Paid' : lower === 'pending' ? 'Pending' : lower === 'paid' ? 'Paid' : query.status;
  return { ...query, status: normalized };
}

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  const query = transactionQuerySchema.parse(normalizeStatusQueryParam(req.query));
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

const recentTransactionsQuerySchema = z.object({
  filterBy: z.enum(['date', 'status', 'user', 'month', 'year']).optional(),
  user: z.string().trim().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().optional(),
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

  const dateExprs: Record<string, unknown>[] = [];
  if (input.month) dateExprs.push({ $eq: [{ $month: '$date' }, input.month] });
  if (input.year) dateExprs.push({ $eq: [{ $year: '$date' }, input.year] });
  if (dateExprs.length === 1) {
    filter.$expr = dateExprs[0];
  } else if (dateExprs.length > 1) {
    filter.$expr = { $and: dateExprs };
  }

  return filter;
}

export const getTransactionSummary = asyncHandler(async (req: Request, res: Response) => {
  const filterInput = transactionFilterSchema.parse(normalizeStatusQueryParam(req.query));
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

  const [totalsByCategory, monthlyTrendRaw, recentTransactions] = await Promise.all([
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
    Transaction.find(recentFilter)
      .sort({ date: -1 })
      .limit(5)
      .lean(),
  ]);

  const revenue = totalsByCategory.find((t) => t._id === 'Revenue')?.total ?? 0;
  const expenses = totalsByCategory.find((t) => t._id === 'Expense')?.total ?? 0;

  const monthKeys: string[] = [];
  const trendMap = new Map<string, { income: number; expense: number }>();
  const yearly: Record<string, { revenue: number; expenses: number; monthly: Record<string, { revenue: number; expenses: number }> }> = {};

  for (const row of monthlyTrendRaw) {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
    if (!trendMap.has(key)) {
      trendMap.set(key, { income: 0, expense: 0 });
      monthKeys.push(key);
    }
    const bucket = trendMap.get(key)!;

    const yearKey = String(row._id.year);
    if (!yearly[yearKey]) {
      yearly[yearKey] = {
        revenue: 0,
        expenses: 0,
        monthly: Object.fromEntries(MONTH_NAMES.map((m) => [m, { revenue: 0, expenses: 0 }])),
      };
    }
    const monthName = MONTH_NAMES[row._id.month - 1];

    if (row._id.category === 'Revenue') {
      bucket.income += row.total;
      yearly[yearKey].revenue += row.total;
      yearly[yearKey].monthly[monthName].revenue += row.total;
    } else {
      bucket.expense += row.total;
      yearly[yearKey].expenses += row.total;
      yearly[yearKey].monthly[monthName].expenses += row.total;
    }
  }

  const monthlyTrend = monthKeys.sort().map((key) => ({
    month: key,
    income: Math.round(trendMap.get(key)!.income * 100) / 100,
    expense: Math.round(trendMap.get(key)!.expense * 100) / 100,
  }));

  for (const year of Object.keys(yearly)) {
    yearly[year].revenue = Math.round(yearly[year].revenue * 100) / 100;
    yearly[year].expenses = Math.round(yearly[year].expenses * 100) / 100;
    for (const month of MONTH_NAMES) {
      yearly[year].monthly[month].revenue = Math.round(yearly[year].monthly[month].revenue * 100) / 100;
      yearly[year].monthly[month].expenses = Math.round(yearly[year].monthly[month].expenses * 100) / 100;
    }
  }

  res.json({
    // Revenue/expenses/balance/savings are all Paid-only now (see paidFilter above),
    // so balance and savings work out to the same number — that's expected, not a bug.
    summary: {
      balance: Math.round((revenue - expenses) * 100) / 100,
      revenue: Math.round(revenue * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      savings: Math.round((revenue - expenses) * 100) / 100,
    },
    categoryBreakdown: totalsByCategory.map((t) => ({
      category: t._id as string,
      total: Math.round(t.total * 100) / 100,
      count: t.count as number,
    })),
    monthlyTrend,
    yearly,
    recentTransactions: recentTransactions.map(toTransactionDTO),
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
