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
