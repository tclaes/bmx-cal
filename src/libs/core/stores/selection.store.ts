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

/** A write that has been running this long no longer holds up the writes queued after it. */
export const WRITE_QUEUE_TIMEOUT_MS = 15_000;

// The signed-in account as the app knows it. A write is bound to the account it was started
// for: it never runs, or keeps writing, after another account signed in or the user signed out.
let currentUserId: string | null = null;
authStore.subscribe(state => { currentUserId = state.user?.id ?? null; });

export class AccountChangedError extends Error {
  constructor() {
    super('The account changed before this selection change was saved');
  }
}

interface WriteAccount {
  /** The account to write to, or null when signed out (this device only). */
  userId: string | null;
  /** Throws AccountChangedError if the account changed; call it before every account write
   *  and before changing this device after an account write. */
  check(): void;
  /** True once the account changed: this device then belongs to the new account, so a write
   *  for the old one must leave it alone (no commit, no rollback). */
  changed(): boolean;
}

function serialized<T>(write: (account: WriteAccount) => Promise<T>): Promise<T> {
  const owner = currentUserId;
  const changed = () => currentUserId !== owner;
  const check = () => {
    if (changed()) throw new AccountChangedError();
  };
  let releaseQueue!: () => void;
  const released = new Promise<void>(resolve => { releaseQueue = resolve; });

  const begin = async () => {
    // The timeout starts when this write starts, not while it waits behind earlier writes.
    const timer = setTimeout(releaseQueue, WRITE_QUEUE_TIMEOUT_MS);
    try {
      check();
      const { data: { user }, error } = await supabase.auth.getUser();
      check();
      if (owner) {
        // The app says this account is signed in: the write must reach it, or fail visibly.
        // It is never quietly downgraded to a device-only write.
        if (error) throw error;
        if (!user || user.id !== owner) throw new AccountChangedError();
      }
      return await write({ userId: user?.id ?? null, check, changed });
    } finally {
      clearTimeout(timer);
      releaseQueue();
    }
  };

  const run = writeQueue.then(begin, begin);
  writeQueue = released;
  return run;
}

/** The account write for each kind of change, so callers pick one by key instead of branching. */
const remoteWrites = {
  add: (eventId: string, userId: string) => selectionService.addRemoteSelection(eventId, userId),
  remove: (eventId: string, userId: string) => selectionService.removeRemoteSelection(eventId, userId),
} as const;

type WriteMode = keyof typeof remoteWrites;

/** The matching change to the shown selection, keyed the same way. */
const localChanges: Record<WriteMode, (ids: Set<string>, eventId: string) => unknown> = {
  add: (ids, eventId) => ids.add(eventId),
  remove: (ids, eventId) => ids.delete(eventId),
};

/** Narrows a settled result to the rejected case, so `.reason` needs no cast. */
function isRejected(result: PromiseSettledResult<unknown>): result is PromiseRejectedResult {
  return result.status === 'rejected';
}

export const toggleEventSelection = (eventId: string) => serialized(async ({ userId, check, changed }) => {
  const isSelected = selectionService.toggleSelection(eventId);
  const mode: WriteMode = isSelected ? 'add' : 'remove';

  if (userId) {
    try {
      check();
      await remoteWrites[mode](eventId, userId);
      check(); // signed out or switched while writing: don't commit to the new account's device
    } catch (e) {
      // The account did not change, so this device should not either. After an account
      // change this device belongs to the new account: leave it alone. A late failure (after
      // the queue timeout) only rolls back if no newer write changed this race since.
      const stillOurs = selectionService.getLocalSelections().includes(eventId) === isSelected;
      if (!changed() && stillOurs) selectionService.toggleSelection(eventId);
      throw e;
    }
  }

  selectedEventIds.update(ids => {
    const newIds = new Set(ids);
    localChanges[mode](newIds, eventId);
    return newIds;
  });
});

/**
 * After signing in or up: races selected while signed out join the account instead of
 * being replaced by the account's (possibly empty) remote selection.
 */
export const adoptLocalSelections = () => serialized(async ({ userId, check }) => {
  const local = selectionService.getLocalSelections();
  if (local.length === 0 || !userId) return;
  try {
    const remote = new Set(await selectionService.getRemoteSelections());
    const missing = local.filter(id => !remote.has(id));
    check();
    // Wait for every insert, also after one fails, so no insert is still running once the
    // next queued write (for example a clear) starts.
    const results = await Promise.allSettled(missing.map(id => remoteWrites.add(id, userId)));
    const failure = results.find(isRejected);
    if (failure) throw failure.reason;
    check();
    const merged = Array.from(new Set([...remote, ...local]));
    selectionService.saveLocalSelections(merged);
    selectedEventIds.set(new Set(merged));
  } catch (e) {
    // Signing in must not fail because of this: keep the local selection (the next load syncs
    // it) and leave a trace of why the merge did not happen.
    console.warn('[selection] Could not merge the signed-out selection into the account; keeping it on this device.', e);
  }
});

/**
 * Clears the account first and only then this device, so a failed clear (it throws)
 * leaves the selection exactly as it was everywhere. Clearing this device does not throw: if storage
 * fails the error is logged, the shown selection is still cleared and the saved copy can stay behind.
 */
export const clearAllSelections = () => serialized(async ({ userId, check }) => {
  if (userId) {
    check();
    await selectionService.clearRemoteSelections(userId);
    check(); // switched while clearing: the new account's device is not cleared
  }
  selectionService.clearLocalSelections();
  selectedEventIds.set(new Set());
});

/**
 * Updates this device right away, then the account. Races whose account write fails are
 * put back on this device as they were, and the first failure is thrown, so this device
 * never shows a change the account did not get.
 */
async function mutateByType(eventIds: string[], mode: 'add' | 'remove', { userId, check, changed }: WriteAccount) {
  const before = get(selectedEventIds);

  const putBack = (ids: string[]) => selectedEventIds.update(current => {
    const newIds = new Set(current);
    ids.forEach(id => before.has(id) ? newIds.add(id) : newIds.delete(id));
    selectionService.saveLocalSelections(Array.from(newIds));
    return newIds;
  });

  selectedEventIds.update(ids => {
    const newIds = new Set(ids);
    eventIds.forEach(id => localChanges[mode](newIds, id));
    selectionService.saveLocalSelections(Array.from(newIds));
    return newIds;
  });

  if (!userId) return;
  try {
    check();
  } catch (e) {
    putBack(eventIds);
    throw e;
  }
  const results = await Promise.allSettled(eventIds.map(id => remoteWrites[mode](id, userId)));
  // Switched while writing: this device now belongs to the new account, leave it alone.
  if (changed()) throw new AccountChangedError();
  const failedIds = eventIds.filter((_, i) => isRejected(results[i]));
  if (failedIds.length === 0) return;

  // A late failure (after the queue timeout) only puts back races no newer write changed since.
  const current = get(selectedEventIds);
  putBack(failedIds.filter(id => current.has(id) === (mode === 'add')));
  throw results.find(isRejected)!.reason; // there is at least one failed id, so one result was rejected
}

export function selectEventsByType(eventIds: string[]) {
  return serialized(account => mutateByType(eventIds, 'add', account));
}

export function deselectEventsByType(eventIds: string[]) {
  return serialized(account => mutateByType(eventIds, 'remove', account));
}

/**
 * Replaces the whole selection, for example with a saved calendar. If the account rejects any
 * race, the account is put back to what it held before (best effort: if that also fails, the
 * account can be left partly replaced until the next load), this device keeps its current
 * selection, and the first failure is thrown.
 */
export const replaceSelection = (eventIds: string[]) => serialized(async ({ userId, check }) => {
  if (userId) {
    // Snapshot the account itself, not this device: it can hold races this device does not.
    const accountBefore = await selectionService.getRemoteSelections();
    check();
    await selectionService.clearRemoteSelections(userId);
    const results = await Promise.allSettled(eventIds.map(id => remoteWrites.add(id, userId)));
    const failure = results.find(isRejected);
    if (failure) {
      try {
        check();
        await selectionService.clearRemoteSelections(userId);
        await Promise.allSettled(accountBefore.map(id => remoteWrites.add(id, userId)));
      } catch (rollbackError) {
        // The original failure is what the caller must see; the account can stay partly
        // replaced until the next load reads it again, so leave a trace of that.
        console.warn('[selection] Could not put the account back after a failed replace; the next load reads it again.', rollbackError);
      }
      throw failure.reason;
    }
    check(); // switched while replacing: the new account's device is not replaced
  }
  selectionService.saveLocalSelections(eventIds);
  selectedEventIds.set(new Set(eventIds));
});
