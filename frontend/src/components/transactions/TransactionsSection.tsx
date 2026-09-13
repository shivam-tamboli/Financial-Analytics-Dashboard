import { useState } from 'react';
import { Box, Button, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';
import type { SortableField, SortOrder, TransactionFilters, TransactionUser } from '../../types';
import { useTransactionsQuery } from '../../hooks/useTransactionsData';
import { TransactionFiltersBar } from './TransactionFiltersBar';
import { TransactionsTable } from './TransactionsTable';
import { TransactionDetailDrawer } from './TransactionDetailDrawer';
import { UserSummaryModal } from './UserSummaryModal';
import { Pagination } from './Pagination';
import { ExportModal } from '../export/ExportModal';
import { AlertChip } from '../common/AlertChip';
import { extractErrorMessage } from '../../api/client';

interface TransactionsSectionProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  users: TransactionUser[];
}

export function TransactionsSection({ filters, onFiltersChange, users }: TransactionsSectionProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<SortableField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<TransactionUser | null>(null);
  const exportModal = useDisclosure();

  // Reset pagination back to page 1 whenever the filters change. Adjusting state
  // during render (rather than in an effect) avoids an extra render pass.
  if (filters !== appliedFilters) {
    setAppliedFilters(filters);
    setPage(1);
  }

  const query = useTransactionsQuery({ ...filters, page, limit, sortBy, sortOrder });

  function handleSortChange(field: SortableField) {
    if (field === sortBy) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }

  const total = query.data?.pagination.total ?? 0;

  return (
    <Box
      id="transactions-section"
      bg="surface.panel"
      border="1px solid"
      borderColor="surface.border"
      borderRadius="xl"
      p={{ base: 4, md: 6 }}
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap={4} mb={5}>
        <Text fontWeight={800} fontSize="2xl">
          Transactions
        </Text>
        <Button
          leftIcon={<FiDownload />}
          bg="brand.500"
          color="black"
          _hover={{ bg: 'brand.400' }}
          onClick={exportModal.onOpen}
        >
          Export CSV
        </Button>
      </Flex>

      <Box mb={5}>
        <TransactionFiltersBar
          filters={filters}
          onChange={onFiltersChange}
          users={users}
          onViewUserSummary={setSelectedUser}
        />
      </Box>

      {query.isError && (
        <Box mb={4}>
          <AlertChip status="error" message={extractErrorMessage(query.error, 'Failed to load transactions')} />
        </Box>
      )}

      <TransactionsTable
        transactions={query.data?.data ?? []}
        isLoading={query.isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onRowClick={(t) => setSelectedTransactionId(t.id)}
      />

      {query.data && query.data.pagination.total > 0 && (
        <Pagination
          pagination={query.data.pagination}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      )}

      <ExportModal isOpen={exportModal.isOpen} onClose={exportModal.onClose} activeFilters={filters} filteredTotal={total} />
      <TransactionDetailDrawer transactionId={selectedTransactionId} onClose={() => setSelectedTransactionId(null)} />
      <UserSummaryModal user={selectedUser} onClose={() => setSelectedUser(null)} />
    </Box>
  );
}
