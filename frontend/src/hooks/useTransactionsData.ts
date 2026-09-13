import { useQuery } from '@tanstack/react-query';
import { fetchSummary, fetchTransactions, fetchTransactionUsers } from '../api/transactions';
import type { TransactionFilters, TransactionQuery } from '../types';

export function useTransactionsQuery(query: TransactionQuery) {
  return useQuery({
    queryKey: ['transactions', query],
    queryFn: () => fetchTransactions(query),
    placeholderData: (prev) => prev,
  });
}

export function useSummaryQuery(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions-summary', filters],
    queryFn: () => fetchSummary(filters),
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
