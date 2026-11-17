import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';

const nav = vi.hoisted(() => vi.fn());

vi.mock('../router', async (orig) => {
  const actual = await orig<typeof import('../router')>();
  return { ...actual, navigate: nav };
});

vi.mock('@core/stores', async (orig) => {
  const actual = await orig<typeof import('@core/stores')>();
  const { writable, derived } = await import('svelte/store');
  const selected = writable<Set<string>>(new Set());
  return {
    ...actual,
    selectedEventIds: selected,
    selectedCount: derived(selected, s => s.size),
    selectEventsByType: vi.fn(async (ids: string[]) => selected.update(s => new Set([...s, ...ids]))),
    deselectEventsByType: vi.fn(async (ids: string[]) => selected.update(s => { const n = new Set(s); ids.forEach(i => n.delete(i)); return n; })),
    clearAllSelections: vi.fn(async () => selected.set(new Set())),
  };
});

import SelectionBar from '../features/my-events/SelectionBar.svelte';
import { selectedEventIds } from '@core/stores';
import { locale } from '../i18n';

beforeEach(() => {
  locale.setLocale('nl');
  nav.mockClear();
  selectedEventIds.set(new Set());
});

describe('SelectionBar', () => {
  it('renders nothing when no race is selected', () => {
    const { container } = render(SelectionBar, { isLoggedIn: true });
    expect(container.querySelector('.selection')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Selectie wissen' })).not.toBeInTheDocument();
  });

  it('signed in: shows the count and emits export and save', async () => {
    selectedEventIds.set(new Set(['1', '2']));
    const { component } = render(SelectionBar, { isLoggedIn: true });
    const onExport = vi.fn();
    const onSave = vi.fn();
    component.$on('export', onExport);
    component.$on('save', onSave);

    expect(screen.getByText('2 geselecteerd')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Exporteren naar kalender (.ics)' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Kalender opslaan' }));
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('signed in: disables export and shows progress while exporting', () => {
    selectedEventIds.set(new Set(['1']));
    render(SelectionBar, { isLoggedIn: true, exporting: true });
    expect(screen.getByRole('button', { name: 'Exporteren...' })).toBeDisabled();
  });

  it('signed out: no export or save; account and sign-in lead to their pages', async () => {
    selectedEventIds.set(new Set(['1']));
    render(SelectionBar, { isLoggedIn: false });
    expect(screen.queryByRole('button', { name: /Exporteren/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Kalender opslaan' })).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: 'Maak een account om te exporteren' }));
    expect(nav).toHaveBeenCalledWith('/register');
    await fireEvent.click(screen.getByRole('link', { name: 'Aanmelden' }));
    expect(nav).toHaveBeenCalledWith('/login');
  });

  it('clears, focuses undo and restores exactly the cleared selection', async () => {
    selectedEventIds.set(new Set(['1', '2', '3']));
    render(SelectionBar, { isLoggedIn: true });
    await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
    await waitFor(() => expect(get(selectedEventIds).size).toBe(0));
    expect(screen.getByRole('status')).toHaveTextContent('3 evenementen gewist');
    const undo = screen.getByRole('button', { name: 'Ongedaan maken' });
    await waitFor(() => expect(undo).toHaveFocus());

    selectedEventIds.set(new Set(['4']));
    await fireEvent.click(undo);
    await waitFor(() => expect([...get(selectedEventIds)].sort()).toEqual(['1', '2', '3']));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('removes the undo message after 6 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      selectedEventIds.set(new Set(['1']));
      render(SelectionBar, { isLoggedIn: false });
      await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 evenement gewist'));
      vi.advanceTimersByTime(5900);
      expect(screen.getByRole('status')).toBeInTheDocument();
      vi.advanceTimersByTime(200);
      await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
      expect(get(selectedEventIds).size).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
