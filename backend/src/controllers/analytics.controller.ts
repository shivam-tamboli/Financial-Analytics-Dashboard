import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction';
import { asyncHandler } from '../utils/asyncHandler';
import { PAID_STATUS, round2 } from '../services/transaction.service';

export const getKpis = asyncHandler(async (_req: Request, res: Response) => {
  // Paid-only, consistent with /transactions/summary's revenue/expenses/balance.
  const rows = await Transaction.aggregate([
    { $match: { status: PAID_STATUS } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const revenueRow = rows.find((r) => r._id === 'Revenue');
  const expenseRow = rows.find((r) => r._id === 'Expense');
  const revenue = revenueRow?.total ?? 0;
  const expenses = expenseRow?.total ?? 0;
  const transactionCount = (revenueRow?.count ?? 0) + (expenseRow?.count ?? 0);
  const averageTransactionValue = transactionCount > 0 ? (revenue + expenses) / transactionCount : 0;

  res.json({
    totalRevenue: round2(revenue),
    totalExpenses: round2(expenses),
    balance: round2(revenue - expenses),
    transactionCount,
    averageTransactionValue: round2(averageTransactionValue),
    topCategory: revenue >= expenses ? 'Revenue' : 'Expense',
  });
});

export const getCashflow = asyncHandler(async (_req: Request, res: Response) => {
  // "Current year" means the real calendar year the server is running in, not the
  // most recent year present in the data — with this sample dataset (all dated
  // 2024) that means every month here will legitimately come back at 0 unless the
  // year the app happens to run in matches. That's correct behavior for what was
  // asked, not a bug in the query.
  const year = new Date().getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const rows = await Transaction.aggregate([
    { $match: { status: PAID_STATUS, date: { $gte: start, $lt: end } } },
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

  res.json({ year, months });
});
