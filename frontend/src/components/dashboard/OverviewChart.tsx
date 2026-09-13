import { useMemo, useState } from 'react';
import { Box, Flex, HStack, Select, Skeleton, Text, useColorModeValue } from '@chakra-ui/react';
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
import type { YearBreakdown } from '../../types';
import { formatCompactCurrency, formatCurrency, formatMonthLabel } from '../../utils/format';
import { EmptyState } from '../common/EmptyState';

interface OverviewChartProps {
  yearly: Record<string, YearBreakdown>;
  isLoading: boolean;
}

type ChartView = 'monthly' | 'yearly';

interface ChartPoint {
  label: string;
  revenue: number;
  expenses: number;
}

function ChartTooltip({
  active,
  payload,
  label,
  view,
}: TooltipContentProps<ValueType, NameType> & { view: ChartView }) {
  if (!active || !payload?.length) return null;
  return (
    <Box bg="surface.panelAlt" border="1px solid" borderColor="surface.border" borderRadius="md" px={3} py={2}>
      <Text fontSize="xs" color="surface.muted" mb={1}>
        {view === 'monthly' ? formatMonthLabel(String(label)) : label}
      </Text>
      {payload.map((entry) => (
        <Text key={String(entry.name)} fontSize="sm" fontWeight={600} color={entry.color}>
          {entry.name}: {formatCurrency(Number(entry.value))}
        </Text>
      ))}
    </Box>
  );
}

export function OverviewChart({ yearly, isLoading }: OverviewChartProps) {
  const [view, setView] = useState<ChartView>('monthly');
  const gridStroke = useColorModeValue('#e2e8f0', '#232a32');
  const axisStroke = useColorModeValue('#4a5568', '#8b95a1');
  const axisLabelFill = useColorModeValue('#2d3748', '#c3cbd4');

  const years = useMemo(() => Object.keys(yearly).sort(), [yearly]);
  const latestYear = years.at(-1);

  const chartData: ChartPoint[] = useMemo(() => {
    if (view === 'yearly') {
      return years.map((year) => ({ label: year, revenue: yearly[year].revenue, expenses: yearly[year].expenses }));
    }
    if (!latestYear) return [];
    return Object.entries(yearly[latestYear].monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, breakdown]) => ({ label: monthKey, revenue: breakdown.revenue, expenses: breakdown.expenses }));
  }, [view, years, latestYear, yearly]);

  const xAxisLabel = view === 'monthly' ? 'Month' : 'Year';
  const tickFormatter = view === 'monthly' ? formatMonthLabel : (v: string) => v;

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
        <HStack spacing={4}>
          <HStack spacing={4} fontSize="xs" color="surface.muted">
            <HStack spacing={1.5}>
              <Box boxSize={2} borderRadius="full" bg="brand.500" />
              <Text>Revenue</Text>
            </HStack>
            <HStack spacing={1.5}>
              <Box boxSize={2} borderRadius="full" bg="accent.500" />
              <Text>Expenses</Text>
            </HStack>
          </HStack>
          <Select
            size="sm"
            w="auto"
            value={view}
            onChange={(e) => setView(e.target.value as ChartView)}
            bg="surface.panelAlt"
            border="1px solid"
            borderColor="surface.border"
            borderRadius="full"
            fontSize="xs"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </HStack>
      </Flex>

      {isLoading ? (
        <Skeleton height="280px" startColor="surface.panelAlt" endColor="surface.border" borderRadius="lg" />
      ) : chartData.length === 0 ? (
        <EmptyState title="No trend data" description="Try widening your filters to see revenue vs. expenses trends." />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 18 }}>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="label"
              tickFormatter={tickFormatter}
              stroke={axisStroke}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: xAxisLabel, position: 'insideBottom', offset: -12, fill: axisLabelFill, fontSize: 12 }}
            />
            <YAxis
              stroke={axisStroke}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactCurrency(v)}
              label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', fill: axisLabelFill, fontSize: 12 }}
            />
            <Tooltip content={(props) => <ChartTooltip {...props} view={view} />} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
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
