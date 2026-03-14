import { writable, derived } from 'svelte/store';
import { selectionService } from '../services/selection.service';
import { user } from './auth.store';

export const selectedEventIds = writable<Set<string>>(new Set());
export const isLoadingSelections = writable<boolean>(false);

export const selectedCount = derived(
  selectedEventIds,
  $selectedEventIds => $selectedEventIds.size
);

export async function loadUserSelections() {
  const currentUser = await new Promise<any>(resolve => {
    const unsubscribe = user.subscribe(u => {
      unsubscribe();
      resolve(u);
    });
  });

  if (!currentUser) {
    selectedEventIds.set(new Set());
    return;
  }

  isLoadingSelections.set(true);
  try {
    const eventIds = await selectionService.getUserSelections(currentUser.id);
    selectedEventIds.set(new Set(eventIds));
  } catch (error) {
    console.error('Failed to load selections:', error);
  } finally {
    isLoadingSelections.set(false);
  }
}

export async function toggleEventSelection(eventId: string) {
  const currentUser = await new Promise<any>(resolve => {
    const unsubscribe = user.subscribe(u => {
      unsubscribe();
      resolve(u);
    });
  });

  if (!currentUser) {
    throw new Error('Must be logged in to select events');
  }

  const isSelected = await selectionService.toggleSelection(currentUser.id, eventId);

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

export async function clearAllSelections() {
  const currentUser = await new Promise<any>(resolve => {
    const unsubscribe = user.subscribe(u => {
      unsubscribe();
      resolve(u);
    });
  });

  if (!currentUser) return;

  await selectionService.clearAllSelections(currentUser.id);
  selectedEventIds.set(new Set());
}
