import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

type Call = { op: 'upsert' | 'delete'; eventId?: string; options?: unknown };

const db = vi.hoisted(() => ({
  user: { id: 'u1' } as { id: string } | null,
  calls: [] as Call[],
  failFor: new Set<string>(),
  /** When set, upserts wait for this promise before answering. */
  hold: null as Promise<void> | null,
  /** Per-race holds: an upsert for that race waits for its promise. */
  holdFor: new Map<string, Promise<void>>(),
  remote: [] as string[],
}));

vi.mock('@data', () => ({
  supabase: {
    auth: { getUser: vi.fn(async () => ({ data: { user: db.user } })) },
    from: vi.fn(() => ({
      select: async () => ({ data: db.remote.map(event_id => ({ event_id })), error: null }),
      upsert: async (row: { event_id: string }, options: unknown) => {
        if (db.hold) await db.hold;
        const held = db.holdFor.get(row.event_id);
        if (held) await held;
        db.calls.push({ op: 'upsert', eventId: row.event_id, options });
        return { error: db.failFor.has(row.event_id) ? { message: `insert ${row.event_id} denied` } : null };
      },
      delete: () => ({
        eq: async (column: string, value: string) => {
          db.calls.push({ op: 'delete', eventId: column === 'event_id' ? value : undefined });
          return { error: column === 'event_id' && db.failFor.has(value) ? { message: `delete ${value} denied` } : null };
        },
      }),
    })),
  },
}));

import { selectEventsByType, deselectEventsByType, toggleEventSelection, clearAllSelections, adoptLocalSelections, replaceSelection, selectedEventIds, authStore } from '@core/stores';
import { AccountChangedError, WRITE_QUEUE_TIMEOUT_MS } from '../libs/core/stores/selection.store';
import { selectionService } from '@core/services';

function setSelection(ids: string[]) {
  selectionService.saveLocalSelections(ids);
  selectedEventIds.set(new Set(ids));
}
const storeIds = () => [...get(selectedEventIds)].sort();
const localIds = () => selectionService.getLocalSelections().slice().sort();

beforeEach(() => {
  db.user = { id: 'u1' };
  db.calls = [];
  db.failFor = new Set();
  db.hold = null;
  db.holdFor = new Map();
  db.remote = [];
  authStore.setUser(null);
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
    db.failFor.add('y');
    await expect(replaceSelection(['x', 'y'])).rejects.toMatchObject({ message: 'insert y denied' });
    expect(storeIds()).toEqual(['a']);
    expect(localIds()).toEqual(['a']);
    expect(db.calls.map(c => `${c.op}:${c.eventId ?? 'all'}`))
      .toEqual(['delete:all', 'upsert:x', 'upsert:y', 'delete:all', 'upsert:a']);
  });

  it('a write queued for one account does not run after another account signs in', async () => {
    authStore.setUser({ id: 'A' } as any);
    let release!: () => void;
    db.hold = new Promise<void>(r => { release = r; });
    const first = selectEventsByType(['a']);
    const second = toggleEventSelection('b');
    await new Promise(r => setTimeout(r, 0)); // the first write has started for A
    authStore.setUser({ id: 'B' } as any);
    release();
    await first;
    await expect(second).rejects.toBeInstanceOf(AccountChangedError);
    expect(db.calls.map(c => c.eventId)).toEqual(['a']);
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

  it('a failed write does not block later writes', async () => {
    db.failFor.add('a');
    await expect(selectEventsByType(['a'])).rejects.toBeTruthy();
    await selectEventsByType(['b']);
    expect(storeIds()).toEqual(['b']);
  });
});
