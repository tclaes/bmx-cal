import { writable, derived } from 'svelte/store';
import type { Translations } from './types';
import { en } from './locales/en';
import { nl } from './locales/nl';
import { fr } from './locales/fr';

export type Locale = 'en' | 'nl' | 'fr';

const STORAGE_KEY = 'bmx-locale';

const locales: Record<Locale, Translations> = { en, nl, fr };

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && stored in locales) return stored;

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
