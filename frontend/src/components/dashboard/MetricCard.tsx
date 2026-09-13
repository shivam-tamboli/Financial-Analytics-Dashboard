import { Box, Flex, HStack, Icon, Skeleton, Text, Tooltip } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import { FiInfo } from 'react-icons/fi';
import { formatCurrency } from '../../utils/format';

interface MetricCardProps {
  label: string;
  value: number;
  icon: IconType;
  accent: string;
  isLoading?: boolean;
  tooltip?: string;
}

export function MetricCard({ label, value, icon, accent, isLoading, tooltip }: MetricCardProps) {
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
        <HStack spacing={1} mb={1}>
          <Text fontSize="sm" color="surface.muted">
            {label}
          </Text>
          {tooltip && (
            <Tooltip label={tooltip} fontSize="xs" placement="top" hasArrow bg="surface.panelAlt" color="text.primary">
              <Box as="span" display="inline-flex" cursor="help">
                <Icon as={FiInfo} boxSize={3} color="surface.muted" />
              </Box>
            </Tooltip>
          )}
        </HStack>
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
