import { writable, derived } from 'svelte/store';
import type { Translations } from './types';
import { en } from './locales/en';
import { nl } from './locales/nl';
import { fr } from './locales/fr';

export type { Translations };
export type Locale = 'en' | 'nl' | 'fr';

const STORAGE_KEY = 'bmx-locale';

const locales: Record<Locale, Translations> = { en, nl, fr };

/** Every locale the app supports, in the order the language switch lists them. */
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'nl', 'fr'];

export function isLocale(value: unknown): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;

  const browser = navigator.language.slice(0, 2).toLowerCase();
  if (browser === 'nl') return 'nl';
  if (browser === 'fr') return 'fr';
  return 'en';
}

function createLocaleStore() {
  const { subscribe, set } = writable<Locale>('en');

  return {
    subscribe,
    init() {
      set(detectLocale());
    },
    setLocale(locale: Locale) {
      localStorage.setItem(STORAGE_KEY, locale);
      set(locale);
    },
  };
}

export const locale = createLocaleStore();

export const t = derived(locale, ($locale) => locales[$locale]);

export function interpolate(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}
