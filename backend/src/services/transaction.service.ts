import { FilterQuery } from 'mongoose';
import { z } from 'zod';
import { TransactionDocument } from '../models/Transaction';

export const SORTABLE_FIELDS = ['date', 'amount', 'category', 'status', 'user_name', 'id'] as const;
export const EXPORTABLE_COLUMNS = ['id', 'date', 'amount', 'category', 'status', 'user_id', 'user_name'] as const;

export type SortableField = (typeof SORTABLE_FIELDS)[number];
export type ExportableColumn = (typeof EXPORTABLE_COLUMNS)[number];

export const transactionFilterSchema = z.object({
  search: z.string().trim().optional(),
  category: z.enum(['Revenue', 'Expense']).optional(),
  status: z.enum(['Paid', 'Pending']).optional(),
  userId: z.string().trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
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

  if (input.dateFrom || input.dateTo) {
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
      orClauses.push({ id: numeric });
    }

    filter.$or = orClauses;
  }

  return filter;
}
