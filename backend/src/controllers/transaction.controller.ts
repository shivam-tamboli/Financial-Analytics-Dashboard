import { Request, Response } from 'express';
import { z } from 'zod';
import { Transaction } from '../models/Transaction';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import {
  buildTransactionFilter,
  EXPORTABLE_COLUMNS,
  ExportableColumn,
  transactionFilterSchema,
  transactionQuerySchema,
} from '../services/transaction.service';
import { streamTransactionsAsCsv } from '../services/csv.service';

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  const query = transactionQuerySchema.parse(req.query);
  const filter = buildTransactionFilter(query);
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const skip = (query.page - 1) * query.limit;

  const [data, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ [query.sortBy]: sortDirection, id: 1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  });
});

export const getTransactionSummary = asyncHandler(async (req: Request, res: Response) => {
  const filterInput = transactionFilterSchema.parse(req.query);
  const filter = buildTransactionFilter(filterInput);

  const [totalsByCategory, totalsByStatus, monthlyTrendRaw, recentTransactions] = await Promise.all([
    Transaction.aggregate([
      { $match: filter },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { status: '$status', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, category: '$category' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Transaction.find(filter).sort({ date: -1 }).limit(5).lean(),
  ]);

  const revenue = totalsByCategory.find((t) => t._id === 'Revenue')?.total ?? 0;
  const expenses = totalsByCategory.find((t) => t._id === 'Expense')?.total ?? 0;

  const paidRevenue =
    totalsByStatus.find((t) => t._id.status === 'Paid' && t._id.category === 'Revenue')?.total ?? 0;
  const paidExpenses =
    totalsByStatus.find((t) => t._id.status === 'Paid' && t._id.category === 'Expense')?.total ?? 0;

  const monthKeys: string[] = [];
  const trendMap = new Map<string, { income: number; expense: number }>();
  for (const row of monthlyTrendRaw) {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
    if (!trendMap.has(key)) {
      trendMap.set(key, { income: 0, expense: 0 });
      monthKeys.push(key);
    }
    const bucket = trendMap.get(key)!;
    if (row._id.category === 'Revenue') bucket.income += row.total;
    else bucket.expense += row.total;
  }

  const monthlyTrend = monthKeys.sort().map((key) => ({
    month: key,
    income: Math.round(trendMap.get(key)!.income * 100) / 100,
    expense: Math.round(trendMap.get(key)!.expense * 100) / 100,
  }));

  res.json({
    metrics: {
      balance: Math.round((revenue - expenses) * 100) / 100,
      revenue: Math.round(revenue * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      savings: Math.round((paidRevenue - paidExpenses) * 100) / 100,
    },
    categoryBreakdown: totalsByCategory.map((t) => ({
      category: t._id as string,
      total: Math.round(t.total * 100) / 100,
      count: t.count as number,
    })),
    monthlyTrend,
    recentTransactions,
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
