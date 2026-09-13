import { Avatar, Box, Flex, HStack, Select, Skeleton, Stack, Text } from '@chakra-ui/react';
import type { RecentTransactionsFilter, Transaction } from '../../types';
import { formatCurrency, formatShortDate } from '../../utils/format';
import { EmptyState } from '../common/EmptyState';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
  filter: RecentTransactionsFilter;
  onFilterChange: (filter: RecentTransactionsFilter) => void;
}

type ViewOption = 'recent' | 'pending' | 'paid' | 'month' | 'year';

function viewToFilter(view: ViewOption): RecentTransactionsFilter {
  const now = new Date();
  switch (view) {
    case 'pending':
      return { filterBy: 'status', status: 'Pending' };
    case 'paid':
      return { filterBy: 'status', status: 'Paid' };
    case 'month':
      return { filterBy: 'month', month: now.getMonth() + 1, year: now.getFullYear() };
    case 'year':
      return { filterBy: 'year', year: now.getFullYear() };
    case 'recent':
    default:
      return {};
  }
}

function filterToView(filter: RecentTransactionsFilter): ViewOption {
  if (filter.filterBy === 'status' && filter.status === 'Pending') return 'pending';
  if (filter.filterBy === 'status' && filter.status === 'Paid') return 'paid';
  if (filter.filterBy === 'month') return 'month';
  if (filter.filterBy === 'year') return 'year';
  return 'recent';
}

export function RecentTransactions({ transactions, isLoading, filter, onFilterChange }: RecentTransactionsProps) {
  return (
    <Box bg="surface.panel" border="1px solid" borderColor="surface.border" borderRadius="xl" p={5} h="full">
      <Flex justify="space-between" align="center" mb={4} gap={2}>
        <Text fontWeight={700} fontSize="lg">
          Recent Transactions
        </Text>
        <Select
          size="sm"
          w="auto"
          value={filterToView(filter)}
          onChange={(e) => onFilterChange(viewToFilter(e.target.value as ViewOption))}
          bg="surface.panelAlt"
          border="1px solid"
          borderColor="surface.border"
        >
          <option value="recent">Most recent</option>
          <option value="pending">Pending only</option>
          <option value="paid">Paid only</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
        </Select>
      </Flex>

      {isLoading ? (
        <Stack spacing={4}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height="40px" startColor="surface.panelAlt" endColor="surface.border" borderRadius="md" />
          ))}
        </Stack>
      ) : transactions.length === 0 ? (
        <EmptyState title="No recent activity" description="Transactions matching your filters will show up here." />
      ) : (
        <Stack spacing={4}>
          {transactions.map((t) => {
            const isRevenue = t.category === 'Revenue';
            return (
              <HStack key={t.id} justify="space-between">
                <HStack spacing={3} minW={0}>
                  <Avatar size="sm" src={t.user_profile} name={t.user_name} />
                  <Box minW={0}>
                    <Text fontSize="sm" fontWeight={600} noOfLines={1}>
                      {t.user_name}
                    </Text>
                    <Text fontSize="xs" color="surface.muted">
                      {formatShortDate(t.date)}
                    </Text>
                  </Box>
                </HStack>
                <Text fontSize="sm" fontWeight={700} color={isRevenue ? 'brand.400' : 'accent.500'} flexShrink={0}>
                  {isRevenue ? '+' : '-'}
                  {formatCurrency(t.amount)}
                </Text>
              </HStack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
