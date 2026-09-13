import { Box, Flex, Icon, Skeleton, Text } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import { formatCurrency } from '../../utils/format';

interface MetricCardProps {
  label: string;
  value: number;
  icon: IconType;
  accent: string;
  isLoading?: boolean;
}

export function MetricCard({ label, value, icon, accent, isLoading }: MetricCardProps) {
  return (
    <Flex
      bg="surface.panel"
      border="1px solid"
      borderColor="surface.border"
      borderRadius="xl"
      p={5}
      gap={4}
      align="center"
      flex="1"
      minW="200px"
    >
      <Flex boxSize={11} borderRadius="lg" bg={`${accent}22`} align="center" justify="center" flexShrink={0}>
        <Icon as={icon} boxSize={5} color={accent} />
      </Flex>
      <Box minW={0}>
        <Text fontSize="sm" color="surface.muted" mb={1}>
          {label}
        </Text>
        {isLoading ? (
          <Skeleton height="24px" width="100px" startColor="surface.panelAlt" endColor="surface.border" />
        ) : (
          <Text fontSize="xl" fontWeight={700} noOfLines={1}>
            {formatCurrency(value)}
          </Text>
        )}
      </Box>
    </Flex>
  );
}
