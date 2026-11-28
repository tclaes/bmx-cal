import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';
import type { EventWithDetails } from '@types';

const loaded = vi.hoisted(() => ({ events: [] as any[] }));

vi.mock('@core/services', async (orig) => {
  const actual = await orig<typeof import('@core/services')>();
  return {
    ...actual,
    EventsService: { getAllEvents: vi.fn(async () => loaded.events), getEventTypes: vi.fn(async () => []), getLocations: vi.fn(async () => []) },
  };
});

import CalendarHero from '../features/calendar/CalendarHero.svelte';
import EventFilters from '../features/calendar/EventFilters.svelte';
import EventList from '../features/calendar/EventList.svelte';
import Navigation from '../layout/Navigation.svelte';
import { eventsStore, filtersStore, authStore } from '@core/stores';
import { selectionService } from '@core/services';
import { supabase } from '@data';
import { locale } from '../i18n';

const base = (id: string, o: Partial<EventWithDetails> = {}): EventWithDetails => ({
  id, title: `Race ${id}`, status: 'upcoming', date: '2099-03-15', end_date: null, location: 'Dessel',
  description: '', start_time: null, end_time: null, registration_url: 'https://reg.example',
  registration_deadline: null, registration_status: 'open', registration_opens: null, livestream_url: null,
  event_type_id: 'cv', location_id: null, team_id: null, related_event_type_id: null, created_at: '', updated_at: '',
  event_type: { id: 'cv', name: 'Cycling Vlaanderen', color_code: '#fff' } as any, location_details: null, ...o,
}) as EventWithDetails;

beforeEach(() => {
  locale.setLocale('nl');
  filtersStore.reset();
});

describe('CalendarHero', () => {
  it('shows date, title, location, label and register button', () => {
    render(CalendarHero, { props: { event: base('1') } });
    expect(screen.getByText('Volgende wedstrijd')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Race 1' })).toHaveAttribute('href', '/events/1');
    expect(screen.getByRole('link', { name: 'Dessel' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inschrijven' })).toHaveAttribute('href', 'https://reg.example');
  });

  it('shows no register button when registration is not open yet', () => {
    render(CalendarHero, { props: { event: base('1', { registration_opens: '2098-12-01', registration_status: 'upcoming' }) } });
    expect(screen.queryByRole('link', { name: 'Inschrijven' })).not.toBeInTheDocument();
  });

  it('toggles the save star', async () => {
    const { component } = render(CalendarHero, { props: { event: base('1'), saved: false } });
    let n = 0;
    component.$on('save', () => n++);
    await fireEvent.click(screen.getByRole('button', { name: 'Wedstrijd bewaren' }));
    expect(n).toBe(1);
  });
});

describe('EventFilters', () => {
  beforeEach(() => {
    eventsStore.setEventTypes([
      { id: 'cv', name: 'Cycling Vlaanderen' } as any,
      { id: 'x', name: 'Dare2Race' } as any,
    ]);
  });

  it('renders chips with a neutral chip for unknown types and selects a type', async () => {
    render(EventFilters);
    expect(screen.getByRole('button', { name: 'CV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dare2Race' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'CV' }));
    expect(get(filtersStore).selectedEventTypes).toEqual(['cv']);
    expect(screen.getByRole('button', { name: 'CV' })).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(screen.getByRole('button', { name: 'ALLE' }));
    expect(get(filtersStore).selectedEventTypes).toEqual([]);
  });

  it('toggles past events and resets', async () => {
    render(EventFilters);
    await fireEvent.click(screen.getByLabelText('Voorbije evenementen tonen'));
    expect(get(filtersStore).showPastEvents).toBe(true);
    await fireEvent.click(screen.getByRole('button', { name: 'Filters resetten' }));
    expect(get(filtersStore).showPastEvents).toBe(false);
  });
});

describe('EventList', () => {
  it('shows the hero once and the rest in the list with a count', async () => {
    eventsStore.setLoading(false);
    loaded.events = [base('1', { date: '2099-03-15' }), base('2', { date: '2099-04-19' }), base('3', { date: '2099-05-02' })];
    render(EventList);
    expect(await screen.findByText('Daarna')).toBeInTheDocument();
    expect(screen.getByText('2 wedstrijden')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Race 1' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Race 2' })).toHaveAttribute('href', '/events/2');
  });

  it('lists past races per year below the upcoming races, newest first', async () => {
    eventsStore.setLoading(false);
    filtersStore.toggleShowPastEvents();
    loaded.events = [
      base('old', { date: '2024-05-01' }), base('mid', { date: '2025-03-01' }), base('late', { date: '2025-10-12' }),
      base('1', { date: '2099-03-15' }), base('2', { date: '2099-04-19' }),
    ];
    const { container } = render(EventList);
    const section = await screen.findByRole('region', { name: 'Vorige wedstrijden' });
    expect(screen.getByText('1 wedstrijd', { selector: '.list-head:not(.previous *) .count' })).toBeInTheDocument();

    const years = within(section).getAllByRole('heading', { level: 3 });
    expect(years.map(h => h.textContent)).toEqual(['2025', '2024']);
    expect(within(section).getAllByRole('heading', { level: 4 }).map(h => h.textContent)).toEqual(['Race late', 'Race mid', 'Race old']);
    expect(within(section).getByText('2 wedstrijden')).toBeInTheDocument();
    expect(within(section).getAllByRole('link', { name: /^Race / }).map(a => a.textContent)).toEqual(['Race late', 'Race mid', 'Race old']);

    // The section comes after the last upcoming race.
    const upcomingRow = screen.getByRole('link', { name: 'Race 2' });
    expect(upcomingRow.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelectorAll('.previous')).toHaveLength(1);
  });

  it('translates the section heading and every count when the language changes', async () => {
    eventsStore.setLoading(false);
    filtersStore.toggleShowPastEvents();
    loaded.events = [
      base('a', { date: '2024-01-01' }), base('b', { date: '2024-02-01' }),
      base('1', { date: '2099-01-01' }), base('2', { date: '2099-02-01' }), base('3', { date: '2099-03-01' }),
    ];
    render(EventList);
    await screen.findByText('Vorige wedstrijden');
    expect(screen.getAllByText('2 wedstrijden')).toHaveLength(2);
    locale.setLocale('en');
    expect(await screen.findByText('Previous races')).toBeInTheDocument();
    expect(screen.getAllByText('2 races')).toHaveLength(2);
    expect(screen.queryByText('2 wedstrijden')).not.toBeInTheDocument();
  });

  it('shows no previous-races section while past events are hidden', async () => {
    eventsStore.setLoading(false);
    loaded.events = [base('old', { date: '2024-05-01' }), base('1', { date: '2099-03-15' })];
    render(EventList);
    expect(await screen.findByRole('link', { name: 'Race 1' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Vorige wedstrijden' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Race old' })).not.toBeInTheDocument();
  });

  it('shows the previous-races section instead of the empty state when only past races match', async () => {
    eventsStore.setLoading(false);
    filtersStore.toggleShowPastEvents();
    loaded.events = [base('old', { date: '2024-05-01' })];
    render(EventList);
    const section = await screen.findByRole('region', { name: 'Vorige wedstrijden' });
    expect(within(section).getByRole('link', { name: 'Race old' })).toBeInTheDocument();
    expect(screen.queryByText('Volgende wedstrijd')).not.toBeInTheDocument();
    expect(screen.queryByText('Daarna')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Filters resetten' })).not.toBeInTheDocument();
  });

  it('shows a translated error and keeps the list when the account rejects a save', async () => {
    eventsStore.setLoading(false);
    loaded.events = [base('1', { date: '2099-03-15' }), base('2', { date: '2099-04-19' })];
    authStore.setUser({ id: 'u1', email: 'a@b.c', role: 'user', managedTeams: [] } as any);
    const getUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({ data: { user: { id: 'u1' } } } as any);
    // Signed in, the page reads the account's selection on mount: keep that off the network.
    const getRemote = vi.spyOn(selectionService, 'getRemoteSelections').mockResolvedValue([]);
    const spy = vi.spyOn(selectionService, 'addRemoteSelection').mockRejectedValueOnce(new Error('denied'));
    try {
      render(EventList);
      const race2 = (await screen.findByRole('link', { name: 'Race 2' })).closest('article')!;
      const star = within(race2 as HTMLElement).getByRole('button', { name: 'Wedstrijd bewaren' });
      await fireEvent.click(star);
      expect(await screen.findByText('Je selectie bijwerken mislukt. Probeer opnieuw.')).toBeInTheDocument();
      expect(spy).toHaveBeenCalledWith('2', 'u1');
      expect(star).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('link', { name: 'Race 2' })).toBeInTheDocument();

      // Signing in as someone else clears a message that belonged to the previous account.
      authStore.setUser({ id: 'other', email: 'o@x.y', role: 'user', managedTeams: [] } as any);
      await waitFor(() => expect(screen.queryByText('Je selectie bijwerken mislukt. Probeer opnieuw.')).not.toBeInTheDocument());
    } finally {
      spy.mockRestore();
      getUser.mockRestore();
      getRemote.mockRestore();
      authStore.setUser(null);
    }
  });

  it('ignores a save failure that arrives after the account changed', async () => {
    eventsStore.setLoading(false);
    loaded.events = [base('1', { date: '2099-03-15' }), base('2', { date: '2099-04-19' })];
    authStore.setUser({ id: 'u1', email: 'a@b.c', role: 'user', managedTeams: [] } as any);
    const getUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({ data: { user: { id: 'u1' } } } as any);
    // Signed in, the page reads the account's selection on mount: keep that off the network.
    const getRemote = vi.spyOn(selectionService, 'getRemoteSelections').mockResolvedValue([]);
    let failLate!: (e: Error) => void;
    const spy = vi.spyOn(selectionService, 'addRemoteSelection')
      .mockImplementationOnce(() => new Promise<void>((_, reject) => { failLate = reject; }));
    try {
      render(EventList);
      const race2 = (await screen.findByRole('link', { name: 'Race 2' })).closest('article')!;
      await fireEvent.click(within(race2 as HTMLElement).getByRole('button', { name: 'Wedstrijd bewaren' }));
      await waitFor(() => expect(spy).toHaveBeenCalled());
      authStore.setUser({ id: 'u2', email: 'b@b.c', role: 'user', managedTeams: [] } as any);
      failLate(new Error('denied'));
      await new Promise(r => setTimeout(r, 0));
      expect(screen.queryByText('Je selectie bijwerken mislukt. Probeer opnieuw.')).not.toBeInTheDocument();
    } finally {
      spy.mockRestore();
      getUser.mockRestore();
      getRemote.mockRestore();
      authStore.setUser(null);
    }
  });

  it('shows the empty state with a reset action', async () => {
    loaded.events = [];
    render(EventList);
    expect(await screen.findByText('Geen evenementen gevonden')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters resetten' })).toBeInTheDocument();
  });
});

describe('Navigation', () => {
  it('shows an outlined sign-in link and a locale switcher for signed-out users', async () => {
    render(Navigation);
    expect(screen.getAllByRole('link', { name: 'Aanmelden' }).length).toBeGreaterThan(0);
    const language = screen.getByRole('combobox', { name: 'Taal' }) as HTMLSelectElement;
    expect(language.value).toBe('nl');
    language.value = 'fr';
    await fireEvent.change(language);
    expect((screen.getByRole('combobox', { name: 'Langue' }) as HTMLSelectElement).value).toBe('fr');
  });
});
