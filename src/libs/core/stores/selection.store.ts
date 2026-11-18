import { writable, derived, get } from 'svelte/store';
import { selectionService } from '@core/services';
import { supabase } from '@data';
import { authStore } from './auth.store';

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

/** A write that takes longer than this no longer holds up the writes queued after it. */
export const WRITE_QUEUE_TIMEOUT_MS = 15_000;

// The account a queued write was started for. A write never runs for a different account,
// for example when one user signs out and another signs in while writes are still queued.
let currentUserId: string | null = null;
authStore.subscribe(state => { currentUserId = state.user?.id ?? null; });

export class AccountChangedError extends Error {
  constructor() {
    super('The account changed before this selection change was saved');
  }
}

function serialized<T>(write: () => Promise<T>): Promise<T> {
  const owner = currentUserId;
  const guarded = () => (owner === currentUserId ? write() : Promise.reject(new AccountChangedError()));
  const run = writeQueue.then(guarded, guarded);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>(resolve => { timer = setTimeout(resolve, WRITE_QUEUE_TIMEOUT_MS); });
  writeQueue = Promise.race([run.then(() => undefined, () => undefined).finally(() => clearTimeout(timer)), timeout]);
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
    // Wait for every insert, also after one fails, so no insert is still running once the
    // next queued write (for example a clear) starts.
    const results = await Promise.allSettled(missing.map(id => selectionService.addRemoteSelection(id)));
    const failure = results.find(r => r.status === 'rejected');
    if (failure) throw (failure as PromiseRejectedResult).reason;
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

/**
 * Replaces the whole selection, for example with a saved calendar. All-or-nothing: if the
 * account rejects any race, the account is put back as it was (best effort), this device
 * keeps its current selection, and the first failure is thrown.
 */
export const replaceSelection = (eventIds: string[]) => serialized(async () => {
  const before = Array.from(get(selectedEventIds));
  if (await isLoggedIn()) {
    await selectionService.clearRemoteSelections();
    const results = await Promise.allSettled(eventIds.map(id => selectionService.addRemoteSelection(id)));
    const failure = results.find(r => r.status === 'rejected');
    if (failure) {
      try {
        await selectionService.clearRemoteSelections();
        await Promise.allSettled(before.map(id => selectionService.addRemoteSelection(id)));
      } catch {
        // The next load reads the account again.
      }
      throw (failure as PromiseRejectedResult).reason;
    }
  }
  selectionService.saveLocalSelections(eventIds);
  selectedEventIds.set(new Set(eventIds));
});
