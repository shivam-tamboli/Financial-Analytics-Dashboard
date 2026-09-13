import type { YearBreakdown } from '../types';

// The sample dataset is fixed in the past, so "latest year/month with data" is
// derived from what's actually in the API response rather than the real calendar
// date — same reasoning DashboardPage already applies to the cashflow year.
export function getLatestYear(yearly: Record<string, YearBreakdown> | undefined): number | undefined {
  const years = Object.keys(yearly ?? {}).sort();
  return years.length > 0 ? Number(years.at(-1)) : undefined;
}

// `monthly` always has all 12 "YYYY-MM" keys for the year, zero-filled where there's
// no data — so the last key isn't necessarily the last month with real activity.
// Walk backwards to find one.
export function getLatestActiveMonth(
  yearly: Record<string, YearBreakdown> | undefined,
  year: number | undefined
): string | undefined {
  if (!yearly || year === undefined) return undefined;
  const monthly = yearly[String(year)]?.monthly;
  if (!monthly) return undefined;

  const keys = Object.keys(monthly).sort();
  for (let i = keys.length - 1; i >= 0; i--) {
    const month = monthly[keys[i]];
    if (month.revenue !== 0 || month.expenses !== 0) return keys[i];
  }
  return undefined;
}

export function previousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Percentage change of `current` vs `previous`. When `previous` is zero there's no
// ratio to compute — fall back to +100/-100 to still show a directional chip instead
// of dividing by zero, or 0 when both periods are genuinely zero.
export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return current > 0 ? 100 : -100;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}
