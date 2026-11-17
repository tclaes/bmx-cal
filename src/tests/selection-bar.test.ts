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
import { selectedEventIds, clearAllSelections, deselectEventsByType, selectEventsByType } from '@core/stores';
import { locale } from '../i18n';

beforeEach(() => {
  locale.setLocale('nl');
  nav.mockClear();
  vi.mocked(selectEventsByType).mockClear();
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

  it('moves focus back to the clear control after undo', async () => {
    selectedEventIds.set(new Set(['1', '2']));
    render(SelectionBar, { isLoggedIn: true });
    await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
    await fireEvent.click(await screen.findByRole('button', { name: 'Ongedaan maken' }));
    const clear = await screen.findByRole('button', { name: 'Selectie wissen' });
    await waitFor(() => expect(clear).toHaveFocus());
  });

  it('does not re-add cleared races when the user clears again while undo is still running', async () => {
    selectedEventIds.set(new Set(['1', '2']));
    render(SelectionBar, { isLoggedIn: true });
    await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
    await waitFor(() => expect(get(selectedEventIds).size).toBe(0));

    // A newer pick makes undo remove it first; hold that removal open.
    selectedEventIds.set(new Set(['4']));
    let finishRemoval!: () => void;
    vi.mocked(deselectEventsByType).mockImplementationOnce(
      (ids: string[]) => new Promise<void>((resolve) => {
        finishRemoval = () => {
          selectedEventIds.update(s => { const n = new Set(s); ids.forEach(i => n.delete(i)); return n; });
          resolve();
        };
      }),
    );
    await fireEvent.click(screen.getByRole('button', { name: 'Ongedaan maken' }));

    // The bar is back (race 4 is still selected); clear again before the removal finishes.
    await fireEvent.click(await screen.findByRole('button', { name: 'Selectie wissen' }));
    await waitFor(() => expect(get(selectedEventIds).size).toBe(0));
    finishRemoval();

    await new Promise(r => setTimeout(r, 0));
    expect(get(selectedEventIds).size).toBe(0);
    expect(vi.mocked(selectEventsByType)).not.toHaveBeenCalledWith(expect.arrayContaining(['1', '2']));
  });

  it('still restores the cleared races when a newer clear fails while undo is running', async () => {
    selectedEventIds.set(new Set(['1', '2']));
    render(SelectionBar, { isLoggedIn: true });
    await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
    await waitFor(() => expect(get(selectedEventIds).size).toBe(0));

    selectedEventIds.set(new Set(['4']));
    let finishRemoval!: () => void;
    vi.mocked(deselectEventsByType).mockImplementationOnce(
      (ids: string[]) => new Promise<void>((resolve) => {
        finishRemoval = () => {
          selectedEventIds.update(s => { const n = new Set(s); ids.forEach(i => n.delete(i)); return n; });
          resolve();
        };
      }),
    );
    await fireEvent.click(screen.getByRole('button', { name: 'Ongedaan maken' }));

    // The newer clear fails and changes nothing, so it must not cancel the undo.
    vi.mocked(clearAllSelections).mockRejectedValueOnce(new Error('network down'));
    await fireEvent.click(await screen.findByRole('button', { name: 'Selectie wissen' }));
    finishRemoval();

    await waitFor(() => expect([...get(selectedEventIds)].sort()).toEqual(['1', '2']));
  });

  it('removes the undo message after 6 seconds', async () => {
    // The clock only moves when the test moves it, so slow runs cannot fire the timer early.
    vi.useFakeTimers();
    try {
      selectedEventIds.set(new Set(['1']));
      render(SelectionBar, { isLoggedIn: false });
      await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
      await vi.advanceTimersByTimeAsync(0);
      expect(screen.getByRole('status')).toHaveTextContent('1 evenement gewist');
      await vi.advanceTimersByTimeAsync(5900);
      expect(screen.getByRole('status')).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(200);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(get(selectedEventIds).size).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('emits a translated error and shows no undo message when clearing fails', async () => {
    vi.mocked(clearAllSelections).mockRejectedValueOnce(new Error('network down'));
    selectedEventIds.set(new Set(['1', '2']));
    const { component } = render(SelectionBar, { isLoggedIn: true });
    const onError = vi.fn();
    component.$on('error', (e: CustomEvent<string>) => onError(e.detail));

    await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith('Selectie wissen mislukt'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(get(selectedEventIds).size).toBe(2);
  });

  it('still restores the cleared races when removing a newer pick fails, and offers undo again', async () => {
    selectedEventIds.set(new Set(['1', '2']));
    const { component } = render(SelectionBar, { isLoggedIn: true });
    const onError = vi.fn();
    component.$on('error', (e: CustomEvent<string>) => onError(e.detail));

    await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
    await waitFor(() => expect(get(selectedEventIds).size).toBe(0));
    selectedEventIds.set(new Set(['4']));
    vi.mocked(deselectEventsByType).mockRejectedValueOnce(new Error('network down'));
    await fireEvent.click(screen.getByRole('button', { name: 'Ongedaan maken' }));

    await waitFor(() => expect(onError).toHaveBeenLastCalledWith('Selectie herstellen mislukt. Probeer opnieuw.'));
    expect([...get(selectedEventIds)].sort()).toEqual(['1', '2', '4']);
    expect(screen.getByRole('status')).toHaveTextContent('2 evenementen gewist');

    // Retrying finishes the job: the newer pick is removed and the error is cleared.
    await fireEvent.click(screen.getByRole('button', { name: 'Ongedaan maken' }));
    await waitFor(() => expect([...get(selectedEventIds)].sort()).toEqual(['1', '2']));
    expect(onError).toHaveBeenLastCalledWith('');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keeps undo available when restoring fails, so nothing is lost', async () => {
    selectedEventIds.set(new Set(['1', '2', '3']));
    const { component } = render(SelectionBar, { isLoggedIn: true });
    const onError = vi.fn();
    component.$on('error', (e: CustomEvent<string>) => onError(e.detail));

    await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
    await waitFor(() => expect(get(selectedEventIds).size).toBe(0));
    vi.mocked(selectEventsByType).mockRejectedValueOnce(new Error('network down'));
    await fireEvent.click(screen.getByRole('button', { name: 'Ongedaan maken' }));

    await waitFor(() => expect(onError).toHaveBeenLastCalledWith('Selectie herstellen mislukt. Probeer opnieuw.'));
    expect(get(selectedEventIds).size).toBe(0);
    const undo = screen.getByRole('button', { name: 'Ongedaan maken' });
    expect(screen.getByRole('status')).toHaveTextContent('3 evenementen gewist');
    await waitFor(() => expect(undo).toHaveFocus());

    await fireEvent.click(undo);
    await waitFor(() => expect([...get(selectedEventIds)].sort()).toEqual(['1', '2', '3']));
    expect(onError).toHaveBeenLastCalledWith('');
  });
});
