import { Avatar, Box, Flex, HStack, Skeleton, Stack, Text } from '@chakra-ui/react';
import type { Transaction } from '../../types';
import { formatCurrency, formatShortDate } from '../../utils/format';
import { EmptyState } from '../common/EmptyState';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  return (
    <Box bg="surface.panel" border="1px solid" borderColor="surface.border" borderRadius="xl" p={5} h="full">
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontWeight={700} fontSize="lg">
          Recent Transactions
        </Text>
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
              <HStack key={t._id} justify="space-between">
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
