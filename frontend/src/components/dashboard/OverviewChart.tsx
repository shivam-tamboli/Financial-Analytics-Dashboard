import { Box, Flex, HStack, Skeleton, Text } from '@chakra-ui/react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts/types/component/Tooltip';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { MonthlyTrendPoint } from '../../types';
import { formatCompactCurrency, formatCurrency, formatMonthLabel } from '../../utils/format';
import { EmptyState } from '../common/EmptyState';

interface OverviewChartProps {
  data: MonthlyTrendPoint[];
  isLoading: boolean;
}

function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <Box bg="surface.panelAlt" border="1px solid" borderColor="surface.border" borderRadius="md" px={3} py={2}>
      <Text fontSize="xs" color="surface.muted" mb={1}>
        {formatMonthLabel(String(label))}
      </Text>
      {payload.map((entry) => (
        <Text key={String(entry.name)} fontSize="sm" fontWeight={600} color={entry.color}>
          {entry.name}: {formatCurrency(Number(entry.value))}
        </Text>
      ))}
    </Box>
  );
}

export function OverviewChart({ data, isLoading }: OverviewChartProps) {
  return (
    <Box
      id="overview-section"
      bg="surface.panel"
      border="1px solid"
      borderColor="surface.border"
      borderRadius="xl"
      p={5}
      h="full"
    >
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
        <Text fontWeight={700} fontSize="lg">
          Overview
        </Text>
        <HStack spacing={4} fontSize="xs" color="surface.muted">
          <HStack spacing={1.5}>
            <Box boxSize={2} borderRadius="full" bg="brand.500" />
            <Text>Income</Text>
          </HStack>
          <HStack spacing={1.5}>
            <Box boxSize={2} borderRadius="full" bg="accent.500" />
            <Text>Expenses</Text>
          </HStack>
        </HStack>
      </Flex>

      {isLoading ? (
        <Skeleton height="280px" startColor="surface.panelAlt" endColor="surface.border" borderRadius="lg" />
      ) : data.length === 0 ? (
        <EmptyState title="No trend data" description="Try widening your filters to see income vs. expense trends." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#232a32" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthLabel}
              stroke="#8b95a1"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#8b95a1"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactCurrency(v)}
            />
            <Tooltip content={ChartTooltip} />
            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Expenses"
              stroke="#f5a623"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
