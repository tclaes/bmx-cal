import { locale } from '../../i18n';
import { get } from 'svelte/store';

const localeMap: Record<string, string> = { en: 'en-US', nl: 'nl-BE', fr: 'fr-BE' };

function currentLocale(): string {
  return localeMap[get(locale)] ?? 'en-US';
}

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString(currentLocale(), options ?? {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(currentLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString(currentLocale(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function localDate(iso: string): Date {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(iso);
}

export function formatDayNumber(iso: string): string {
  return String(localDate(iso).getDate());
}

export function formatMonthShort(iso: string): string {
  return localDate(iso).toLocaleDateString(currentLocale(), { month: 'short' }).replace('.', '');
}

export function formatMonthLong(iso: string): string {
  return localDate(iso).toLocaleDateString(currentLocale(), { month: 'long' });
}

export function formatWeekday(iso: string): string {
  return localDate(iso).toLocaleDateString(currentLocale(), { weekday: 'long' });
}

export function formatDayMonth(iso: string): string {
  return localDate(iso).toLocaleDateString(currentLocale(), { day: 'numeric', month: 'short' }).replace('.', '');
}

/**
 * The calendar year written in an ISO date (`YYYY-MM-DD`) or date-time string.
 * Reads the text instead of `new Date(iso).getFullYear()`, which parses a plain
 * date as midnight UTC and so gives the previous year behind UTC on 1 January.
 */
// YYYY-MM-DD, optionally followed by an ISO time and offset (e.g. T23:30:00Z, T10:00+02:00).
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

export function yearOf(iso: string): number {
  const match = ISO_DATE.exec(iso);
  if (!match) throw new Error(`"${iso}" is not an ISO date`);
  const [year, month, day] = match.slice(1, 4).map(Number);
  // Reject impossible dates such as 2026-02-30 or 2026-13-01 (checked in UTC, so no time zone is involved).
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error(`"${iso}" is not an ISO date`);
  }
  return year;
}
