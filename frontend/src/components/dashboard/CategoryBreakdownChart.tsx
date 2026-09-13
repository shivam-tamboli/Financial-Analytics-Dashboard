import { Box, Flex, HStack, Skeleton, Text, VStack } from '@chakra-ui/react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { CategoryBreakdown } from '../../types';
import { formatCompactCurrency } from '../../utils/format';
import { EmptyState } from '../common/EmptyState';

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown[];
  isLoading: boolean;
}

const COLORS: Record<string, string> = {
  Revenue: '#22c55e',
  Expense: '#f5a623',
};

export function CategoryBreakdownChart({ data, isLoading }: CategoryBreakdownChartProps) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <Box bg="surface.panel" border="1px solid" borderColor="surface.border" borderRadius="xl" p={5}>
      <Text fontWeight={700} fontSize="lg" mb={4}>
        Category Breakdown
      </Text>

      {isLoading ? (
        <Skeleton height="160px" startColor="surface.panelAlt" endColor="surface.border" borderRadius="lg" />
      ) : data.length === 0 ? (
        <EmptyState title="No data" description="No transactions match the current filters." />
      ) : (
        <Flex align="center" gap={4}>
          <Box position="relative" w="140px" h="140px" flexShrink={0}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.category} fill={COLORS[entry.category] ?? '#8b95a1'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <Flex position="absolute" inset={0} align="center" justify="center" direction="column" pointerEvents="none">
              <Text fontSize="xs" color="surface.muted">
                Total
              </Text>
              <Text fontSize="sm" fontWeight={700}>
                {formatCompactCurrency(total)}
              </Text>
            </Flex>
          </Box>

          <VStack align="stretch" spacing={3} flex={1} minW={0}>
            {data.map((entry) => (
              <HStack key={entry.category} justify="space-between">
                <HStack spacing={2}>
                  <Box boxSize={2.5} borderRadius="full" bg={COLORS[entry.category] ?? '#8b95a1'} />
                  <Text fontSize="sm" color="gray.200">
                    {entry.category}
                  </Text>
                </HStack>
                <VStack spacing={0} align="flex-end">
                  <Text fontSize="sm" fontWeight={600}>
                    {formatCompactCurrency(entry.total)}
                  </Text>
                  <Text fontSize="xs" color="surface.muted">
                    {entry.count} txns
                  </Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        </Flex>
      )}
    </Box>
  );
}
