import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { computePaidTotals } from '../services/transaction.service';

// :id here is the transaction dataset's user_id (e.g. "user_001") — the sample
// data's transacting users, not a row in the separate login-accounts collection.
export const getUserSummary = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const [totals, userDoc, transactionCount] = await Promise.all([
    computePaidTotals({ user_id: id }),
    Transaction.findOne({ user_id: id }).select('user_name').lean(),
    Transaction.countDocuments({ user_id: id }),
  ]);

  if (!userDoc) {
    throw new ApiError(404, `No transactions found for user "${id}"`);
  }

  res.json({
    data: {
      user_id: id,
      user_name: userDoc.user_name,
      revenue: totals.revenue,
      expenses: totals.expenses,
      balance: totals.balance,
      transactionCount,
    },
  });
});
