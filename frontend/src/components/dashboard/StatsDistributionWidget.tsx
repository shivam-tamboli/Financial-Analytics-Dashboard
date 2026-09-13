import { Box, Flex, HStack, Skeleton, Text, Tooltip, VStack } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useStatsQuery } from '../../hooks/useAnalyticsData';
import { EmptyState } from '../common/EmptyState';
import { AlertChip } from '../common/AlertChip';
import { extractErrorMessage } from '../../api/client';

const STATUS_COLORS: Record<string, string> = {
  Paid: '#22c55e',
  Pending: '#f5a623',
};

const CATEGORY_COLORS: Record<string, string> = {
  Revenue: '#22c55e',
  Expense: '#f5a623',
};

function Donut({
  data,
  colors,
}: {
  data: { key: string; count: number; total: number }[];
  colors: Record<string, string>;
}) {
  return (
    <Flex align="center" gap={4}>
      <Box w="110px" h="110px" flexShrink={0}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="key" innerRadius={34} outerRadius={50} paddingAngle={3} stroke="none">
              {data.map((entry) => (
                <Cell key={entry.key} fill={colors[entry.key] ?? '#8b95a1'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <VStack align="stretch" spacing={2} flex={1} minW={0}>
        {data.map((entry) => (
          <HStack key={entry.key} justify="space-between">
            <HStack spacing={2}>
              <Box boxSize={2.5} borderRadius="full" bg={colors[entry.key] ?? '#8b95a1'} />
              <Text fontSize="sm">
                {entry.key} ({entry.count})
              </Text>
            </HStack>
          </HStack>
        ))}
      </VStack>
    </Flex>
  );
}

export function StatsDistributionWidget() {
  // Explicitly status=all here — the point of this widget is showing the Paid vs
  // Pending split, which the app's default Paid-only filter would otherwise hide.
  const query = useStatsQuery('all');

  return (
    <Box bg="surface.panel" border="1px solid" borderColor="surface.border" borderRadius="xl" p={5}>
      <HStack spacing={1.5} mb={1}>
        <Text fontWeight={700} fontSize="lg">
          Stats Distribution
        </Text>
        <Tooltip
          label="These counts include ALL transactions (Paid and Pending), unlike the Paid-only KPI cards above."
          fontSize="xs"
          placement="top"
          hasArrow
          bg="surface.panelAlt"
          color="text.primary"
        >
          <Box as="span" display="inline-flex" cursor="help">
            <FiInfo size={13} color="var(--chakra-colors-surface-muted)" />
          </Box>
        </Tooltip>
      </HStack>
      <Text fontSize="xs" color="surface.muted" mb={4}>
        Includes all transactions, regardless of status
      </Text>

      {query.isError && (
        <Box mb={3}>
          <AlertChip status="error" message={extractErrorMessage(query.error, 'Failed to load stats')} />
        </Box>
      )}

      {query.isLoading ? (
        <VStack spacing={4} align="stretch">
          <Skeleton height="100px" startColor="surface.panelAlt" endColor="surface.border" borderRadius="lg" />
          <Skeleton height="100px" startColor="surface.panelAlt" endColor="surface.border" borderRadius="lg" />
        </VStack>
      ) : !query.data || query.data.totalCount === 0 ? (
        <EmptyState title="No data" description="No transactions in the dataset." />
      ) : (
        <VStack spacing={5} align="stretch">
          <Box>
            <Text fontSize="xs" fontWeight={600} color="surface.muted" mb={2}>
              Status
            </Text>
            <Donut
              data={query.data.byStatus.map((s) => ({ key: s.status, count: s.count, total: s.total }))}
              colors={STATUS_COLORS}
            />
          </Box>
          <Box>
            <Text fontSize="xs" fontWeight={600} color="surface.muted" mb={2}>
              Category
            </Text>
            <Donut
              data={query.data.byCategory.map((c) => ({ key: c.category, count: c.count, total: c.total }))}
              colors={CATEGORY_COLORS}
            />
          </Box>
        </VStack>
      )}
    </Box>
  );
}
