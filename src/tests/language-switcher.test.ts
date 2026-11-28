import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import LanguageSwitcher from '../layout/LanguageSwitcher.svelte';
import { locale } from '../i18n';

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    locale.setLocale('en');
  });

  it.each([
    ['en', 'Language'],
    ['nl', 'Taal'],
    ['fr', 'Langue'],
  ] as const)('is named in the current language (%s)', (code, name) => {
    locale.setLocale(code);
    const { getByRole } = render(LanguageSwitcher, { variant: 'nav' });
    expect(getByRole('combobox', { name })).toBeInTheDocument();
  });

  it('offers every supported locale, with the current one selected', () => {
    locale.setLocale('nl');
    const { getByRole } = render(LanguageSwitcher, { variant: 'nav' });
    const select = getByRole('combobox', { name: 'Taal' }) as HTMLSelectElement;

    expect(Array.from(select.options).map((o) => o.value)).toEqual(['en', 'nl', 'fr']);
    expect(select.value).toBe('nl');
  });

  it('switches and persists the locale on change', async () => {
    const { getByRole } = render(LanguageSwitcher, { variant: 'nav' });
    const select = getByRole('combobox', { name: 'Language' }) as HTMLSelectElement;

    select.value = 'fr';
    await fireEvent.change(select);

    expect(get(locale)).toBe('fr');
    expect(localStorage.getItem('bmx-locale')).toBe('fr');
    expect(select.value).toBe('fr');
  });

  it('shows codes in the bar, with the full name as a tooltip', () => {
    const { getByRole } = render(LanguageSwitcher, { variant: 'nav' });
    const options = Array.from((getByRole('combobox') as HTMLSelectElement).options);

    expect(options.map((o) => o.textContent?.trim())).toEqual(['EN', 'NL', 'FR']);
    expect(options.map((o) => o.title)).toEqual(['English', 'Nederlands', 'Français']);
  });

  it('shows full names with a visible label in the menu', () => {
    locale.setLocale('fr');
    const { getByRole, getByText } = render(LanguageSwitcher, { variant: 'menu' });
    const select = getByRole('combobox', { name: 'Langue' }) as HTMLSelectElement;

    expect(getByText('Langue').tagName).toBe('LABEL');
    expect(Array.from(select.options).map((o) => o.textContent?.trim())).toEqual(['English', 'Nederlands', 'Français']);
  });
});
