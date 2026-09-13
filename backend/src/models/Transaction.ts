import { Schema, model, Document } from 'mongoose';
import { TransactionCategory, TransactionStatus } from '../types';

export interface TransactionDocument extends Document {
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
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    category: { type: String, enum: ['Revenue', 'Expense'], required: true },
    status: { type: String, enum: ['Paid', 'Pending'], required: true },
    user_id: { type: String, required: true },
    user_name: { type: String, required: true },
    user_profile: { type: String, required: true },
  },
  {
    versionKey: false,
    // Mongoose already adds a virtual `id` getter (string form of _id) to every
    // schema unless a real path named `id` exists — we used to define one, which
    // shadowed it. Now that it's gone, `doc.id` and JSON output both resolve to
    // the Mongo id automatically, so _id never needs to reach the client.
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        return ret;
      },
    },
  }
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
