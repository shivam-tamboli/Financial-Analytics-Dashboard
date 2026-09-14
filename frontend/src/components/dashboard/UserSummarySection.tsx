import { useState } from 'react';
import { Box, HStack, Select, Text } from '@chakra-ui/react';
import { FiCreditCard, FiDollarSign, FiHash, FiTrendingUp, FiUser } from 'react-icons/fi';
import { useTransactionUsersQuery } from '../../hooks/useTransactionsData';
import { useUserSummaryQuery } from '../../hooks/useAnalyticsData';
import { MetricCard } from './MetricCard';
import { EmptyState } from '../common/EmptyState';
import { AlertChip } from '../common/AlertChip';
import { extractErrorMessage } from '../../api/client';

const PAID_ONLY_TOOLTIP = 'Revenue, expenses, and balance are Paid-only. Transaction count includes all statuses.';

export function UserSummarySection() {
  const [userId, setUserId] = useState('');
  const usersQuery = useTransactionUsersQuery();
  const summaryQuery = useUserSummaryQuery(userId || null);

  return (
    <Box bg="surface.panel" border="1px solid" borderColor="surface.border" borderRadius="xl" p={5}>
      <Text fontWeight={700} fontSize="lg" mb={4}>
        User Summary
      </Text>

      <Select
        placeholder="Select a user"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        maxW="260px"
        mb={5}
        bg="surface.panelAlt"
        border="1px solid"
        borderColor="surface.border"
      >
        {usersQuery.data?.map((u) => (
          <option key={u.user_id} value={u.user_id}>
            {u.user_name}
          </option>
        ))}
      </Select>

      {summaryQuery.isError && (
        <Box mb={4}>
          <AlertChip status="error" message={extractErrorMessage(summaryQuery.error, 'Failed to load user summary')} />
        </Box>
      )}

      {!userId ? (
        <EmptyState icon={FiUser} title="No user selected" description="Select a user to view their summary." />
      ) : (
        <HStack spacing={4} wrap="wrap">
          <MetricCard
            label="Revenue"
            value={summaryQuery.data?.revenue ?? 0}
            icon={FiTrendingUp}
            accent="#22c55e"
            isLoading={summaryQuery.isLoading}
            tooltip={PAID_ONLY_TOOLTIP}
          />
          <MetricCard
            label="Expenses"
            value={summaryQuery.data?.expenses ?? 0}
            icon={FiCreditCard}
            accent="#f5a623"
            isLoading={summaryQuery.isLoading}
            tooltip={PAID_ONLY_TOOLTIP}
          />
          <MetricCard
            label="Balance"
            value={summaryQuery.data?.balance ?? 0}
            icon={FiDollarSign}
            accent="#38bdf8"
            isLoading={summaryQuery.isLoading}
            tooltip={PAID_ONLY_TOOLTIP}
          />
          <MetricCard
            label="Transaction Count"
            value={0}
            displayValue={String(summaryQuery.data?.transactionCount ?? 0)}
            icon={FiHash}
            accent="#a78bfa"
            isLoading={summaryQuery.isLoading}
            tooltip="Includes transactions of any status, not just Paid."
          />
        </HStack>
      )}
    </Box>
  );
}
