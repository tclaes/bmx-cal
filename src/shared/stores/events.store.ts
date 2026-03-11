import { writable, derived } from 'svelte/store';
import type { EventWithType, EventType } from '@types';

export interface EventsState {
  events: EventWithType[];
  eventTypes: EventType[];
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  events: [],
  eventTypes: [],
  loading: false,
  error: null,
};

function createEventsStore() {
  const { subscribe, set, update } = writable<EventsState>(initialState);

  return {
    subscribe,
    setEvents: (events: EventWithType[]) =>
      update(state => ({ ...state, events })),
    setEventTypes: (eventTypes: EventType[]) =>
      update(state => ({ ...state, eventTypes })),
    setLoading: (loading: boolean) =>
      update(state => ({ ...state, loading })),
    setError: (error: string | null) =>
      update(state => ({ ...state, error })),
    addEvent: (event: EventWithType) =>
      update(state => ({ ...state, events: [...state.events, event] })),
    updateEvent: (updatedEvent: EventWithType) =>
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
