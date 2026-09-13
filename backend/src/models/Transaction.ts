import { Schema, model, Document } from 'mongoose';
import { TransactionCategory, TransactionStatus } from '../types';

export interface TransactionDocument extends Document {
  id: number;
  date: Date;
  amount: number;
  category: TransactionCategory;
  status: TransactionStatus;
  user_id: string;
  user_name: string;
  user_profile: string;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    id: { type: Number, required: true, unique: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    category: { type: String, enum: ['Revenue', 'Expense'], required: true },
    status: { type: String, enum: ['Paid', 'Pending'], required: true },
    user_id: { type: String, required: true },
    user_name: { type: String, required: true },
    user_profile: { type: String, required: true },
  },
  { versionKey: false }
);

// Compound index supporting the common filter shape (category/status) sorted by date,
// which covers the default transaction table query without a separate sort pass.
transactionSchema.index({ category: 1, status: 1, date: -1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ user_id: 1 });
transactionSchema.index({ amount: 1 });
// Supports the free-text search box, which matches by regex (not $text) so it can do
// case-insensitive substring matches on user_name/user_id rather than whole-word stemming.
transactionSchema.index({ user_name: 1 });

export const Transaction = model<TransactionDocument>('Transaction', transactionSchema);
