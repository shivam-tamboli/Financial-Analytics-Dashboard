import { useMemo, useState } from 'react';
import { Box, Grid, GridItem, HStack, Stack } from '@chakra-ui/react';
import { FiActivity, FiAward, FiCreditCard, FiDollarSign, FiPieChart, FiTrendingUp } from 'react-icons/fi';
import { AppShell } from '../components/layout/AppShell';
import { MetricCard } from '../components/dashboard/MetricCard';
import { OverviewChart } from '../components/dashboard/OverviewChart';
import { CategoryBreakdownChart } from '../components/dashboard/CategoryBreakdownChart';
import { CashflowChart } from '../components/dashboard/CashflowChart';
import { ComparePanel } from '../components/dashboard/ComparePanel';
import { StatsDistributionWidget } from '../components/dashboard/StatsDistributionWidget';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { TransactionsSection } from '../components/transactions/TransactionsSection';
import { AlertChip } from '../components/common/AlertChip';
import { useSummaryQuery, useTransactionUsersQuery } from '../hooks/useTransactionsData';
import { useKpisQuery, useCashflowQuery } from '../hooks/useAnalyticsData';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { extractErrorMessage } from '../api/client';
import type { RecentTransactionsFilter, TransactionFilters } from '../types';

const PAID_ONLY_TOOLTIP = 'Only Paid transactions are counted. Pending transactions are excluded from all totals.';
const SAVINGS_TOOLTIP = 'Savings reflects your net balance after all paid expenses.';

export function DashboardPage() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [recentFilter, setRecentFilter] = useState<RecentTransactionsFilter>({});
  const debouncedFilters = useDebouncedValue(filters, 350);

  const summaryQuery = useSummaryQuery(debouncedFilters, recentFilter);
  const usersQuery = useTransactionUsersQuery();

  // The sample dataset is all dated 2024; deriving "latest year" from data already
  // in hand (rather than hardcoding 2024, or using the server's current year) keeps
  // this correct if the dataset ever grows to span more years.
  const latestYear = useMemo(() => {
    const years = Object.keys(summaryQuery.data?.yearly ?? {}).sort();
    return years.length > 0 ? Number(years.at(-1)) : undefined;
  }, [summaryQuery.data?.yearly]);

  const kpisQuery = useKpisQuery(latestYear);
  const cashflowQuery = useCashflowQuery(latestYear);

  return (
    <AppShell
      searchValue={filters.search ?? ''}
      onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
    >
      <Stack spacing={6} pt={2}>
        {summaryQuery.isError && (
          <AlertChip status="error" message={extractErrorMessage(summaryQuery.error, 'Failed to load dashboard metrics')} />
        )}
        {kpisQuery.isError && (
          <AlertChip status="error" message={extractErrorMessage(kpisQuery.error, 'Failed to load KPI metrics')} />
        )}

        <HStack spacing={4} wrap="wrap">
          <MetricCard
            label="Balance"
            value={kpisQuery.data?.balance ?? 0}
            icon={FiDollarSign}
            accent="#22c55e"
            isLoading={kpisQuery.isLoading}
            tooltip={PAID_ONLY_TOOLTIP}
          />
          <MetricCard
            label="Revenue"
            value={kpisQuery.data?.revenue ?? 0}
            icon={FiTrendingUp}
            accent="#22c55e"
            isLoading={kpisQuery.isLoading}
            tooltip={PAID_ONLY_TOOLTIP}
          />
          <MetricCard
            label="Expenses"
            value={kpisQuery.data?.expenses ?? 0}
            icon={FiCreditCard}
            accent="#f5a623"
            isLoading={kpisQuery.isLoading}
            tooltip={PAID_ONLY_TOOLTIP}
          />
          <MetricCard
            label="Savings"
            value={kpisQuery.data?.balance ?? 0}
            icon={FiPieChart}
            accent="#38bdf8"
            isLoading={kpisQuery.isLoading}
            tooltip={SAVINGS_TOOLTIP}
          />
          <MetricCard
            label="Avg. Transaction Value"
            value={kpisQuery.data?.averageTransactionValue ?? 0}
            icon={FiActivity}
            accent="#a78bfa"
            isLoading={kpisQuery.isLoading}
            tooltip={PAID_ONLY_TOOLTIP}
          />
          <MetricCard
            label="Top Category"
            value={0}
            displayValue={kpisQuery.data?.topCategory ?? '—'}
            icon={FiAward}
            accent="#22c55e"
            isLoading={kpisQuery.isLoading}
            tooltip={`${PAID_ONLY_TOOLTIP} Whichever of Revenue/Expense has the larger total.`}
          />
        </HStack>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6} alignItems="stretch">
          <GridItem>
            <OverviewChart yearly={summaryQuery.data?.yearly ?? {}} isLoading={summaryQuery.isLoading} />
          </GridItem>
          <GridItem>
            <Stack spacing={6} h="full">
              <CategoryBreakdownChart data={summaryQuery.data?.categoryBreakdown ?? []} isLoading={summaryQuery.isLoading} />
              <Box flex={1}>
                <RecentTransactions
                  transactions={summaryQuery.data?.recentTransactions.data ?? []}
                  total={summaryQuery.data?.recentTransactions.total ?? 0}
                  isLoading={summaryQuery.isLoading}
                  filter={recentFilter}
                  onFilterChange={setRecentFilter}
                />
              </Box>
            </Stack>
          </GridItem>
        </Grid>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6} alignItems="stretch">
          <GridItem>
            <CashflowChart months={cashflowQuery.data?.months ?? []} isLoading={cashflowQuery.isLoading} />
          </GridItem>
          <GridItem>
            <Stack spacing={6} h="full">
              <ComparePanel />
              <StatsDistributionWidget />
            </Stack>
          </GridItem>
        </Grid>

        <TransactionsSection filters={filters} onFiltersChange={setFilters} users={usersQuery.data ?? []} />
      </Stack>
    </AppShell>
  );
}
