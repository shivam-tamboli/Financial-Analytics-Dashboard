import {
  Avatar,
  Box,
  HStack,
  Icon,
  Skeleton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { FiArrowDown, FiArrowUp, FiChevronsUp } from 'react-icons/fi';
import type { SortableField, SortOrder, Transaction } from '../../types';
import { formatCurrency, formatShortDate } from '../../utils/format';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from '../common/EmptyState';

interface Column {
  key: SortableField;
  label: string;
  sortable: boolean;
}

const COLUMNS: Column[] = [
  { key: 'user_name', label: 'Name', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  sortBy: SortableField;
  sortOrder: SortOrder;
  onSortChange: (field: SortableField) => void;
}

export function TransactionsTable({
  transactions,
  isLoading,
  sortBy,
  sortOrder,
  onSortChange,
}: TransactionsTableProps) {
  return (
    <Box overflowX="auto">
      <Table variant="simple" size="md">
        <Thead>
          <Tr>
            {COLUMNS.map((col) => {
              const isActive = sortBy === col.key;
              return (
                <Th key={col.key} cursor={col.sortable ? 'pointer' : 'default'} onClick={() => col.sortable && onSortChange(col.key)} userSelect="none">
                  <HStack spacing={1}>
                    <Text>{col.label}</Text>
                    {col.sortable && (
                      <Icon
                        as={isActive ? (sortOrder === 'asc' ? FiArrowUp : FiArrowDown) : FiChevronsUp}
                        boxSize={3}
                        opacity={isActive ? 1 : 0.35}
                        color={isActive ? 'brand.400' : undefined}
                      />
                    )}
                  </HStack>
                </Th>
              );
            })}
          </Tr>
        </Thead>
        <Tbody>
          {isLoading &&
            [...Array(6)].map((_, i) => (
              <Tr key={i}>
                {COLUMNS.map((col) => (
                  <Td key={col.key}>
                    <Skeleton height="20px" startColor="surface.panelAlt" endColor="surface.border" />
                  </Td>
                ))}
              </Tr>
            ))}

          {!isLoading &&
            transactions.map((t) => {
              const isRevenue = t.category === 'Revenue';
              return (
                <Tr key={t.id} _hover={{ bg: 'surface.panelAlt' }}>
                  <Td>
                    <HStack spacing={3}>
                      <Avatar size="sm" src={t.user_profile} name={t.user_name} />
                      <Text fontWeight={500}>{t.user_name}</Text>
                    </HStack>
                  </Td>
                  <Td color="surface.muted" fontSize="sm">
                    {formatShortDate(t.date)}
                  </Td>
                  <Td>
                    <Text fontSize="sm" color={isRevenue ? 'brand.400' : 'accent.500'}>
                      {t.category}
                    </Text>
                  </Td>
                  <Td fontWeight={600} color={isRevenue ? 'brand.400' : 'accent.500'}>
                    {isRevenue ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </Td>
                  <Td>
                    <StatusBadge status={t.status} />
                  </Td>
                </Tr>
              );
            })}
        </Tbody>
      </Table>

      {!isLoading && transactions.length === 0 && (
        <EmptyState title="No transactions found" description="Try adjusting your search or filters to find what you're looking for." />
      )}
    </Box>
  );
}
