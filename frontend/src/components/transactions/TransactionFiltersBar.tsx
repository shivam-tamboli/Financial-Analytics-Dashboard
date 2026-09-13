import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Select,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FiFilter, FiSearch, FiX } from 'react-icons/fi';
import type { TransactionFilters, TransactionUser } from '../../types';
import { DateRangePicker } from './DateRangePicker';

interface TransactionFiltersBarProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  users: TransactionUser[];
}

const selectStyle = {
  bg: 'surface.panelAlt',
  border: '1px solid',
  borderColor: 'surface.border',
  fontSize: 'sm',
};

export function TransactionFiltersBar({ filters, onChange, users }: TransactionFiltersBarProps) {
  const activeAdvancedCount = [filters.amountMin, filters.amountMax].filter(
    (v) => v !== undefined && (v as unknown as string) !== ''
  ).length;

  const hasAnyFilter =
    Boolean(filters.search) ||
    Boolean(filters.category) ||
    Boolean(filters.status) ||
    Boolean(filters.userId) ||
    Boolean(filters.dateFrom) ||
    activeAdvancedCount > 0;

  function update(partial: Partial<TransactionFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <Flex gap={3} wrap="wrap" align="center">
      <InputGroup maxW={{ base: 'full', sm: '260px' }} flex={{ base: '1 1 100%', sm: 'initial' }}>
        <InputLeftElement pointerEvents="none">
          <Icon as={FiSearch} color="surface.muted" boxSize={4} />
        </InputLeftElement>
        <Input
          placeholder="Search for anything..."
          value={filters.search ?? ''}
          onChange={(e) => update({ search: e.target.value })}
          {...selectStyle}
        />
      </InputGroup>

      <Select
        placeholder="All Categories"
        value={filters.category ?? ''}
        onChange={(e) => update({ category: (e.target.value || undefined) as TransactionFilters['category'] })}
        maxW="170px"
        {...selectStyle}
      >
        <option value="Revenue">Revenue</option>
        <option value="Expense">Expense</option>
      </Select>

      <Select
        placeholder="All Statuses"
        value={filters.status ?? ''}
        onChange={(e) => update({ status: (e.target.value || undefined) as TransactionFilters['status'] })}
        maxW="160px"
        {...selectStyle}
      >
        <option value="Paid">Paid</option>
        <option value="Pending">Pending</option>
      </Select>

      <Select
        placeholder="All Users"
        value={filters.userId ?? ''}
        onChange={(e) => update({ userId: e.target.value || undefined })}
        maxW="170px"
        {...selectStyle}
      >
        {users.map((u) => (
          <option key={u.user_id} value={u.user_id}>
            {u.user_name}
          </option>
        ))}
      </Select>

      <DateRangePicker
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onChange={(range) => update(range)}
      />

      <Popover placement="bottom-end">
        <PopoverTrigger>
          <Button
            leftIcon={<FiFilter />}
            variant="outline"
            borderColor="surface.border"
            bg="surface.panelAlt"
            size="md"
            fontWeight={500}
          >
            More filters
            {activeAdvancedCount > 0 && (
              <Box
                as="span"
                ml={2}
                bg="brand.500"
                color="black"
                borderRadius="full"
                fontSize="xs"
                px={1.5}
                fontWeight={700}
              >
                {activeAdvancedCount}
              </Box>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent bg="surface.panel" borderColor="surface.border" w="280px">
          <PopoverArrow bg="surface.panel" />
          <PopoverBody p={4}>
            <Stack spacing={4}>
              <Box>
                <Text fontSize="xs" color="surface.muted" mb={2}>
                  Amount range ($)
                </Text>
                <HStack>
                  <Input
                    type="number"
                    size="sm"
                    placeholder="Min"
                    value={filters.amountMin ?? ''}
                    onChange={(e) => update({ amountMin: e.target.value ? Number(e.target.value) : undefined })}
                    {...selectStyle}
                  />
                  <Input
                    type="number"
                    size="sm"
                    placeholder="Max"
                    value={filters.amountMax ?? ''}
                    onChange={(e) => update({ amountMax: e.target.value ? Number(e.target.value) : undefined })}
                    {...selectStyle}
                  />
                </HStack>
              </Box>
            </Stack>
          </PopoverBody>
        </PopoverContent>
      </Popover>

      {hasAnyFilter && (
        <Button leftIcon={<FiX />} variant="ghost" size="md" color="surface.muted" onClick={() => onChange({})}>
          Clear
        </Button>
      )}
    </Flex>
  );
}
