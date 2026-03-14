import { writable, derived } from 'svelte/store';
import { selectionService } from '../services/selection.service';

export const selectedEventIds = writable<Set<string>>(new Set());
export const isLoadingSelections = writable<boolean>(false);

export const selectedCount = derived(
  selectedEventIds,
  $selectedEventIds => $selectedEventIds.size
);

export function loadUserSelections() {
  try {
    const eventIds = selectionService.getSelections();
    selectedEventIds.set(new Set(eventIds));
  } catch (error) {
    console.error('Failed to load selections:', error);
  }
}

export function toggleEventSelection(eventId: string) {
  const isSelected = selectionService.toggleSelection(eventId);

  selectedEventIds.update(ids => {
    const newIds = new Set(ids);
    if (isSelected) {
      newIds.add(eventId);
    } else {
      newIds.delete(eventId);
    }
    return newIds;
  });
}

export function clearAllSelections() {
  selectionService.clearAllSelections();
  selectedEventIds.set(new Set());
}
