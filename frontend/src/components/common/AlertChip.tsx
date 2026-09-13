import { HStack, Icon, IconButton, Text } from '@chakra-ui/react';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';

export type AlertChipStatus = 'error' | 'success' | 'info';

interface AlertChipProps {
  status: AlertChipStatus;
  message: string;
  onClose?: () => void;
}

const STATUS_STYLES: Record<AlertChipStatus, { bg: string; color: string; icon: typeof FiInfo }> = {
  error: { bg: 'rgba(239, 83, 80, 0.15)', color: '#ff8a80', icon: FiAlertTriangle },
  success: { bg: 'rgba(34, 197, 94, 0.15)', color: '#7ee2a8', icon: FiCheckCircle },
  info: { bg: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', icon: FiInfo },
};

export function AlertChip({ status, message, onClose }: AlertChipProps) {
  const style = STATUS_STYLES[status];
  return (
    <HStack
      role="alert"
      bg={style.bg}
      color={style.color}
      px={4}
      py={2}
      borderRadius="full"
      spacing={2}
      w="fit-content"
      maxW="100%"
      border="1px solid"
      borderColor={style.color}
    >
      <Icon as={style.icon} boxSize={4} flexShrink={0} />
      <Text fontSize="sm" fontWeight={500} noOfLines={2}>
        {message}
      </Text>
      {onClose && (
        <IconButton
          aria-label="Dismiss"
          icon={<FiX />}
          size="xs"
          variant="ghost"
          color={style.color}
          minW="auto"
          h="auto"
          p={0.5}
          onClick={onClose}
          _hover={{ bg: 'transparent', opacity: 0.7 }}
        />
      )}
    </HStack>
  );
}
