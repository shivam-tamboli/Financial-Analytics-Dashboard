import { Button, Flex, HStack, Select, Text } from '@chakra-ui/react';
import type { Pagination as PaginationMeta } from '../../types';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  /** Defaults to true. Set false for a fixed page size where changing it makes no sense. */
  showLimitSelector?: boolean;
}

function getPageWindow(current: number, total: number): number[] {
  const window = 1;
  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let p = current - window; p <= current + window; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export function Pagination({ pagination, onPageChange, onLimitChange, showLimitSelector = true }: PaginationProps) {
  const { page, limit, total, totalPages } = pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pageNumbers = getPageWindow(page, totalPages);

  return (
    <Flex justify="space-between" align="center" wrap="wrap" gap={3} pt={4}>
      <HStack spacing={2}>
        <Text fontSize="sm" color="surface.muted">
          {total === 0 ? 'No results' : `Showing ${start}-${end} of ${total}`}
        </Text>
        {showLimitSelector && onLimitChange && (
          <Select
            size="sm"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            w="auto"
            bg="surface.panelAlt"
            border="1px solid"
            borderColor="surface.border"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </Select>
        )}
      </HStack>

      <HStack spacing={1}>
        <Button size="sm" variant="ghost" onClick={() => onPageChange(page - 1)} isDisabled={page <= 1}>
          Prev
        </Button>
        {pageNumbers.map((p, idx) => {
          const prev = pageNumbers[idx - 1];
          const showEllipsis = prev !== undefined && p - prev > 1;
          return (
            <HStack key={p} spacing={1}>
              {showEllipsis && (
                <Text px={1} color="surface.muted">
                  ...
                </Text>
              )}
              <Button
                size="sm"
                variant={p === page ? 'solid' : 'ghost'}
                bg={p === page ? 'brand.500' : 'transparent'}
                color={p === page ? 'black' : undefined}
                _hover={{ bg: p === page ? 'brand.400' : 'surface.panelAlt' }}
                onClick={() => onPageChange(p)}
                minW="36px"
              >
                {p}
              </Button>
            </HStack>
          );
        })}
        <Button size="sm" variant="ghost" onClick={() => onPageChange(page + 1)} isDisabled={page >= totalPages}>
          Next
        </Button>
      </HStack>
    </Flex>
  );
}
