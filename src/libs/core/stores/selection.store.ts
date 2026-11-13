import { writable, derived } from 'svelte/store';
import { selectionService } from '@core/services';
import { supabase } from '@data';

export const selectedEventIds = writable<Set<string>>(new Set());
export const isLoadingSelections = writable<boolean>(false);

export const selectedCount = derived(
  selectedEventIds,
  $selectedEventIds => $selectedEventIds.size
);

async function isLoggedIn(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

export async function loadUserSelections() {
  try {
    if (await isLoggedIn()) {
      const eventIds = await selectionService.getRemoteSelections();
      selectionService.saveLocalSelections(eventIds);
      selectedEventIds.set(new Set(eventIds));
    } else {
      const eventIds = selectionService.getLocalSelections();
      selectedEventIds.set(new Set(eventIds));
    }
  } catch {
    const eventIds = selectionService.getLocalSelections();
    selectedEventIds.set(new Set(eventIds));
  }
}

export async function toggleEventSelection(eventId: string) {
  const loggedIn = await isLoggedIn();

  const isSelected = selectionService.toggleSelection(eventId);

  if (loggedIn) {
    if (isSelected) {
      await selectionService.addRemoteSelection(eventId);
    } else {
      await selectionService.removeRemoteSelection(eventId);
    }
  }

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

/**
 * After signing in or up: races selected while signed out join the account instead of
 * being replaced by the account's (possibly empty) remote selection.
 */
export async function adoptLocalSelections() {
  const local = selectionService.getLocalSelections();
  if (local.length === 0) return;
  try {
    const remote = new Set(await selectionService.getRemoteSelections());
    const missing = local.filter(id => !remote.has(id));
    await Promise.all(missing.map(id => selectionService.addRemoteSelection(id)));
    const merged = Array.from(new Set([...remote, ...local]));
    selectionService.saveLocalSelections(merged);
    selectedEventIds.set(new Set(merged));
  } catch {
    // Keep the local selection; the next load syncs it.
  }
}

export async function clearAllSelections() {
  selectionService.clearLocalSelections();
  if (await isLoggedIn()) {
    await selectionService.clearRemoteSelections();
  }
  selectedEventIds.set(new Set());
}

async function mutateByType(eventIds: string[], mode: 'add' | 'remove') {
  const loggedIn = await isLoggedIn();

  selectedEventIds.update(ids => {
    const newIds = new Set(ids);
    eventIds.forEach(id => mode === 'add' ? newIds.add(id) : newIds.delete(id));
    selectionService.saveLocalSelections(Array.from(newIds));
    return newIds;
  });

  if (loggedIn) {
    const remoteFn = mode === 'add'
      ? selectionService.addRemoteSelection
      : selectionService.removeRemoteSelection;
    await Promise.all(eventIds.map(id => remoteFn.call(selectionService, id)));
  }
}

export async function selectEventsByType(eventIds: string[]) {
  await mutateByType(eventIds, 'add');
}

export async function deselectEventsByType(eventIds: string[]) {
  await mutateByType(eventIds, 'remove');
}
