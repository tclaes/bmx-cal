import { writable, derived, get } from 'svelte/store';
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

// Selection writes run one at a time, in the order they were started, so a newer clear
// can never be overtaken by an older select or deselect that was still writing.
let writeQueue: Promise<unknown> = Promise.resolve();

function serialized<T>(write: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(write, write);
  writeQueue = run.catch(() => undefined);
  return run;
}

export const toggleEventSelection = (eventId: string) => serialized(async () => {
  const loggedIn = await isLoggedIn();

  const isSelected = selectionService.toggleSelection(eventId);

  if (loggedIn) {
    try {
      if (isSelected) {
        await selectionService.addRemoteSelection(eventId);
      } else {
        await selectionService.removeRemoteSelection(eventId);
      }
    } catch (e) {
      // The account did not change, so this device should not either.
      selectionService.toggleSelection(eventId);
      throw e;
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
});

/**
 * After signing in or up: races selected while signed out join the account instead of
 * being replaced by the account's (possibly empty) remote selection.
 */
export const adoptLocalSelections = () => serialized(async () => {
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
});

/**
 * Clears the account first and only then this device, so a failed clear (it throws)
 * leaves the selection exactly as it was everywhere.
 */
export const clearAllSelections = () => serialized(async () => {
  if (await isLoggedIn()) {
    await selectionService.clearRemoteSelections();
  }
  selectionService.clearLocalSelections();
  selectedEventIds.set(new Set());
});

/**
 * Updates this device right away, then the account. Races whose account write fails are
 * put back on this device as they were, and the first failure is thrown, so this device
 * never shows a change the account did not get.
 */
async function mutateByType(eventIds: string[], mode: 'add' | 'remove') {
  const loggedIn = await isLoggedIn();
  const before = get(selectedEventIds);

  selectedEventIds.update(ids => {
    const newIds = new Set(ids);
    eventIds.forEach(id => mode === 'add' ? newIds.add(id) : newIds.delete(id));
    selectionService.saveLocalSelections(Array.from(newIds));
    return newIds;
  });

  if (!loggedIn) return;
  const remoteFn = mode === 'add'
    ? selectionService.addRemoteSelection
    : selectionService.removeRemoteSelection;
  const results = await Promise.allSettled(eventIds.map(id => remoteFn.call(selectionService, id)));
  const failedIds = eventIds.filter((_, i) => results[i].status === 'rejected');
  if (failedIds.length === 0) return;

  selectedEventIds.update(ids => {
    const newIds = new Set(ids);
    failedIds.forEach(id => before.has(id) ? newIds.add(id) : newIds.delete(id));
    selectionService.saveLocalSelections(Array.from(newIds));
    return newIds;
  });
  throw (results.find(r => r.status === 'rejected') as PromiseRejectedResult).reason;
}

export function selectEventsByType(eventIds: string[]) {
  return serialized(() => mutateByType(eventIds, 'add'));
}

export function deselectEventsByType(eventIds: string[]) {
  return serialized(() => mutateByType(eventIds, 'remove'));
}
