import { Request, Response } from 'express';
import { z } from 'zod';
import { Transaction } from '../models/Transaction';
import { asyncHandler } from '../utils/asyncHandler';
import { resolveStatusMatch, round2, statusFilterQuerySchema } from '../services/transaction.service';

const kpisQuerySchema = statusFilterQuerySchema.extend({
  year: z.coerce.number().int().optional(),
});

export const getKpis = asyncHandler(async (req: Request, res: Response) => {
  const { status, year } = kpisQuerySchema.parse(req.query);
  const matchStatus = resolveStatusMatch(status);
  // All-time by default (unchanged from before year support existed) — pass
  // ?year= to scope to one calendar year, the same date-range approach cashflow
  // uses. With a single-year sample dataset the numbers come out identical
  // either way; this matters once the dataset spans more than one year.
  const matchYear =
    year === undefined ? {} : { date: { $gte: new Date(Date.UTC(year, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) } };

  const rows = await Transaction.aggregate([
    { $match: { ...matchStatus, ...matchYear } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const revenueRow = rows.find((r) => r._id === 'Revenue');
  const expenseRow = rows.find((r) => r._id === 'Expense');
  const revenue = revenueRow?.total ?? 0;
  const expenses = expenseRow?.total ?? 0;
  // Same rows feed count, average, and topCategory, so all three are guaranteed
  // to describe the same filtered set as revenue/expenses — there's no way for
  // count to be "Paid-only" while average quietly includes Pending.
  const transactionCount = (revenueRow?.count ?? 0) + (expenseRow?.count ?? 0);
  const averageTransactionValue = transactionCount > 0 ? (revenue + expenses) / transactionCount : 0;

  res.json({
    data: {
      filter: status,
      year: year ?? null,
      revenue: round2(revenue),
      expenses: round2(expenses),
      balance: round2(revenue - expenses),
      transactionCount,
      averageTransactionValue: round2(averageTransactionValue),
      topCategory: revenue >= expenses ? 'Revenue' : 'Expense',
    },
  });
});

const cashflowQuerySchema = statusFilterQuerySchema.extend({
  year: z.coerce.number().int().optional(),
});

export const getCashflow = asyncHandler(async (req: Request, res: Response) => {
  const { status, year: requestedYear } = cashflowQuerySchema.parse(req.query);
  const matchStatus = resolveStatusMatch(status);

  let year = requestedYear;
  if (year === undefined) {
    // Default to the most recent year that actually has data under this status
    // filter, rather than the real calendar year the server happens to be
    // running in — with a fixed sample dataset (all dated 2024), "today's year"
    // is almost never the right default and just returns 12 zeroed months.
    const latest = await Transaction.findOne(matchStatus).sort({ date: -1 }).select('date').lean();
    if (!latest) {
      res.json({ data: { year: null, filter: status, months: [] } });
      return;
    }
    year = latest.date.getUTCFullYear();
  }

  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const rows = await Transaction.aggregate([
    { $match: { ...matchStatus, date: { $gte: start, $lt: end } } },
    { $group: { _id: { month: { $month: '$date' }, category: '$category' }, total: { $sum: '$amount' } } },
  ]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const revenue = rows.find((r) => r._id.month === monthNum && r._id.category === 'Revenue')?.total ?? 0;
    const expenses = rows.find((r) => r._id.month === monthNum && r._id.category === 'Expense')?.total ?? 0;
    return {
      month: `${year}-${String(monthNum).padStart(2, '0')}`,
      revenue: round2(revenue),
      expenses: round2(expenses),
      cashflow: round2(revenue - expenses),
    };
  });

  res.json({ data: { year, filter: status, months } });
});
