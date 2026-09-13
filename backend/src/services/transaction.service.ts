import { FilterQuery } from 'mongoose';
import { z } from 'zod';
import { Transaction, TransactionDocument } from '../models/Transaction';

export const SORTABLE_FIELDS = ['date', 'amount', 'category', 'status', 'user_name'] as const;
export const EXPORTABLE_COLUMNS = ['id', 'date', 'amount', 'category', 'status', 'user_id', 'user_name'] as const;

export type SortableField = (typeof SORTABLE_FIELDS)[number];
export type ExportableColumn = (typeof EXPORTABLE_COLUMNS)[number];

export const PAID_STATUS = 'Paid';

// The API used to accept 'Paid'/'Pending' only, then grew a 'completed'/'pending'
// (lowercase) synonym for one caller. Normalizing here — once, in the schema —
// means every route that uses this filter gets consistent input handling for
// free, instead of relying on each controller to remember to call a helper.
function normalizeStatusInput(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const lower = value.toLowerCase();
  if (lower === 'paid' || lower === 'completed') return 'Paid';
  if (lower === 'pending') return 'Pending';
  return value;
}

export const transactionFilterSchema = z.object({
  search: z.string().trim().optional(),
  category: z.enum(['Revenue', 'Expense']).optional(),
  status: z.preprocess(normalizeStatusInput, z.enum(['Paid', 'Pending']).optional()),
  userId: z.string().trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
  // Scope to a specific year and, optionally, a specific month within it — resolved
  // to a date range in buildTransactionFilter, the same way dateFrom/dateTo are, so
  // every aggregate downstream (totals, category breakdown, yearly rollup, and the
  // recent-transactions list, which is built on top of this same filter) is scoped
  // consistently. year is required for month to mean anything on its own.
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export const transactionQuerySchema = transactionFilterSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(SORTABLE_FIELDS).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;

export function buildTransactionFilter(input: TransactionFilterInput): FilterQuery<TransactionDocument> {
  const filter: FilterQuery<TransactionDocument> = {};

  if (input.category) {
    filter.category = input.category;
  }
  if (input.status) {
    filter.status = input.status;
  }
  if (input.userId) {
    filter.user_id = input.userId;
  }

  if (input.year !== undefined) {
    const start = input.month !== undefined ? new Date(Date.UTC(input.year, input.month - 1, 1)) : new Date(Date.UTC(input.year, 0, 1));
    const end = input.month !== undefined ? new Date(Date.UTC(input.year, input.month, 1)) : new Date(Date.UTC(input.year + 1, 0, 1));
    filter.date = { $gte: start, $lt: end };
  } else if (input.dateFrom || input.dateTo) {
    filter.date = {};
    if (input.dateFrom) filter.date.$gte = input.dateFrom;
    if (input.dateTo) filter.date.$lte = input.dateTo;
  }

  if (input.amountMin !== undefined || input.amountMax !== undefined) {
    filter.amount = {};
    if (input.amountMin !== undefined) filter.amount.$gte = input.amountMin;
    if (input.amountMax !== undefined) filter.amount.$lte = input.amountMax;
  }

  if (input.search) {
    const escaped = input.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const orClauses: FilterQuery<TransactionDocument>[] = [
      { user_name: regex },
      { user_id: regex },
      { category: regex },
      { status: regex },
    ];

    const numeric = Number(input.search);
    if (!Number.isNaN(numeric)) {
      orClauses.push({ amount: numeric });
    }

    filter.$or = orClauses;
  }

  return filter;
}

/**
 * `.lean()` queries return plain objects straight from the driver, so the schema's
 * `toJSON` transform (which only fires on hydrated Mongoose documents) never runs.
 * This is the equivalent cleanup for the lean path: Mongo's `_id` becomes the `id`
 * every API response and the frontend use, and never reaches the client.
 */
export function toTransactionDTO<T extends { _id: unknown }>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface PaidTotals {
  revenue: number;
  expenses: number;
  balance: number;
}

// Shared by /transactions/summary, /analytics/kpis, /users/:id/summary, and the
// period-compare endpoint — every place that needs "Paid-only revenue/expenses
// for this filter" reduces to this one aggregation.
export async function computePaidTotals(filter: FilterQuery<TransactionDocument>): Promise<PaidTotals> {
  const rows = await Transaction.aggregate([
    { $match: { ...filter, status: PAID_STATUS } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]);
  const revenue = rows.find((r) => r._id === 'Revenue')?.total ?? 0;
  const expenses = rows.find((r) => r._id === 'Expense')?.total ?? 0;
  return { revenue: round2(revenue), expenses: round2(expenses), balance: round2(revenue - expenses) };
}
