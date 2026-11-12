import { derived } from 'svelte/store';
import { eventsStore, filtersStore } from '@core/stores';
import type { FiltersState } from '@core/stores';
import type { EventWithDetails } from '@types';
import { searchEvents } from './event-search';

export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isPast(event: EventWithDetails, today: string): boolean {
  return (event.end_date || event.date) < today;
}

/** Single source of truth for which races are visible: list, hero, count and export. */
export function filterEvents(
  events: EventWithDetails[],
  filters: FiltersState,
  today: string = todayIso()
): EventWithDetails[] {
  let result = events;

  if (!filters.showPastEvents) {
    result = result.filter(event => !isPast(event, today));
  }

  if (filters.selectedEventTypes.length > 0) {
    result = result.filter(
      event => event.event_type_id !== null && filters.selectedEventTypes.includes(event.event_type_id)
    );
  }

  if (filters.startDate) {
    result = result.filter(event => event.date >= filters.startDate!);
  }

  if (filters.endDate) {
    result = result.filter(event => event.date <= filters.endDate!);
  }

  if (filters.searchQuery) {
    result = searchEvents(result, filters.searchQuery);
  }

  return [...result].sort((a, b) => a.date.localeCompare(b.date));
}

export interface CalendarSplit {
  /** Next upcoming race (or ongoing), null when none matches. */
  hero: EventWithDetails | null;
  /** Remaining upcoming races in date order, followed by past races in date order. */
  rest: EventWithDetails[];
}

export function splitHero(events: EventWithDetails[], today: string = todayIso()): CalendarSplit {
  const upcoming = events.filter(event => !isPast(event, today));
  const past = events.filter(event => isPast(event, today));
  const [hero = null, ...others] = upcoming;
  return { hero, rest: [...others, ...past] };
}

export const visibleEvents = derived(
  [eventsStore, filtersStore],
  ([$events, $filters]) => filterEvents($events.events, $filters)
);

export const calendarSplit = derived(visibleEvents, $visible => splitHero($visible));
