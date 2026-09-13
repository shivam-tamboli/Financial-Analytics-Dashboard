import axios from 'axios';
import { apiClient } from './client';
import type {
  ExportableColumn,
  RecentTransactionsFilter,
  SummaryResponse,
  TransactionFilters,
  TransactionListResponse,
  TransactionQuery,
  TransactionUser,
} from '../types';

function cleanParams(params: object): Record<string, string | number> {
  const cleaned: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    cleaned[key] = value as string | number;
  }
  return cleaned;
}

export async function fetchTransactions(query: TransactionQuery): Promise<TransactionListResponse> {
  const { data } = await apiClient.get<TransactionListResponse>('/transactions', {
    params: cleanParams(query),
  });
  return data;
}

export async function fetchSummary(
  filters: TransactionFilters,
  recentFilter: RecentTransactionsFilter = {}
): Promise<SummaryResponse> {
  const { data } = await apiClient.get<SummaryResponse>('/transactions/summary', {
    params: cleanParams({ ...filters, ...recentFilter }),
  });
  return data;
}

export async function fetchTransactionUsers(): Promise<TransactionUser[]> {
  const { data } = await apiClient.get<{ users: TransactionUser[] }>('/transactions/users');
  return data.users;
}

export async function exportTransactionsCsv(
  columns: ExportableColumn[],
  filters: TransactionFilters
): Promise<{ blob: Blob; filename: string }> {
  try {
    const response = await apiClient.post(
      '/transactions/export',
      { columns, filters: cleanParams(filters) },
      { responseType: 'blob' }
    );

    const disposition: string = response.headers['content-disposition'] ?? '';
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const filename = match?.[1] ?? `transactions-export-${Date.now()}.csv`;

    return { blob: response.data as Blob, filename };
  } catch (err) {
    // With responseType: 'blob', axios coerces even a JSON error body into a Blob —
    // decode it back to text to surface the real server message instead of a generic one.
    if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      let message = 'Export failed';
      try {
        const parsed = JSON.parse(text) as { error?: { message?: string } };
        if (parsed.error?.message) message = parsed.error.message;
      } catch {
        // response body wasn't JSON; fall back to the generic message
      }
      throw new Error(message);
    }
    throw err;
  }
}
