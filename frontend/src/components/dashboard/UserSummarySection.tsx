import { useState } from 'react';
import { Box, HStack, Select, Text } from '@chakra-ui/react';
import { FiCreditCard, FiDollarSign, FiHash, FiTrendingUp, FiUser } from 'react-icons/fi';
import { useTransactionUsersQuery, useTransactionsQuery } from '../../hooks/useTransactionsData';
import { useUserSummaryQuery } from '../../hooks/useAnalyticsData';
import { MetricCard } from './MetricCard';
import { TransactionsTable } from '../transactions/TransactionsTable';
import { Pagination } from '../transactions/Pagination';
import { EmptyState } from '../common/EmptyState';
import { AlertChip } from '../common/AlertChip';
import { extractErrorMessage } from '../../api/client';

const PAID_ONLY_TOOLTIP = 'Revenue, expenses, and balance are Paid-only. Transaction count includes all statuses.';
const USER_TRANSACTIONS_PAGE_SIZE = 10;

export function UserSummarySection() {
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [appliedUserId, setAppliedUserId] = useState(userId);

  // Reset pagination back to page 1 whenever a different user is selected — the same
  // "adjust state during render" idiom TransactionsSection uses when its filters change,
  // avoiding an extra render pass from a useEffect.
  if (userId !== appliedUserId) {
    setAppliedUserId(userId);
    setPage(1);
  }

  const usersQuery = useTransactionUsersQuery();
  const summaryQuery = useUserSummaryQuery(userId || null);
  const transactionsQuery = useTransactionsQuery(
    { userId, page, limit: USER_TRANSACTIONS_PAGE_SIZE, sortBy: 'date', sortOrder: 'desc' },
    { enabled: Boolean(userId) }
  );

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
        <>
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

          <Text fontWeight={700} fontSize="md" mt={6} mb={3}>
            Transactions
          </Text>

          {transactionsQuery.isError && (
            <Box mb={4}>
              <AlertChip status="error" message={extractErrorMessage(transactionsQuery.error, 'Failed to load transactions')} />
            </Box>
          )}

          <TransactionsTable
            transactions={transactionsQuery.data?.data ?? []}
            isLoading={transactionsQuery.isLoading}
            showUserColumn={false}
          />

          {transactionsQuery.data && transactionsQuery.data.pagination.total > 0 && (
            <Pagination pagination={transactionsQuery.data.pagination} onPageChange={setPage} showLimitSelector={false} />
          )}
        </>
      )}
    </Box>
  );
}
