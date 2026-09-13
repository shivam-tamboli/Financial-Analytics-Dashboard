import { Icon, Text, VStack } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import { FiInbox } from 'react-icons/fi';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconType;
}

export function EmptyState({ title, description, icon = FiInbox }: EmptyStateProps) {
  return (
    <VStack py={12} spacing={2} color="surface.muted">
      <Icon as={icon} boxSize={8} />
      <Text fontWeight={600} color="gray.200">
        {title}
      </Text>
      {description && (
        <Text fontSize="sm" textAlign="center" maxW="sm">
          {description}
        </Text>
      )}
    </VStack>
  );
}
