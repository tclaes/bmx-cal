import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';
import type { EventWithDetails } from '@types';

const events = vi.hoisted(() => ({ list: [] as any[] }));

vi.mock('@core/services', async (orig) => {
  const actual = await orig<typeof import('@core/services')>();
  return {
    ...actual,
    EventsService: { getAllEvents: vi.fn(async () => events.list) },
    PushService: { isSupported: () => false, isSubscribed: async () => false },
  };
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
import { selectedEventIds } from '@core/stores';
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
