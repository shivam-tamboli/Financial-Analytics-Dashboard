import { useQuery } from '@tanstack/react-query';
import { fetchSummary, fetchTransactions, fetchTransactionUsers } from '../api/transactions';
import type { RecentTransactionsFilter, TransactionFilters, TransactionQuery } from '../types';

export function useTransactionsQuery(query: TransactionQuery) {
  return useQuery({
    queryKey: ['transactions', query],
    queryFn: () => fetchTransactions(query),
    placeholderData: (prev) => prev,
  });
}

export function useSummaryQuery(filters: TransactionFilters, recentFilter: RecentTransactionsFilter = {}) {
  return useQuery({
    queryKey: ['transactions-summary', filters, recentFilter],
    queryFn: () => fetchSummary(filters, recentFilter),
    placeholderData: (prev) => prev,
  });
}

export function useTransactionUsersQuery() {
  return useQuery({
    queryKey: ['transaction-users'],
    queryFn: fetchTransactionUsers,
    staleTime: 5 * 60_000,
  });
}
