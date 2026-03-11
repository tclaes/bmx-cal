import { writable } from 'svelte/store';

export interface FiltersState {
  selectedEventType: string | null;
  startDate: string | null;
  endDate: string | null;
  searchQuery: string;
}

const initialState: FiltersState = {
  selectedEventType: null,
  startDate: null,
  endDate: null,
  searchQuery: '',
};

function createFiltersStore() {
  const { subscribe, set, update } = writable<FiltersState>(initialState);

  return {
    subscribe,
    setEventType: (eventType: string | null) =>
      update(state => ({ ...state, selectedEventType: eventType })),
    setDateRange: (startDate: string | null, endDate: string | null) =>
      update(state => ({ ...state, startDate, endDate })),
    setSearchQuery: (query: string) =>
      update(state => ({ ...state, searchQuery: query })),
    reset: () => set(initialState),
  };
}

export const filtersStore = createFiltersStore();
