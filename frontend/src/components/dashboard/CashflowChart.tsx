import { Box, Flex, Skeleton, Text, useColorModeValue } from '@chakra-ui/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts/types/component/Tooltip';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { CashflowMonth } from '../../types';
import { formatCompactCurrency, formatCurrency, formatMonthLabel } from '../../utils/format';
import { EmptyState } from '../common/EmptyState';

interface CashflowChartProps {
  months: CashflowMonth[];
  isLoading: boolean;
}

function CashflowTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <Box bg="surface.panelAlt" border="1px solid" borderColor="surface.border" borderRadius="md" px={3} py={2}>
      <Text fontSize="xs" color="surface.muted" mb={1}>
        {formatMonthLabel(String(label))}
      </Text>
      <Text fontSize="sm" fontWeight={600} color={value >= 0 ? '#22c55e' : '#f5a623'}>
        Cashflow: {formatCurrency(value)}
      </Text>
    </Box>
  );
}

export function CashflowChart({ months, isLoading }: CashflowChartProps) {
  const gridStroke = useColorModeValue('#e2e8f0', '#232a32');
  const axisStroke = useColorModeValue('#4a5568', '#8b95a1');
  const axisLabelFill = useColorModeValue('#2d3748', '#c3cbd4');

  const hasData = months.some((m) => m.revenue !== 0 || m.expenses !== 0);

  return (
    <Box bg="surface.panel" border="1px solid" borderColor="surface.border" borderRadius="xl" p={5} h="full">
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
        <Text fontWeight={700} fontSize="lg">
          Cashflow
        </Text>
      </Flex>

      {isLoading ? (
        <Skeleton height="280px" startColor="surface.panelAlt" endColor="surface.border" borderRadius="lg" />
      ) : !hasData ? (
        <EmptyState title="No cashflow data" description="No transactions found for this year." />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={months} margin={{ top: 8, right: 8, left: 4, bottom: 18 }}>
            <defs>
              <linearGradient id="cashflowFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthLabel}
              stroke={axisStroke}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Month', position: 'insideBottom', offset: -12, fill: axisLabelFill, fontSize: 12 }}
            />
            <YAxis
              stroke={axisStroke}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactCurrency(v)}
              label={{ value: 'Cashflow ($)', angle: -90, position: 'insideLeft', fill: axisLabelFill, fontSize: 12 }}
            />
            <Tooltip content={(props) => <CashflowTooltip {...props} />} />
            <Area
              type="monotone"
              dataKey="cashflow"
              name="Cashflow"
              stroke="#38bdf8"
              strokeWidth={2.5}
              fill="url(#cashflowFill)"
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
