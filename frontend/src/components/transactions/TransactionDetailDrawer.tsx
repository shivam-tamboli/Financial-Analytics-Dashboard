import {
  Avatar,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTransactionByIdQuery } from '../../hooks/useAnalyticsData';
import { formatCurrency, formatDate } from '../../utils/format';
import { StatusBadge } from './StatusBadge';
import { AlertChip } from '../common/AlertChip';
import { extractErrorMessage } from '../../api/client';

interface TransactionDetailDrawerProps {
  transactionId: string | null;
  onClose: () => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <HStack justify="space-between" align="flex-start" py={2} borderBottom="1px solid" borderColor="surface.border">
      <Text fontSize="sm" color="surface.muted">
        {label}
      </Text>
      {children}
    </HStack>
  );
}

export function TransactionDetailDrawer({ transactionId, onClose }: TransactionDetailDrawerProps) {
  const query = useTransactionByIdQuery(transactionId);
  const isOpen = transactionId !== null;

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent bg="surface.panel">
        <DrawerCloseButton />
        <DrawerHeader borderBottom="1px solid" borderColor="surface.border">
          Transaction Detail
        </DrawerHeader>
        <DrawerBody py={5}>
          {query.isError && (
            <AlertChip status="error" message={extractErrorMessage(query.error, 'Failed to load transaction')} />
          )}

          {query.isLoading ? (
            <VStack spacing={3} align="stretch" mt={2}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} height="20px" startColor="surface.panelAlt" endColor="surface.border" />
              ))}
            </VStack>
          ) : query.data ? (
            <VStack align="stretch" spacing={0} mt={1}>
              <HStack spacing={3} pb={4}>
                <Avatar size="md" src={query.data.user_profile} name={query.data.user_name} />
                <VStack align="flex-start" spacing={0}>
                  <Text fontWeight={700}>{query.data.user_name}</Text>
                  <Text fontSize="xs" color="surface.muted">{query.data.user_id}</Text>
                </VStack>
              </HStack>

              <Row label="Transaction ID">
                <Text fontSize="sm" fontFamily="mono" maxW="60%" isTruncated title={query.data.id}>
                  {query.data.id}
                </Text>
              </Row>
              <Row label="Amount">
                <Text fontSize="sm" fontWeight={700} color={query.data.category === 'Revenue' ? 'brand.400' : 'accent.500'}>
                  {query.data.category === 'Revenue' ? '+' : '-'}
                  {formatCurrency(query.data.amount)}
                </Text>
              </Row>
              <Row label="Category">
                <Text fontSize="sm">{query.data.category}</Text>
              </Row>
              <Row label="Status">
                <StatusBadge status={query.data.status} />
              </Row>
              <Row label="Date">
                <Text fontSize="sm">{formatDate(query.data.date)}</Text>
              </Row>
            </VStack>
          ) : null}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
