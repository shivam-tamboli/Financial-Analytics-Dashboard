import { apiClient } from './client';
import type {
  CashflowResponse,
  CompareResponse,
  KpisResponse,
  StatsResponse,
  StatusFilter,
  Transaction,
  UserSummaryResponse,
} from '../types';

function cleanParams(params: object): Record<string, string | number> {
  const cleaned: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    cleaned[key] = value as string | number;
  }
  return cleaned;
}

export async function fetchKpis(year?: number): Promise<KpisResponse> {
  const { data } = await apiClient.get<{ data: KpisResponse }>('/analytics/kpis', {
    params: cleanParams({ year }),
  });
  return data.data;
}

export async function fetchCashflow(year: number): Promise<CashflowResponse> {
  const { data } = await apiClient.get<{ data: CashflowResponse }>('/analytics/cashflow', {
    params: { year },
  });
  return data.data;
}

export async function fetchCompare(periodA: string, periodB: string): Promise<CompareResponse> {
  const { data } = await apiClient.get<{ data: CompareResponse }>('/transactions/summary/compare', {
    params: { periodA, periodB },
  });
  return data.data;
}

export async function fetchStats(status?: StatusFilter): Promise<StatsResponse> {
  const { data } = await apiClient.get<{ data: StatsResponse }>('/transactions/stats', {
    params: cleanParams({ status }),
  });
  return data.data;
}

export async function fetchTransactionById(id: string): Promise<Transaction> {
  const { data } = await apiClient.get<{ data: Transaction }>(`/transactions/${id}`);
  return data.data;
}

export async function fetchUserSummary(userId: string): Promise<UserSummaryResponse> {
  const { data } = await apiClient.get<{ data: UserSummaryResponse }>(`/users/${userId}/summary`);
  return data.data;
}
