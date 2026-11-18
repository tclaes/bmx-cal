import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
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
import { eventsStore, filtersStore } from '@core/stores';
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
    expect(screen.getByRole('button', { name: 'NL' })).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(screen.getByRole('button', { name: 'FR' }));
    expect(screen.getByRole('button', { name: 'FR' })).toHaveAttribute('aria-pressed', 'true');
  });
});
