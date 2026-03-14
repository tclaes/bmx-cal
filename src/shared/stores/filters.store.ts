import { writable } from 'svelte/store';

export interface FiltersState {
  selectedEventTypes: string[];
  startDate: string | null;
  endDate: string | null;
  searchQuery: string;
  showPastEvents: boolean;
}

const initialState: FiltersState = {
  selectedEventTypes: [],
  startDate: null,
  endDate: null,
  searchQuery: '',
  showPastEvents: false,
};

function createFiltersStore() {
  const { subscribe, set, update } = writable<FiltersState>(initialState);

  return {
    subscribe,
    setEventTypes: (eventTypes: string[]) =>
      update(state => ({ ...state, selectedEventTypes: eventTypes })),
    toggleEventType: (eventType: string) =>
      update(state => {
        const types = state.selectedEventTypes.includes(eventType)
          ? state.selectedEventTypes.filter(t => t !== eventType)
          : [...state.selectedEventTypes, eventType];
        return { ...state, selectedEventTypes: types };
      }),
    setDateRange: (startDate: string | null, endDate: string | null) =>
      update(state => ({ ...state, startDate, endDate })),
    setSearchQuery: (query: string) =>
      update(state => ({ ...state, searchQuery: query })),
    toggleShowPastEvents: () =>
      update(state => ({ ...state, showPastEvents: !state.showPastEvents })),
    reset: () => set(initialState),
  };
}

export const filtersStore = createFiltersStore();
