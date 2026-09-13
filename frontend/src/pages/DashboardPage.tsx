import { useState } from 'react';
import { Box, Grid, GridItem, HStack, Stack } from '@chakra-ui/react';
import { FiCreditCard, FiDollarSign, FiPieChart, FiTrendingUp } from 'react-icons/fi';
import { AppShell } from '../components/layout/AppShell';
import { MetricCard } from '../components/dashboard/MetricCard';
import { OverviewChart } from '../components/dashboard/OverviewChart';
import { CategoryBreakdownChart } from '../components/dashboard/CategoryBreakdownChart';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { TransactionsSection } from '../components/transactions/TransactionsSection';
import { AlertChip } from '../components/common/AlertChip';
import { useSummaryQuery, useTransactionUsersQuery } from '../hooks/useTransactionsData';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { extractErrorMessage } from '../api/client';
import type { TransactionFilters } from '../types';

export function DashboardPage() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const debouncedFilters = useDebouncedValue(filters, 350);

  const summaryQuery = useSummaryQuery(debouncedFilters);
  const usersQuery = useTransactionUsersQuery();

  return (
    <AppShell
      searchValue={filters.search ?? ''}
      onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
    >
      <Stack spacing={6} pt={2}>
        {summaryQuery.isError && (
          <AlertChip status="error" message={extractErrorMessage(summaryQuery.error, 'Failed to load dashboard metrics')} />
        )}

        <HStack spacing={4} wrap="wrap">
          <MetricCard
            label="Balance"
            value={summaryQuery.data?.metrics.balance ?? 0}
            icon={FiDollarSign}
            accent="#22c55e"
            isLoading={summaryQuery.isLoading}
          />
          <MetricCard
            label="Revenue"
            value={summaryQuery.data?.metrics.revenue ?? 0}
            icon={FiTrendingUp}
            accent="#22c55e"
            isLoading={summaryQuery.isLoading}
          />
          <MetricCard
            label="Expenses"
            value={summaryQuery.data?.metrics.expenses ?? 0}
            icon={FiCreditCard}
            accent="#f5a623"
            isLoading={summaryQuery.isLoading}
          />
          <MetricCard
            label="Savings (paid)"
            value={summaryQuery.data?.metrics.savings ?? 0}
            icon={FiPieChart}
            accent="#38bdf8"
            isLoading={summaryQuery.isLoading}
          />
        </HStack>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6} alignItems="stretch">
          <GridItem>
            <OverviewChart data={summaryQuery.data?.monthlyTrend ?? []} isLoading={summaryQuery.isLoading} />
          </GridItem>
          <GridItem>
            <Stack spacing={6} h="full">
              <CategoryBreakdownChart data={summaryQuery.data?.categoryBreakdown ?? []} isLoading={summaryQuery.isLoading} />
              <Box flex={1}>
                <RecentTransactions
                  transactions={summaryQuery.data?.recentTransactions ?? []}
                  isLoading={summaryQuery.isLoading}
                />
              </Box>
            </Stack>
          </GridItem>
        </Grid>

        <TransactionsSection filters={filters} onFiltersChange={setFilters} users={usersQuery.data ?? []} />
      </Stack>
    </AppShell>
  );
}
