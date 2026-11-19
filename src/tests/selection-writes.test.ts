import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

type Call = { op: 'upsert' | 'delete'; eventId?: string; userId?: string; options?: unknown };

const db = vi.hoisted(() => ({
  user: { id: 'u1' } as { id: string } | null,
  calls: [] as Call[],
  failFor: new Set<string>(),
  /** Races whose insert (but not delete) is rejected. */
  failInsertFor: new Set<string>(),
  /** When set, upserts wait for this promise before answering. */
  hold: null as Promise<void> | null,
  /** Per-race holds: an upsert for that race waits for its promise. */
  holdFor: new Map<string, Promise<void>>(),
  /** Like holdFor, but only the first upsert for the race waits. */
  holdOnceFor: new Map<string, Promise<void>>(),
  /** Races whose next insert (only) is rejected; decided when the insert starts. */
  failInsertOnce: new Set<string>(),
  remote: [] as string[],
  /** When set, reading the account's selection waits for this promise. */
  holdSelect: null as Promise<void> | null,
  /** Like holdSelect, but only the first read waits. */
  holdSelectOnce: null as Promise<void> | null,
  /** When set, deletes wait for this promise before answering. */
  holdDelete: null as Promise<void> | null,
  /** Number of account clears so far, and the one (1-based) that should fail. */
  clearCalls: 0,
  failClearCall: null as number | null,
  /** When set, looking up the signed-in user fails with this error. */
  userError: null as { message: string } | null,
}));

vi.mock('@data', () => ({
  supabase: {
    auth: { getUser: vi.fn(async () => ({ data: { user: db.userError ? null : db.user }, error: db.userError })) },
    from: vi.fn(() => ({
      select: async () => {
        const rows = db.remote.map(event_id => ({ event_id })); // what the account holds when asked
        const once = db.holdSelectOnce;
        db.holdSelectOnce = null;
        if (once) await once;
        if (db.holdSelect) await db.holdSelect;
        return { data: rows, error: null };
      },
      upsert: async (row: { event_id: string; user_id: string }, options: unknown) => {
        const denied = db.failInsertOnce.delete(row.event_id) || db.failFor.has(row.event_id) || db.failInsertFor.has(row.event_id);
        const once = db.holdOnceFor.get(row.event_id);
        db.holdOnceFor.delete(row.event_id);
        if (once) await once;
        if (db.hold) await db.hold;
        const held = db.holdFor.get(row.event_id);
        if (held) await held;
        db.calls.push({ op: 'upsert', eventId: row.event_id, userId: row.user_id, options });
        return { error: denied ? { message: `insert ${row.event_id} denied` } : null };
      },
      // delete().eq(...).eq(...) is awaited at the end of the chain.
      delete: () => {
        const filters: Record<string, string> = {};
        const query = {
          eq(column: string, value: string) { filters[column] = value; return query; },
          then(resolve: (r: unknown) => void) {
            void (async () => {
              if (db.holdDelete) await db.holdDelete;
              db.calls.push({ op: 'delete', eventId: filters.event_id, userId: filters.user_id });
              const isClear = !!filters.user_id && !filters.event_id;
              if (isClear) db.clearCalls += 1;
              if (isClear && db.failClearCall === db.clearCalls) return resolve({ error: { message: 'clear denied' } });
              const denied = filters.event_id && db.failFor.has(filters.event_id);
              resolve({ error: denied ? { message: `delete ${filters.event_id} denied` } : null });
            })();
          },
        };
        return query;
      },
    })),
  },
}));

import { selectEventsByType, deselectEventsByType, toggleEventSelection, clearAllSelections, adoptLocalSelections, replaceSelection, loadUserSelections, selectedEventIds, authStore } from '@core/stores';
import { AccountChangedError, WRITE_QUEUE_TIMEOUT_MS } from '../libs/core/stores/selection.store';
import { selectionService } from '@core/services';

function setSelection(ids: string[]) {
  selectionService.saveLocalSelections(ids);
  selectedEventIds.set(new Set(ids));
}
/** Signs in (or out, with null) the same account for the app and for Supabase. */
function signIn(id: string | null) {
  db.user = id ? { id } : null;
  authStore.setUser(id ? ({ id } as any) : null);
}
const storeIds = () => [...get(selectedEventIds)].sort();
const localIds = () => selectionService.getLocalSelections().slice().sort();

beforeEach(() => {
  db.calls = [];
  db.failFor = new Set();
  db.failInsertFor = new Set();
  db.hold = null;
  db.holdFor = new Map();
  db.holdOnceFor = new Map();
  db.failInsertOnce = new Set();
  db.remote = [];
  db.holdSelect = null;
  db.holdSelectOnce = null;
  db.holdDelete = null;
  db.clearCalls = 0;
  db.failClearCall = null;
  db.userError = null;
  signIn('u1');
  localStorage.clear();
  setSelection([]);
});

describe('selection writes', () => {
  it('re-adding a race that is already saved is not an error', async () => {
    setSelection(['a']);
    await selectEventsByType(['a', 'b']);
    expect(storeIds()).toEqual(['a', 'b']);
    expect(db.calls.filter(c => c.op === 'upsert').map(c => c.options))
      .toEqual([{ onConflict: 'user_id,event_id', ignoreDuplicates: true }, { onConflict: 'user_id,event_id', ignoreDuplicates: true }]);
  });

  it('a rejected add throws and puts only that race back as it was, on this device too', async () => {
    db.failFor.add('b');
    await expect(selectEventsByType(['a', 'b'])).rejects.toMatchObject({ message: 'insert b denied' });
    expect(storeIds()).toEqual(['a']);
    expect(localIds()).toEqual(['a']);
  });

  it('a rejected remove throws and keeps that race selected', async () => {
    setSelection(['a', 'b']);
    db.failFor.add('a');
    await expect(deselectEventsByType(['a', 'b'])).rejects.toMatchObject({ message: 'delete a denied' });
    expect(storeIds()).toEqual(['a']);
    expect(localIds()).toEqual(['a']);
  });

  it('a rejected toggle throws and leaves this device unchanged', async () => {
    db.failFor.add('a');
    await expect(toggleEventSelection('a')).rejects.toMatchObject({ message: 'insert a denied' });
    expect(storeIds()).toEqual([]);
    expect(localIds()).toEqual([]);
  });

  it('a clear started while an add is still writing runs after it, so the clear wins', async () => {
    let release!: () => void;
    db.hold = new Promise<void>(r => { release = r; });
    const adding = selectEventsByType(['a']);
    const clearing = clearAllSelections();
    await new Promise(r => setTimeout(r, 0));
    expect(db.calls).toEqual([]); // the clear waits for the add
    release();
    await adding;
    await clearing;
    expect(db.calls.map(c => c.op)).toEqual(['upsert', 'delete']);
    expect(storeIds()).toEqual([]);
    expect(localIds()).toEqual([]);
  });

  it('merging signed-out picks waits for every insert, also after one fails, before a queued clear runs', async () => {
    setSelection(['a', 'b']);
    db.failFor.add('a');
    let releaseB!: () => void;
    db.holdFor.set('b', new Promise<void>(r => { releaseB = r; }));

    const adopting = adoptLocalSelections();
    const clearing = clearAllSelections();
    await new Promise(r => setTimeout(r, 0));
    // 'a' was rejected, but 'b' is still being written: the clear must not have started.
    expect(db.calls.map(c => c.op)).toEqual(['upsert']);

    releaseB();
    await adopting;
    await clearing;
    expect(db.calls.map(c => `${c.op}:${c.eventId ?? 'all'}`)).toEqual(['upsert:a', 'upsert:b', 'delete:all']);
    expect(storeIds()).toEqual([]);
  });

  it('replaceSelection swaps the whole selection on this device and in the account', async () => {
    setSelection(['a']);
    await replaceSelection(['x', 'y']);
    expect(storeIds()).toEqual(['x', 'y']);
    expect(localIds()).toEqual(['x', 'y']);
    expect(db.calls.map(c => `${c.op}:${c.eventId ?? 'all'}`)).toEqual(['delete:all', 'upsert:x', 'upsert:y']);
  });

  it('replaceSelection is all-or-nothing: a rejected race puts the account back and keeps this device', async () => {
    setSelection(['a']);
    db.remote = ['a', 'only-in-account'];
    db.failFor.add('y');
    await expect(replaceSelection(['x', 'y'])).rejects.toMatchObject({ message: 'insert y denied' });
    expect(storeIds()).toEqual(['a']);
    expect(localIds()).toEqual(['a']);
    // The account gets back what it held, including races this device did not have.
    expect(db.calls.map(c => `${c.op}:${c.eventId ?? 'all'}`))
      .toEqual(['delete:all', 'upsert:x', 'upsert:y', 'delete:all', 'upsert:a', 'upsert:only-in-account']);
  });

  it('every account write carries the user it was started for', async () => {
    await selectEventsByType(['a']);
    await deselectEventsByType(['a']);
    await clearAllSelections();
    expect(db.calls.map(c => `${c.op}:${c.userId}`)).toEqual(['upsert:u1', 'delete:u1', 'delete:u1']);
  });

  it('signed out, writes stay on this device', async () => {
    signIn(null);
    await selectEventsByType(['a']);
    expect(storeIds()).toEqual(['a']);
    expect(db.calls).toEqual([]);
  });

  it('a write queued for one account does not run after another account signs in, and changes nothing', async () => {
    signIn('A');
    setSelection(['a']);
    let release!: () => void;
    db.hold = new Promise<void>(r => { release = r; });
    const first = selectEventsByType(['b']);
    const second = toggleEventSelection('c');
    await new Promise(r => setTimeout(r, 0)); // the first write has started for A
    signIn('B');
    release();
    // The running write finished its account write for A, but A is no longer signed in.
    await expect(first).rejects.toBeInstanceOf(AccountChangedError);
    await expect(second).rejects.toBeInstanceOf(AccountChangedError);
    expect(db.calls.map(c => `${c.op}:${c.eventId}:${c.userId}`)).toEqual(['upsert:b:A']);
    expect(storeIds()).toEqual(['a', 'b']);
    expect(localIds()).toEqual(['a', 'b']);
  });

  it('a write that is already running stops before its next account write when the account changes', async () => {
    signIn('A');
    setSelection(['a']);
    let releaseRead!: () => void;
    db.holdSelect = new Promise<void>(r => { releaseRead = r; });
    const replacing = replaceSelection(['x']);
    await new Promise(r => setTimeout(r, 0)); // reading A's selection
    signIn('B');
    releaseRead();
    await expect(replacing).rejects.toBeInstanceOf(AccountChangedError);
    expect(db.calls).toEqual([]); // B's rows were never touched
    expect(storeIds()).toEqual(['a']);
  });

  it('a toggle whose account changes while it writes does not change the new account\'s device', async () => {
    signIn('A');
    let release!: () => void;
    db.hold = new Promise<void>(r => { release = r; });
    const toggling = toggleEventSelection('a');
    await new Promise(r => setTimeout(r, 0)); // writing for A
    signIn('B');
    release();
    await expect(toggling).rejects.toBeInstanceOf(AccountChangedError);
    expect(storeIds()).toEqual([]);
  });

  it('a clear whose account changes while it writes does not clear the new account\'s device', async () => {
    signIn('A');
    setSelection(['a']);
    let release!: () => void;
    db.holdDelete = new Promise<void>(r => { release = r; });
    const clearing = clearAllSelections();
    await new Promise(r => setTimeout(r, 0)); // clearing A's account
    signIn('B');
    release();
    await expect(clearing).rejects.toBeInstanceOf(AccountChangedError);
    expect(storeIds()).toEqual(['a']);
    expect(localIds()).toEqual(['a']);
  });

  it('logs why the sign-in merge did not happen, keeps the local selection and still resolves', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      setSelection(['a']);
      db.failFor.add('a');
      await expect(adoptLocalSelections()).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('[selection] Could not merge the signed-out selection'),
        expect.objectContaining({ message: 'insert a denied' }),
      );
      expect(localIds()).toEqual(['a']);
    } finally {
      warn.mockRestore();
    }
  });

  it('logs a failed rollback after a failed replace and still throws the original failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      setSelection(['a']);
      db.remote = ['a'];
      db.failFor.add('y');
      db.failClearCall = 2; // the first clear empties the account, the second one is the rollback
      await expect(replaceSelection(['x', 'y'])).rejects.toMatchObject({ message: 'insert y denied' });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('[selection] Could not put the account back'),
        expect.objectContaining({ message: 'clear denied' }),
      );
      expect(storeIds()).toEqual(['a']);
    } finally {
      warn.mockRestore();
    }
  });

  it('a signed-in write fails visibly when the account cannot be looked up, and changes nothing', async () => {
    setSelection(['a']);
    db.userError = { message: 'network down' };
    await expect(selectEventsByType(['b'])).rejects.toMatchObject({ message: 'network down' });
    await expect(clearAllSelections()).rejects.toMatchObject({ message: 'network down' });
    expect(storeIds()).toEqual(['a']);
    expect(localIds()).toEqual(['a']);
    expect(db.calls).toEqual([]);
  });

  it('a late failed select does not undo a newer remove and add of the same race (A, B, A)', async () => {
    vi.useFakeTimers();
    try {
      let releaseFirst!: () => void;
      db.holdOnceFor.set('a', new Promise<void>(r => { releaseFirst = r; }));
      db.failInsertOnce.add('a');
      const first = selectEventsByType(['a']); // stalls past the queue timeout, then fails
      first.catch(() => {});
      await vi.advanceTimersByTimeAsync(WRITE_QUEUE_TIMEOUT_MS);
      await deselectEventsByType(['a']);
      await selectEventsByType(['a']);
      expect(storeIds()).toEqual(['a']);
      releaseFirst();
      await expect(first).rejects.toMatchObject({ message: 'insert a denied' });
      expect(storeIds()).toEqual(['a']); // the value matched the failed write's, but a newer write owns it
      expect(localIds()).toEqual(['a']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a late failed toggle does not undo a newer toggle of the same race (A, B, A)', async () => {
    vi.useFakeTimers();
    try {
      let releaseFirst!: () => void;
      db.holdOnceFor.set('a', new Promise<void>(r => { releaseFirst = r; }));
      db.failInsertOnce.add('a');
      const first = toggleEventSelection('a'); // on, stalls past the timeout, then fails
      first.catch(() => {});
      await vi.advanceTimersByTimeAsync(WRITE_QUEUE_TIMEOUT_MS);
      await toggleEventSelection('a'); // off
      await toggleEventSelection('a'); // on again
      expect(localIds()).toEqual(['a']);
      releaseFirst();
      await expect(first).rejects.toMatchObject({ message: 'insert a denied' });
      expect(localIds()).toEqual(['a']);
      expect(storeIds()).toEqual(['a']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a write started while the app is signed out never reaches an account the session already names', async () => {
    authStore.setUser(null); // the app has not published the sign-in yet...
    db.user = { id: 'u1' }; // ...but Supabase already has a session
    setSelection(['a']);
    await selectEventsByType(['b']);
    await clearAllSelections();
    await replaceSelection(['x']);
    expect(db.calls).toEqual([]); // nothing was sent to u1's account
    expect(storeIds()).toEqual(['x']);
    expect(localIds()).toEqual(['x']);
  });

  it('reports a failed restoration insert during a rollback and still throws the original failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      setSelection(['a']);
      db.remote = ['a'];
      db.failFor.add('y'); // the replacement fails...
      db.failInsertFor.add('a'); // ...and so does restoring what the account held
      await expect(replaceSelection(['x', 'y'])).rejects.toMatchObject({ message: 'insert y denied' });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('[selection] Could not put the account back'),
        expect.objectContaining({ message: 'insert a denied' }),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('a load that finishes after the account changed is dropped, and the new account is loaded instead', async () => {
    signIn('A');
    db.remote = ['from-A'];
    let release!: () => void;
    db.holdSelectOnce = new Promise<void>(r => { release = r; });
    const loadingA = loadUserSelections(); // slow: still reading A's selection
    await new Promise(r => setTimeout(r, 0));
    signIn('B');
    db.remote = ['from-B'];
    release();
    await loadingA;
    expect(storeIds()).toEqual(['from-B']); // A's selection was never applied
    expect(localIds()).toEqual(['from-B']);
  });

  it('a load follows the app account: a session without an app account keeps the device selection', async () => {
    authStore.setUser(null); // the app has not published the sign-in yet...
    db.user = { id: 'u1' }; // ...but Supabase already has a session
    db.remote = ['from-account'];
    setSelection(['mine']);
    await loadUserSelections();
    expect(storeIds()).toEqual(['mine']); // not replaced by the account's selection
    expect(localIds()).toEqual(['mine']);
  });

  it('a load follows the app account: a session for another user keeps the device selection', async () => {
    authStore.setUser({ id: 'A' } as any);
    db.user = { id: 'B' };
    db.remote = ['from-B'];
    setSelection(['mine']);
    await loadUserSelections();
    expect(storeIds()).toEqual(['mine']);
    expect(localIds()).toEqual(['mine']);
  });

  it('a load that finishes after a newer load started is dropped', async () => {
    signIn('A');
    db.remote = ['old'];
    let release!: () => void;
    db.holdSelectOnce = new Promise<void>(r => { release = r; });
    const older = loadUserSelections(); // reads ['old'], then waits
    await new Promise(r => setTimeout(r, 0));
    db.remote = ['new'];
    await loadUserSelections(); // newer load: reads ['new'] straight away
    expect(storeIds()).toEqual(['new']);
    release();
    await older;
    expect(storeIds()).toEqual(['new']); // the older load did not overwrite it
  });

  it('a signed-in write fails when the account lookup returns no user (no error), and changes nothing', async () => {
    setSelection(['a']);
    db.user = null; // the app still has u1 signed in, but Supabase has no session (expired)
    await expect(toggleEventSelection('b')).rejects.toBeInstanceOf(AccountChangedError);
    await expect(selectEventsByType(['b'])).rejects.toBeInstanceOf(AccountChangedError);
    await expect(clearAllSelections()).rejects.toBeInstanceOf(AccountChangedError);
    await expect(replaceSelection(['x'])).rejects.toBeInstanceOf(AccountChangedError);
    expect(storeIds()).toEqual(['a']);
    expect(localIds()).toEqual(['a']);
    expect(db.calls).toEqual([]);
  });

  it('a toggle that fails after the queue timeout does not undo a newer toggle of the same race', async () => {
    vi.useFakeTimers();
    try {
      let failFirst!: () => void;
      db.holdFor.set('a', new Promise<void>(r => { failFirst = r; }));
      db.failInsertFor.add('a');
      const first = toggleEventSelection('a'); // adds 'a' on this device, account write hangs
      await vi.advanceTimersByTimeAsync(WRITE_QUEUE_TIMEOUT_MS);
      const second = toggleEventSelection('a'); // runs after the timeout: removes 'a'
      await second;
      expect(localIds()).toEqual([]);
      failFirst();
      await expect(first).rejects.toMatchObject({ message: 'insert a denied' });
      expect(localIds()).toEqual([]); // the late rollback did not re-add 'a'
    } finally {
      vi.useRealTimers();
    }
  });

  it('a stuck write stops holding up later writes after the queue timeout', async () => {
    vi.useFakeTimers();
    try {
      db.holdFor.set('stuck', new Promise<void>(() => {}));
      void selectEventsByType(['stuck']);
      const later = selectEventsByType(['b']);
      await vi.advanceTimersByTimeAsync(WRITE_QUEUE_TIMEOUT_MS - 1);
      expect(db.calls.map(c => c.eventId)).not.toContain('b');
      await vi.advanceTimersByTimeAsync(1);
      await later;
      expect(db.calls.map(c => c.eventId)).toContain('b');
    } finally {
      vi.useRealTimers();
    }
  });

  it('the timeout counts from when a write starts running, not from when it was queued', async () => {
    vi.useFakeTimers();
    try {
      db.holdFor.set('one', new Promise<void>(() => {}));
      db.holdFor.set('two', new Promise<void>(() => {}));
      void selectEventsByType(['one']);
      void selectEventsByType(['two']); // queued at t=0, starts at t=15s
      const third = selectEventsByType(['three']);
      await vi.advanceTimersByTimeAsync(WRITE_QUEUE_TIMEOUT_MS + 10_000); // t=25s: 'two' has run 10s
      expect(db.calls.map(c => c.eventId)).not.toContain('three');
      await vi.advanceTimersByTimeAsync(5_000); // t=30s: 'two' has run 15s
      await third;
      expect(db.calls.map(c => c.eventId)).toContain('three');
    } finally {
      vi.useRealTimers();
    }
  });

  it('a failed write does not block later writes', async () => {
    db.failFor.add('a');
    await expect(selectEventsByType(['a'])).rejects.toBeTruthy();
    await selectEventsByType(['b']);
    expect(storeIds()).toEqual(['b']);
  });
});
