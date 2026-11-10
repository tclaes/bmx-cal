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
