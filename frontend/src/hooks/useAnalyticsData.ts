import { useQuery } from '@tanstack/react-query';
import {
  fetchCashflow,
  fetchCompare,
  fetchKpis,
  fetchStats,
  fetchTransactionById,
  fetchUserSummary,
} from '../api/analytics';
import type { StatusFilter } from '../types';

export function useKpisQuery(year?: number) {
  return useQuery({
    queryKey: ['analytics-kpis', year],
    queryFn: () => fetchKpis(year),
  });
}

export function useCashflowQuery(year: number | undefined) {
  return useQuery({
    queryKey: ['analytics-cashflow', year],
    queryFn: () => fetchCashflow(year as number),
    enabled: year !== undefined,
  });
}

export function useCompareQuery(periodA: string | undefined, periodB: string | undefined) {
  return useQuery({
    queryKey: ['transactions-compare', periodA, periodB],
    queryFn: () => fetchCompare(periodA as string, periodB as string),
    enabled: Boolean(periodA && periodB),
  });
}

export function useStatsQuery(status?: StatusFilter) {
  return useQuery({
    queryKey: ['transactions-stats', status],
    queryFn: () => fetchStats(status),
  });
}

export function useTransactionByIdQuery(id: string | null) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => fetchTransactionById(id as string),
    enabled: Boolean(id),
  });
}

export function useUserSummaryQuery(userId: string | null) {
  return useQuery({
    queryKey: ['user-summary', userId],
    queryFn: () => fetchUserSummary(userId as string),
    enabled: Boolean(userId),
  });
}
