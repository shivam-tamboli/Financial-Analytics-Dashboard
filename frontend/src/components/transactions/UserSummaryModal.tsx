import {
  Avatar,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useUserSummaryQuery } from '../../hooks/useAnalyticsData';
import { formatCurrency } from '../../utils/format';
import { AlertChip } from '../common/AlertChip';
import { extractErrorMessage } from '../../api/client';
import type { TransactionUser } from '../../types';

interface UserSummaryModalProps {
  user: TransactionUser | null;
  onClose: () => void;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <VStack spacing={0} align="flex-start" flex={1}>
      <Text fontSize="xs" color="surface.muted">
        {label}
      </Text>
      <Text fontSize="md" fontWeight={700} color={accent}>
        {value}
      </Text>
    </VStack>
  );
}

export function UserSummaryModal({ user, onClose }: UserSummaryModalProps) {
  const query = useUserSummaryQuery(user?.user_id ?? null);

  return (
    <Modal isOpen={user !== null} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent bg="surface.panel" borderRadius="xl">
        <ModalHeader>
          <HStack spacing={3}>
            <Avatar size="sm" src={user?.user_profile} name={user?.user_name} />
            <Text>{user?.user_name}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {query.isError && (
            <AlertChip status="error" message={extractErrorMessage(query.error, 'Failed to load user summary')} />
          )}

          {query.isLoading ? (
            <Skeleton height="60px" startColor="surface.panelAlt" endColor="surface.border" borderRadius="lg" />
          ) : query.data ? (
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Stat label="Revenue" value={formatCurrency(query.data.revenue)} accent="brand.400" />
                <Stat label="Expenses" value={formatCurrency(query.data.expenses)} accent="accent.500" />
              </HStack>
              <HStack justify="space-between">
                <Stat label="Balance" value={formatCurrency(query.data.balance)} />
                <Stat label="Transactions" value={String(query.data.transactionCount)} />
              </HStack>
              <Text fontSize="xs" color="surface.muted">
                Revenue/expenses/balance are Paid-only. Transaction count includes all statuses.
              </Text>
            </VStack>
          ) : null}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
