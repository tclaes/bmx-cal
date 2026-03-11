import { writable, derived } from 'svelte/store';
import type { EventWithDetails, EventType, Location } from '@types';

export interface EventsState {
  events: EventWithDetails[];
  eventTypes: EventType[];
  locations: Location[];
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  events: [],
  eventTypes: [],
  locations: [],
  loading: false,
  error: null,
};

function createEventsStore() {
  const { subscribe, set, update } = writable<EventsState>(initialState);

  return {
    subscribe,
    setEvents: (events: EventWithDetails[]) =>
      update(state => ({ ...state, events })),
    setEventTypes: (eventTypes: EventType[]) =>
      update(state => ({ ...state, eventTypes })),
    setLocations: (locations: Location[]) =>
      update(state => ({ ...state, locations })),
    setLoading: (loading: boolean) =>
      update(state => ({ ...state, loading })),
    setError: (error: string | null) =>
      update(state => ({ ...state, error })),
    addEvent: (event: EventWithDetails) =>
      update(state => ({ ...state, events: [...state.events, event] })),
    updateEvent: (updatedEvent: EventWithDetails) =>
      update(state => ({
        ...state,
        events: state.events.map(e => e.id === updatedEvent.id ? updatedEvent : e),
      })),
    removeEvent: (id: string) =>
      update(state => ({
        ...state,
        events: state.events.filter(e => e.id !== id),
      })),
    reset: () => set(initialState),
  };
}

export const eventsStore = createEventsStore();

export const upcomingEvents = derived(
  eventsStore,
  $eventsStore => $eventsStore.events.filter(e => e.status === 'upcoming')
);
