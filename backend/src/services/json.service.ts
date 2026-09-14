import { Response } from 'express';
import { TransactionDocument } from '../models/Transaction';
import { ExportableColumn } from './transaction.service';

// Native JS types, not the stringified/truncated cells csv.service uses (amount as
// number not a fixed-2 string, date as a full ISO timestamp) — this is what
// consumers of a JSON export actually want, and matches the same date/amount
// convention every other JSON endpoint in this API already uses via toTransactionDTO.
function jsonValue(column: ExportableColumn, doc: TransactionDocument): string | number {
  switch (column) {
    case 'id':
      return doc.id;
    case 'date':
      return doc.date.toISOString();
    case 'amount':
      return doc.amount;
    case 'category':
      return doc.category;
    case 'status':
      return doc.status;
    case 'user_id':
      return doc.user_id;
    case 'user_name':
      return doc.user_name;
  }
}

export function streamTransactionsAsJson(
  res: Response,
  columns: ExportableColumn[],
  cursor: AsyncIterable<TransactionDocument>
): Promise<void> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        res.write('[');
        let isFirst = true;
        for await (const doc of cursor) {
          const row: Record<string, string | number> = {};
          for (const col of columns) {
            row[col] = jsonValue(col, doc);
          }
          if (!isFirst) res.write(',');
          isFirst = false;
          if (!res.write(JSON.stringify(row))) {
            await new Promise((r) => res.once('drain', r));
          }
        }
        res.end(']');
        resolve();
      } catch (err) {
        // Response headers/body may already be partially sent by this point, so we
        // can't fall back to a clean JSON error response — just end the stream and
        // let the client see a truncated/invalid file rather than hang forever.
        res.end();
        reject(err);
      }
    })();
  });
}
