import { useMemo, useState } from 'react';
import { Grid, GridItem, HStack, Stack } from '@chakra-ui/react';
import { FiActivity, FiAward, FiCreditCard, FiDollarSign, FiPieChart, FiTrendingUp } from 'react-icons/fi';
import { AppShell } from '../components/layout/AppShell';
import { MetricCard } from '../components/dashboard/MetricCard';
import { CashflowChart } from '../components/dashboard/CashflowChart';
import { StatsDistributionWidget } from '../components/dashboard/StatsDistributionWidget';
import { AlertChip } from '../components/common/AlertChip';
import { useSummaryQuery } from '../hooks/useTransactionsData';
import { useKpisQuery, useCashflowQuery } from '../hooks/useAnalyticsData';
import { extractErrorMessage } from '../api/client';
import { getLatestYear } from '../utils/analytics';

const PAID_ONLY_TOOLTIP = 'Only Paid transactions are counted. Pending transactions are excluded from all totals.';
const SAVINGS_TOOLTIP = 'Savings reflects your net balance after all paid expenses.';

export function AnalyticsPage() {
  const [search, setSearch] = useState('');

  // Same {} filters as the Dashboard's default view — react-query reuses the
  // already-cached /transactions/summary response if the Dashboard was visited
  // this session, so this page doesn't force a duplicate fetch on first paint.
  const summaryQuery = useSummaryQuery({}, {});
  const latestYear = useMemo(() => getLatestYear(summaryQuery.data?.yearly), [summaryQuery.data?.yearly]);

  const kpisQuery = useKpisQuery(latestYear);
  const cashflowQuery = useCashflowQuery(latestYear);

  return (
    <AppShell title="Analytics" searchValue={search} onSearchChange={setSearch}>
      <Stack spacing={6} pt={2}>
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
            <CashflowChart months={cashflowQuery.data?.months ?? []} isLoading={cashflowQuery.isLoading} />
          </GridItem>
          <GridItem>
            <StatsDistributionWidget />
          </GridItem>
        </Grid>
      </Stack>
    </AppShell>
  );
}
