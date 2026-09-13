import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FiCheckCircle, FiDownload, FiFileText } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { EXPORT_COLUMN_LABELS, EXPORTABLE_COLUMNS } from '../../types';
import type { ExportableColumn, TransactionFilters } from '../../types';
import { exportTransactionsCsv, fetchTransactions } from '../../api/transactions';
import { AlertChip } from '../common/AlertChip';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: TransactionFilters;
  filteredTotal: number;
}

type ExportScope = 'filtered' | 'all';

export function ExportModal({ isOpen, onClose, activeFilters, filteredTotal }: ExportModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<ExportableColumn[]>([...EXPORTABLE_COLUMNS]);
  const [scope, setScope] = useState<ExportScope>('filtered');
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== undefined && v !== '');

  const { data: allTotal } = useQuery({
    queryKey: ['transactions-total-all'],
    queryFn: async () => (await fetchTransactions({ page: 1, limit: 1, sortBy: 'date', sortOrder: 'desc' })).pagination.total,
    enabled: isOpen,
    staleTime: 60_000,
  });

  const recordCount = scope === 'filtered' ? filteredTotal : allTotal ?? filteredTotal;

  function toggleColumn(col: ExportableColumn) {
    setSelectedColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
  }

  function toggleAll() {
    setSelectedColumns((prev) => (prev.length === EXPORTABLE_COLUMNS.length ? [] : [...EXPORTABLE_COLUMNS]));
  }

  const columnsInvalid = selectedColumns.length === 0;

  async function handleDownload() {
    setError(null);
    setSuccess(null);
    setIsDownloading(true);
    try {
      const filtersToUse = scope === 'filtered' ? activeFilters : {};
      const { blob, filename } = await exportTransactionsCsv(selectedColumns, filtersToUse);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(`Downloaded ${filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsDownloading(false);
    }
  }

  function handleClose() {
    setError(null);
    setSuccess(null);
    onClose();
  }

  const columnGrid = useMemo(() => EXPORTABLE_COLUMNS, []);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent bg="surface.panel" border="1px solid" borderColor="surface.border">
        <ModalHeader>
          <HStack spacing={2}>
            <Icon as={FiFileText} color="brand.400" />
            <Text>Export transactions</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={5}>
            {error && <AlertChip status="error" message={error} onClose={() => setError(null)} />}
            {success && <AlertChip status="success" message={success} onClose={() => setSuccess(null)} />}

            <Box>
              <Text fontSize="sm" fontWeight={600} mb={2}>
                What should we export?
              </Text>
              <RadioGroup value={scope} onChange={(v) => setScope(v as ExportScope)}>
                <Stack spacing={2}>
                  <Radio value="filtered" colorScheme="green" isDisabled={!hasActiveFilters && scope !== 'filtered'}>
                    <Text fontSize="sm">
                      Current filtered view{' '}
                      <Text as="span" color="surface.muted">
                        ({filteredTotal} {filteredTotal === 1 ? 'row' : 'rows'})
                      </Text>
                    </Text>
                  </Radio>
                  <Radio value="all" colorScheme="green">
                    <Text fontSize="sm">
                      All transactions{' '}
                      <Text as="span" color="surface.muted">
                        ({allTotal ?? '…'} rows)
                      </Text>
                    </Text>
                  </Radio>
                </Stack>
              </RadioGroup>
            </Box>

            <Divider borderColor="surface.border" />

            <Box>
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontSize="sm" fontWeight={600}>
                  Columns to include
                </Text>
                <Button size="xs" variant="link" color="brand.400" onClick={toggleAll}>
                  {selectedColumns.length === EXPORTABLE_COLUMNS.length ? 'Deselect all' : 'Select all'}
                </Button>
              </Flex>
              <SimpleGrid columns={2} spacing={3}>
                {columnGrid.map((col) => (
                  <Checkbox
                    key={col}
                    isChecked={selectedColumns.includes(col)}
                    onChange={() => toggleColumn(col)}
                    colorScheme="green"
                  >
                    <Text fontSize="sm">{EXPORT_COLUMN_LABELS[col]}</Text>
                  </Checkbox>
                ))}
              </SimpleGrid>
              {columnsInvalid && (
                <Text fontSize="xs" color="danger.500" mt={2}>
                  Select at least one column to export.
                </Text>
              )}
            </Box>

            <Box bg="surface.panelAlt" borderRadius="lg" p={3}>
              <HStack spacing={2} color="surface.muted" fontSize="xs">
                <Icon as={FiCheckCircle} />
                <Text>
                  Ready to export ~{recordCount} row{recordCount === 1 ? '' : 's'} with {selectedColumns.length}{' '}
                  column{selectedColumns.length === 1 ? '' : 's'}. The file downloads automatically once generated.
                </Text>
              </HStack>
            </Box>
          </Stack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={handleClose}>
            Close
          </Button>
          <Button
            leftIcon={<FiDownload />}
            bg="brand.500"
            color="black"
            _hover={{ bg: 'brand.400' }}
            isLoading={isDownloading}
            loadingText="Generating..."
            isDisabled={columnsInvalid || recordCount === 0}
            onClick={handleDownload}
          >
            Download CSV
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
