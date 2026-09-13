import { useState } from 'react';
import { Box, Flex, Grid, HStack, Input, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useCompareQuery } from '../../hooks/useAnalyticsData';
import { formatCompactCurrency } from '../../utils/format';
import { EmptyState } from '../common/EmptyState';
import { AlertChip } from '../common/AlertChip';
import { extractErrorMessage } from '../../api/client';

const selectStyle = {
  bg: 'surface.panelAlt',
  border: '1px solid',
  borderColor: 'surface.border',
  fontSize: 'sm',
};

function DiffText({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <Text fontSize="xs" fontWeight={600} color={positive ? 'brand.400' : 'accent.500'}>
      {positive ? '+' : ''}
      {formatCompactCurrency(value)}
    </Text>
  );
}

function PeriodCard({ label, revenue, expenses, balance }: { label: string; revenue: number; expenses: number; balance: number }) {
  return (
    <VStack align="stretch" spacing={2} bg="surface.panelAlt" border="1px solid" borderColor="surface.border" borderRadius="lg" p={3}>
      <Text fontSize="xs" color="surface.muted" fontWeight={600}>
        {label}
      </Text>
      <HStack justify="space-between">
        <Text fontSize="xs" color="surface.muted">Revenue</Text>
        <Text fontSize="sm" fontWeight={600}>{formatCompactCurrency(revenue)}</Text>
      </HStack>
      <HStack justify="space-between">
        <Text fontSize="xs" color="surface.muted">Expenses</Text>
        <Text fontSize="sm" fontWeight={600}>{formatCompactCurrency(expenses)}</Text>
      </HStack>
      <HStack justify="space-between">
        <Text fontSize="xs" color="surface.muted">Balance</Text>
        <Text fontSize="sm" fontWeight={700}>{formatCompactCurrency(balance)}</Text>
      </HStack>
    </VStack>
  );
}

export function ComparePanel() {
  const [periodA, setPeriodA] = useState('');
  const [periodB, setPeriodB] = useState('');

  const query = useCompareQuery(periodA || undefined, periodB || undefined);

  return (
    <Box bg="surface.panel" border="1px solid" borderColor="surface.border" borderRadius="xl" p={5}>
      <Text fontWeight={700} fontSize="lg" mb={4}>
        Compare
      </Text>

      <Flex gap={3} mb={4} wrap="wrap">
        <Box flex={1} minW="140px">
          <Text fontSize="xs" color="surface.muted" mb={1}>Period A</Text>
          <Input type="month" size="sm" value={periodA} onChange={(e) => setPeriodA(e.target.value)} {...selectStyle} />
        </Box>
        <Box flex={1} minW="140px">
          <Text fontSize="xs" color="surface.muted" mb={1}>Period B</Text>
          <Input type="month" size="sm" value={periodB} onChange={(e) => setPeriodB(e.target.value)} {...selectStyle} />
        </Box>
      </Flex>

      {query.isError && (
        <Box mb={3}>
          <AlertChip status="error" message={extractErrorMessage(query.error, 'Failed to load comparison')} />
        </Box>
      )}

      {!periodA || !periodB ? (
        <EmptyState title="Pick two months" description="Choose Period A and Period B to compare revenue, expenses, and balance." />
      ) : query.isLoading ? (
        <Skeleton height="140px" startColor="surface.panelAlt" endColor="surface.border" borderRadius="lg" />
      ) : query.data ? (
        <VStack align="stretch" spacing={3}>
          <Grid templateColumns="1fr 1fr" gap={3}>
            <PeriodCard label={query.data.periodA.period} revenue={query.data.periodA.revenue} expenses={query.data.periodA.expenses} balance={query.data.periodA.balance} />
            <PeriodCard label={query.data.periodB.period} revenue={query.data.periodB.revenue} expenses={query.data.periodB.expenses} balance={query.data.periodB.balance} />
          </Grid>
          <HStack justify="space-between" px={1}>
            <Text fontSize="xs" color="surface.muted">Difference (B − A)</Text>
            <HStack spacing={3}>
              <DiffText value={query.data.difference.revenue} />
              <DiffText value={query.data.difference.expenses} />
              <DiffText value={query.data.difference.balance} />
            </HStack>
          </HStack>
        </VStack>
      ) : null}
    </Box>
  );
}
