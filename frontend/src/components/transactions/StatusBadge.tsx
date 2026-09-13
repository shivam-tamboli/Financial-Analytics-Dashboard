import { Badge } from '@chakra-ui/react';
import type { TransactionStatus } from '../../types';

const STYLES: Record<TransactionStatus, { bg: string; color: string }> = {
  Paid: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  Pending: { bg: 'rgba(245,166,35,0.18)', color: '#f5a623' },
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const style = STYLES[status];
  return (
    <Badge
      bg={style.bg}
      color={style.color}
      borderRadius="full"
      px={3}
      py={1}
      fontSize="xs"
      fontWeight={600}
      textTransform="none"
    >
      {status}
    </Badge>
  );
}
