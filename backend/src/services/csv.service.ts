import { stringify } from 'csv-stringify';
import { Response } from 'express';
import { TransactionDocument } from '../models/Transaction';
import { ExportableColumn } from './transaction.service';

const COLUMN_HEADERS: Record<ExportableColumn, string> = {
  id: 'Transaction ID',
  date: 'Date',
  amount: 'Amount',
  category: 'Category',
  status: 'Status',
  user_id: 'User ID',
  user_name: 'User Name',
};

function formatCell(column: ExportableColumn, doc: TransactionDocument): string | number {
  switch (column) {
    case 'id':
      return doc.id;
    case 'date':
      return doc.date.toISOString().slice(0, 10);
    case 'amount':
      return doc.amount.toFixed(2);
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

export function streamTransactionsAsCsv(
  res: Response,
  columns: ExportableColumn[],
  cursor: AsyncIterable<TransactionDocument>
): Promise<void> {
  const stringifier = stringify({
    header: true,
    columns: columns.map((col) => ({ key: col, header: COLUMN_HEADERS[col] })),
  });

  stringifier.pipe(res);

  return new Promise((resolve, reject) => {
    stringifier.on('error', reject);
    stringifier.on('finish', resolve);

    (async () => {
      try {
        for await (const doc of cursor) {
          const row: Record<string, string | number> = {};
          for (const col of columns) {
            row[col] = formatCell(col, doc);
          }
          if (!stringifier.write(row)) {
            await new Promise((r) => stringifier.once('drain', r));
          }
        }
        stringifier.end();
      } catch (err) {
        stringifier.destroy(err as Error);
      }
    })();
  });
}
