import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';
import type { EventWithDetails } from '@types';

const events = vi.hoisted(() => ({ list: [] as any[] }));
const push = vi.hoisted(() => ({ isSupported: vi.fn(() => true), isSubscribed: vi.fn(async () => false) }));
const nav = vi.hoisted(() => vi.fn());
const flagsSvc = vi.hoisted(() => ({ getAll: vi.fn(async () => [] as any[]), setFlag: vi.fn() }));

vi.mock('@core/services', async (orig) => {
  const actual = await orig<typeof import('@core/services')>();
  return {
    ...actual,
    EventsService: { getAllEvents: vi.fn(async () => events.list) },
    PushService: push,
    FeatureFlagService: flagsSvc,
    CalendarService: { getUserCalendars: vi.fn(async () => []), getCalendarEventIds: vi.fn(async () => []) },
  };
});

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
    loadUserSelections: vi.fn(async () => {}),
    toggleEventSelection: vi.fn(async (id: string) =>
      selected.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; })),
    selectEventsByType: vi.fn(async (ids: string[]) => selected.update(s => new Set([...s, ...ids]))),
    deselectEventsByType: vi.fn(async (ids: string[]) => selected.update(s => { const n = new Set(s); ids.forEach(i => n.delete(i)); return n; })),
    clearAllSelections: vi.fn(async () => selected.set(new Set())),
  };
});

import MyEventsPage from '../features/my-events/MyEventsPage.svelte';
import { selectedEventIds, authStore, featureFlagsStore } from '@core/stores';
import { locale } from '../i18n';

const type = (name: string, color = '#ff0000') => ({ id: name, name, color_code: color });
const ev = (id: string, typeName: string, o: Partial<EventWithDetails> = {}) => ({
  id, title: `Race ${id}`, status: 'upcoming', date: '2099-03-15', end_date: null, location: 'Dessel',
  description: '', start_time: null, end_time: null, registration_url: null, registration_deadline: null,
  registration_status: null, registration_opens: null, livestream_url: null, event_type_id: typeName,
  location_id: null, team_id: null, related_event_type_id: null, created_at: '', updated_at: '',
  event_type: type(typeName), location_details: null, ...o,
});

beforeEach(() => {
  locale.setLocale('nl');
  selectedEventIds.set(new Set());
  events.list = [
    ev('1', 'Cycling Vlaanderen'),
    ev('2', 'Cycling Vlaanderen', { date: '2099-04-01' }),
    ev('3', 'European Cup', { date: '2099-05-01' }),
    ev('4', 'Training', { date: '2099-06-01' }),
  ];
});

describe('MyEventsPage', () => {
  it('shows token labels instead of the stored colour, neutral for unknown types', async () => {
    const { container } = render(MyEventsPage);
    await screen.findByText('Race 1');
    expect(container.querySelector('.type-ec')).not.toBeNull();
    expect(container.querySelector('.type-unknown')).not.toBeNull();
    expect(container.innerHTML).not.toContain('#ff0000');
  });

  it('star toggles selection without navigating; the title links to the detail page', async () => {
    render(MyEventsPage);
    await screen.findByText('Race 1');
    expect(screen.getByRole('link', { name: 'Race 1' })).toHaveAttribute('href', '/events/1');
    await fireEvent.click(screen.getAllByRole('button', { name: 'Wedstrijd bewaren' })[0]);
    expect(get(selectedEventIds).has('1')).toBe(true);
    expect(location.pathname).not.toContain('/events/');
  });

  it('chips select all, show partial and deselect all', async () => {
    render(MyEventsPage);
    await screen.findByText('Race 1');
    const cv = () => screen.getByRole('button', { name: /^CV/ });
    expect(cv()).toHaveAttribute('aria-pressed', 'false');
    await fireEvent.click(cv());
    await waitFor(() => expect(cv()).toHaveAttribute('aria-pressed', 'true'));
    expect([...get(selectedEventIds)].sort()).toEqual(['1', '2']);
    selectedEventIds.set(new Set(['1']));
    await waitFor(() => expect(cv()).toHaveAttribute('aria-pressed', 'mixed'));
    selectedEventIds.set(new Set(['1', '2']));
    await waitFor(() => expect(cv()).toHaveAttribute('aria-pressed', 'true'));
    await fireEvent.click(cv());
    await waitFor(() => expect(get(selectedEventIds).size).toBe(0));
  });
});

describe('MyEventsPage notifications flag', () => {
  const flag = (enabled: boolean) => ({ key: 'notifications', enabled, updated_at: '', updated_by: null });
  const signIn = () => authStore.setUser({ id: 'u1', email: 'a@b.c', role: 'user', managedTeams: [] } as any);

  beforeEach(() => {
    push.isSupported.mockClear();
    push.isSubscribed.mockClear();
    authStore.setUser(null);
  });

  it('shows no block and makes no push call while the flag is off', async () => {
    flagsSvc.getAll.mockResolvedValue([flag(false)]);
    await featureFlagsStore.load();
    signIn();
    render(MyEventsPage);
    await screen.findByText('Race 1');
    expect(screen.queryByText('Deadline meldingen')).not.toBeInTheDocument();
    expect(push.isSupported).not.toHaveBeenCalled();
    expect(push.isSubscribed).not.toHaveBeenCalled();
  });

  it('shows the block and checks push once the flag is on and the user is signed in', async () => {
    flagsSvc.getAll.mockResolvedValue([flag(true)]);
    await featureFlagsStore.load();
    signIn();
    render(MyEventsPage);
    expect(await screen.findByText('Deadline meldingen')).toBeInTheDocument();
    expect(push.isSupported).toHaveBeenCalledTimes(1);
    expect(push.isSubscribed).toHaveBeenCalledTimes(1);
  });

  it('never shows the block to signed-out visitors, even with the flag on', async () => {
    flagsSvc.getAll.mockResolvedValue([flag(true)]);
    await featureFlagsStore.load();
    render(MyEventsPage);
    await screen.findByText('Race 1');
    expect(screen.queryByText('Deadline meldingen')).not.toBeInTheDocument();
    expect(push.isSupported).not.toHaveBeenCalled();
  });

  it('stays hidden when the flags cannot be read', async () => {
    flagsSvc.getAll.mockRejectedValue(new Error('network'));
    await featureFlagsStore.load();
    signIn();
    render(MyEventsPage);
    await screen.findByText('Race 1');
    expect(screen.queryByText('Deadline meldingen')).not.toBeInTheDocument();
  });
});

describe('MyEventsPage selection bar', () => {
  const signIn = () => authStore.setUser({ id: 'u1', email: 'a@b.c', role: 'user', managedTeams: [] } as any);

  beforeEach(() => {
    authStore.setUser(null);
    selectedEventIds.set(new Set());
  });

  it('shows no bar and no actions when nothing is selected', async () => {
    signIn();
    render(MyEventsPage);
    await screen.findByText('Race 1');
    expect(screen.queryByText('Selectie wissen')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Exporteren/ })).not.toBeInTheDocument();
  });

  it('signed in: count, clear, export and save', async () => {
    signIn();
    selectedEventIds.set(new Set(['1', '2']));
    render(MyEventsPage);
    await screen.findByText('Race 1');
    expect(screen.getByText('2 geselecteerd')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Selectie wissen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exporteren/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kalender opslaan' })).toBeInTheDocument();
  });

  it('signed out: count and clear, but no export or save; account action opens registration', async () => {
    nav.mockClear();
    selectedEventIds.set(new Set(['1']));
    render(MyEventsPage);
    await screen.findByText('Race 1');
    expect(screen.getByText('1 geselecteerd')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Selectie wissen' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Exporteren/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Kalender opslaan' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aanmelden' })).toHaveAttribute('href', '/login');
    await fireEvent.click(screen.getByRole('button', { name: 'Maak een account om te exporteren' }));
    expect(nav).toHaveBeenCalledWith('/register');
  });
});

describe('MyEventsPage clear with undo', () => {
  beforeEach(() => {
    authStore.setUser(null);
    selectedEventIds.set(new Set(['1', '2', '3']));
  });

  it('clears without a dialog and restores exactly the cleared selection on undo', async () => {
    render(MyEventsPage);
    await screen.findByText('Race 1');
    await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
    await waitFor(() => expect(get(selectedEventIds).size).toBe(0));
    expect(screen.getByRole('status')).toHaveTextContent('3 evenementen gewist');
    await fireEvent.click(screen.getByRole('button', { name: 'Ongedaan maken' }));
    await waitFor(() => expect([...get(selectedEventIds)].sort()).toEqual(['1', '2', '3']));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('moves focus to the undo button after clearing', async () => {
    render(MyEventsPage);
    await screen.findByText('Race 1');
    await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
    const undo = await screen.findByRole('button', { name: 'Ongedaan maken' });
    await waitFor(() => expect(undo).toHaveFocus());
  });

  it('restores exactly the cleared selection even when another race was picked meanwhile', async () => {
    render(MyEventsPage);
    await screen.findByText('Race 1');
    await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
    await waitFor(() => expect(get(selectedEventIds).size).toBe(0));
    selectedEventIds.set(new Set(['4']));
    await fireEvent.click(screen.getByRole('button', { name: 'Ongedaan maken' }));
    await waitFor(() => expect([...get(selectedEventIds)].sort()).toEqual(['1', '2', '3']));
  });

  it('removes the message after 6 seconds and keeps the selection empty', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      render(MyEventsPage);
      await screen.findByText('Race 1');
      await fireEvent.click(screen.getByRole('button', { name: 'Selectie wissen' }));
      await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
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
