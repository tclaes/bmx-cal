import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import type { EventWithDetails } from '@types';

const getEventById = vi.hoisted(() => vi.fn());
vi.mock('@core/services', async (orig) => {
  const actual = await orig<typeof import('@core/services')>();
  return { ...actual, EventsService: { getEventById, getAllEvents: vi.fn(async () => []), getEventTypes: vi.fn(async () => []), getLocations: vi.fn(async () => []) } };
});

import EventDetailPage from '../features/calendar/EventDetailPage.svelte';
import { findRoute } from '../router/routes';
import { routeParams } from '../router';
import { eventsStore, authStore } from '@core/stores';
import { selectionService } from '@core/services';
import { supabase } from '@data';
import { locale } from '../i18n';

const ev = (id: string, o: Partial<EventWithDetails> = {}): EventWithDetails => ({
  id, title: `Race ${id}`, status: 'upcoming', date: '2099-03-15', end_date: null, location: 'Dessel',
  description: 'Fun race', start_time: '10:00:00', end_time: null, registration_url: 'https://reg.example',
  registration_deadline: '2099-03-12', registration_status: 'open', registration_opens: null, livestream_url: null,
  event_type_id: 'cv', location_id: null, team_id: 't1', related_event_type_id: null, created_at: '', updated_at: '',
  event_type: { id: 'cv', name: 'Cycling Vlaanderen', color_code: '#fff' } as any, location_details: null, ...o,
}) as EventWithDetails;

beforeEach(() => {
  locale.setLocale('nl');
  getEventById.mockReset();
  eventsStore.setEvents([]);
  authStore.setUser(null);
  routeParams.set({});
});

describe('/events/:id route', () => {
  it('matches as a prefix route', () => {
    const r = findRoute('/events/abc');
    expect(r?.path).toBe('/events/:id');
    expect(r?.prefix).toBe(true);
  });
});

describe('EventDetailPage', () => {
  it('uses the store when the event is already loaded', async () => {
    eventsStore.setEvents([ev('1')]);
    routeParams.set({ id: '1' });
    render(EventDetailPage);
    expect(await screen.findByRole('heading', { name: 'Race 1' })).toBeInTheDocument();
    expect(getEventById).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Inschrijven' })).toHaveAttribute('href', 'https://reg.example');
    expect(document.title).toContain('Race 1');
  });

  it('falls back to the service when opened directly', async () => {
    getEventById.mockResolvedValue(ev('9'));
    routeParams.set({ id: '9' });
    render(EventDetailPage);
    expect(await screen.findByRole('heading', { name: 'Race 9' })).toBeInTheDocument();
    expect(getEventById).toHaveBeenCalledWith('9');
  });

  it('shows a translated error when the account rejects a save', async () => {
    eventsStore.setEvents([ev('1')]);
    routeParams.set({ id: '1' });
    authStore.setUser({ id: 'u1', email: 'a@b.c', role: 'user', managedTeams: [] } as any);
    const getUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({ data: { user: { id: 'u1' } } } as any);
    const spy = vi.spyOn(selectionService, 'addRemoteSelection').mockRejectedValueOnce(new Error('denied'));
    try {
      render(EventDetailPage);
      await fireEvent.click(await screen.findByRole('button', { name: 'Wedstrijd bewaren' }));
      expect(await screen.findByText('Je selectie bijwerken mislukt. Probeer opnieuw.')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Race 1' })).toBeInTheDocument();

      // Opening another race does not carry the message over.
      eventsStore.setEvents([ev('1'), ev('2')]);
      routeParams.set({ id: '2' });
      expect(await screen.findByRole('heading', { name: 'Race 2' })).toBeInTheDocument();
      expect(screen.queryByText('Je selectie bijwerken mislukt. Probeer opnieuw.')).not.toBeInTheDocument();
    } finally {
      spy.mockRestore();
      getUser.mockRestore();
    }
  });

  it('ignores a save result that arrives after another race opened', async () => {
    eventsStore.setEvents([ev('1'), ev('2')]);
    routeParams.set({ id: '1' });
    authStore.setUser({ id: 'u1', email: 'a@b.c', role: 'user', managedTeams: [] } as any);
    const getUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({ data: { user: { id: 'u1' } } } as any);
    let rejectSave!: (e: Error) => void;
    const spy = vi.spyOn(selectionService, 'addRemoteSelection')
      .mockImplementationOnce(() => new Promise<void>((_, reject) => { rejectSave = reject; }));
    try {
      render(EventDetailPage);
      await fireEvent.click(await screen.findByRole('button', { name: 'Wedstrijd bewaren' }));
      routeParams.set({ id: '2' });
      expect(await screen.findByRole('heading', { name: 'Race 2' })).toBeInTheDocument();
      rejectSave(new Error('denied'));
      await new Promise(r => setTimeout(r, 0));
      expect(screen.queryByText('Je selectie bijwerken mislukt. Probeer opnieuw.')).not.toBeInTheDocument();
    } finally {
      spy.mockRestore();
      getUser.mockRestore();
    }
  });

  it('shows not found with a link back', async () => {
    getEventById.mockResolvedValue(null);
    routeParams.set({ id: 'nope' });
    render(EventDetailPage);
    expect(await screen.findByText('Wedstrijd niet gevonden')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Terug naar de kalender/ }).length).toBeGreaterThan(0);
  });

  it('shows no register button when registration is closed', async () => {
    eventsStore.setEvents([ev('1', { registration_deadline: '2000-01-01' })]);
    routeParams.set({ id: '1' });
    render(EventDetailPage);
    await screen.findByRole('heading', { name: 'Race 1' });
    expect(screen.queryByRole('link', { name: 'Inschrijven' })).not.toBeInTheDocument();
  });

  it('shows the edit action only to permitted users', async () => {
    eventsStore.setEvents([ev('1')]);
    routeParams.set({ id: '1' });
    const { unmount } = render(EventDetailPage);
    await screen.findByRole('heading', { name: 'Race 1' });
    expect(screen.queryByRole('button', { name: 'Evenement bewerken' })).not.toBeInTheDocument();
    unmount();

    authStore.setUser({ id: 'u', email: 'a@b.c', role: 'admin', managedTeams: [] } as any);
    render(EventDetailPage);
    expect(await screen.findByRole('button', { name: 'Evenement bewerken' })).toBeInTheDocument();
  });
});
