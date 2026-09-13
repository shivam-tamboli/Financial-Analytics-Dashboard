export type TransactionCategory = 'Revenue' | 'Expense';
export type TransactionStatus = 'Paid' | 'Pending';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: TransactionCategory;
  status: TransactionStatus;
  user_id: string;
  user_name: string;
  user_profile: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionListResponse {
  data: Transaction[];
  pagination: Pagination;
}

export interface TransactionUser {
  user_id: string;
  user_name: string;
  user_profile: string;
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  total: number;
  count: number;
}

export interface MonthlyTrendPoint {
  month: string;
  income: number;
  expense: number;
}

export interface MonthBreakdown {
  revenue: number;
  expenses: number;
}

export interface YearBreakdown {
  revenue: number;
  expenses: number;
  monthly: Record<string, MonthBreakdown>;
}

export interface SummaryResponse {
  summary: {
    balance: number;
    revenue: number;
    expenses: number;
    savings: number;
  };
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrend: MonthlyTrendPoint[];
  yearly: Record<string, YearBreakdown>;
  recentTransactions: Transaction[];
}

export type SortableField = 'date' | 'amount' | 'category' | 'status' | 'user_name';
export type SortOrder = 'asc' | 'desc';

export type RecentTransactionsFilterBy = 'date' | 'status' | 'user' | 'month' | 'year';

export interface RecentTransactionsFilter {
  filterBy?: RecentTransactionsFilterBy;
  status?: TransactionStatus;
  user?: string;
  month?: number;
  year?: number;
}

export interface TransactionFilters {
  search?: string;
  category?: TransactionCategory;
  status?: TransactionStatus;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface TransactionQuery extends TransactionFilters {
  page: number;
  limit: number;
  sortBy: SortableField;
  sortOrder: SortOrder;
}

export const EXPORTABLE_COLUMNS = ['id', 'date', 'amount', 'category', 'status', 'user_id', 'user_name'] as const;
export type ExportableColumn = (typeof EXPORTABLE_COLUMNS)[number];

export const EXPORT_COLUMN_LABELS: Record<ExportableColumn, string> = {
  id: 'Transaction ID',
  date: 'Date',
  amount: 'Amount',
  category: 'Category',
  status: 'Status',
  user_id: 'User ID',
  user_name: 'User Name',
};

export interface AuthUser {
  id: string;
  username: string;
  name: string;
}

export interface ApiErrorPayload {
  error: {
    message: string;
    details?: { path: string; message: string }[];
  };
}
