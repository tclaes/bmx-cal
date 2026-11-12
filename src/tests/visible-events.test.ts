import { describe, it, expect } from 'vitest';
import { filterEvents, splitHero } from '../features/calendar/visible-events';
import type { EventWithDetails } from '@types';
import type { FiltersState } from '@core/stores';

const TODAY = '2026-06-15';

const ev = (id: string, date: string, o: Partial<EventWithDetails> = {}): EventWithDetails => ({
  id, title: `Race ${id}`, status: 'upcoming', date, end_date: null, location: 'Track',
  description: '', start_time: null, end_time: null, registration_url: null,
  registration_deadline: null, registration_status: null, registration_opens: null,
  livestream_url: null, event_type_id: 'cv', location_id: null, team_id: null,
  related_event_type_id: null, created_at: '', updated_at: '', event_type: null,
  location_details: null, ...o,
}) as EventWithDetails;

const filters = (o: Partial<FiltersState> = {}): FiltersState => ({
  selectedEventTypes: [], startDate: null, endDate: null, searchQuery: '', showPastEvents: false, ...o,
});

const events = [
  ev('past', '2026-05-01'),
  ev('late', '2026-09-01', { event_type_id: 'ec' }),
  ev('soon', '2026-06-20'),
  ev('ongoing', '2026-06-14', { end_date: '2026-06-16' }),
];

describe('filterEvents', () => {
  it('hides past events by default and sorts by date', () => {
    expect(filterEvents(events, filters(), TODAY).map(e => e.id)).toEqual(['ongoing', 'soon', 'late']);
  });
  it('shows past events when enabled', () => {
    expect(filterEvents(events, filters({ showPastEvents: true }), TODAY).map(e => e.id)).toEqual(['past', 'ongoing', 'soon', 'late']);
  });
  it('filters by type', () => {
    expect(filterEvents(events, filters({ selectedEventTypes: ['ec'] }), TODAY).map(e => e.id)).toEqual(['late']);
  });
  it('filters by date range and search', () => {
    expect(filterEvents(events, filters({ startDate: '2026-06-18' }), TODAY).map(e => e.id)).toEqual(['soon', 'late']);
    expect(filterEvents(events, filters({ searchQuery: 'race late' }), TODAY).map(e => e.id)).toEqual(['late']);
  });
});

describe('splitHero', () => {
  it('uses the first upcoming race as hero', () => {
    const { hero, rest } = splitHero(filterEvents(events, filters(), TODAY), TODAY);
    expect(hero?.id).toBe('ongoing');
    expect(rest.map(e => e.id)).toEqual(['soon', 'late']);
  });
  it('keeps the hero upcoming and puts past races after upcoming ones', () => {
    const { hero, rest } = splitHero(filterEvents(events, filters({ showPastEvents: true }), TODAY), TODAY);
    expect(hero?.id).toBe('ongoing');
    expect(rest.map(e => e.id)).toEqual(['soon', 'late', 'past']);
  });
  it('has no hero when nothing is upcoming', () => {
    const { hero, rest } = splitHero([events[0]], TODAY);
    expect(hero).toBeNull();
    expect(rest.map(e => e.id)).toEqual(['past']);
  });
});

describe('visibleEvents store (export input)', () => {
  it('follows the active filters', async () => {
    const { get } = await import('svelte/store');
    const { eventsStore, filtersStore } = await import('@core/stores');
    const { visibleEvents } = await import('../features/calendar/visible-events');
    const future = (id: string, type: string) => ev(id, '2099-01-01', { event_type_id: type });
    eventsStore.setEvents([future('a', 'cv'), future('b', 'ec')]);
    filtersStore.reset();
    expect(get(visibleEvents).map(e => e.id)).toEqual(['a', 'b']);
    filtersStore.setEventTypes(['ec']);
    expect(get(visibleEvents).map(e => e.id)).toEqual(['b']);
    filtersStore.reset();
  });
});
