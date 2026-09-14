import { useState } from 'react';
import {
  Box,
  Button,
  Icon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiCalendar } from 'react-icons/fi';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';

interface DateRangePickerProps {
  dateFrom?: string;
  dateTo?: string;
  onChange: (range: { dateFrom?: string; dateTo?: string }) => void;
}

function toDateOnly(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function formatLabel(from?: Date, to?: Date): string {
  if (!from) return 'Date range';
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (!to || from.getTime() === to.getTime()) return from.toLocaleDateString('en-US', opts);
  return `${from.toLocaleDateString('en-US', opts)} - ${to.toLocaleDateString('en-US', opts)}`;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function DateRangePicker({ dateFrom, dateTo, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected: DateRange | undefined = dateFrom
    ? { from: toDateOnly(dateFrom), to: toDateOnly(dateTo) ?? toDateOnly(dateFrom) }
    : undefined;

  const accent = useColorModeValue('#22c55e', '#22c55e');
  const accentBg = useColorModeValue('rgba(34,197,94,0.15)', 'rgba(34,197,94,0.18)');
  const textColor = useColorModeValue('#111827', '#f5f6f7');

  function handleSelect(range: DateRange | undefined) {
    if (!range?.from) {
      onChange({ dateFrom: undefined, dateTo: undefined });
      return;
    }
    onChange({
      dateFrom: toIsoDate(range.from),
      dateTo: range.to ? toIsoDate(range.to) : undefined,
    });
    // react-day-picker's range mode reports a same-day range ({from, to} both set
    // to the clicked day) on the very first click, not just a bare `from` — so
    // closing whenever both are present would close the popover before a second,
    // different day could ever be picked. Only auto-close once the two differ,
    // i.e. an actual multi-day range has been chosen.
    if (range.from && range.to && range.to.getTime() !== range.from.getTime()) {
      setIsOpen(false);
    }
  }

  return (
    <Popover isLazy isOpen={isOpen} onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)} placement="bottom-end">
      <PopoverTrigger>
        <Button
          leftIcon={<Icon as={FiCalendar} />}
          variant="outline"
          borderColor="surface.border"
          bg="surface.panelAlt"
          size="md"
          fontWeight={500}
        >
          {formatLabel(selected?.from, selected?.to)}
        </Button>
      </PopoverTrigger>
      <PopoverContent bg="surface.panel" borderColor="surface.border" w="auto">
        <PopoverArrow bg="surface.panel" />
        <PopoverBody p={3}>
          <Box
            style={
              {
                '--rdp-accent-color': accent,
                '--rdp-accent-background-color': accentBg,
                '--rdp-range_start-color': '#000',
                '--rdp-range_end-color': '#000',
                color: textColor,
              } as React.CSSProperties
            }
          >
            <DayPicker
              mode="range"
              selected={selected}
              onSelect={handleSelect}
              numberOfMonths={1}
              showOutsideDays
              captionLayout="dropdown"
              startMonth={new Date(2015, 0)}
              endMonth={new Date(new Date().getFullYear() + 1, 11)}
            />
          </Box>
          {selected?.from && (
            <Button size="xs" variant="ghost" w="full" mt={1} onClick={() => onChange({ dateFrom: undefined, dateTo: undefined })}>
              Clear dates
            </Button>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
