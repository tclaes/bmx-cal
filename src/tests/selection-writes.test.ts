import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

type Call = { op: 'upsert' | 'delete'; eventId?: string; options?: unknown };

const db = vi.hoisted(() => ({
  user: { id: 'u1' } as { id: string } | null,
  calls: [] as Call[],
  failFor: new Set<string>(),
  /** When set, upserts wait for this promise before answering. */
  hold: null as Promise<void> | null,
}));

vi.mock('@data', () => ({
  supabase: {
    auth: { getUser: vi.fn(async () => ({ data: { user: db.user } })) },
    from: vi.fn(() => ({
      upsert: async (row: { event_id: string }, options: unknown) => {
        if (db.hold) await db.hold;
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

import { selectEventsByType, deselectEventsByType, toggleEventSelection, clearAllSelections, selectedEventIds } from '@core/stores';
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

  it('a failed write does not block later writes', async () => {
    db.failFor.add('a');
    await expect(selectEventsByType(['a'])).rejects.toBeTruthy();
    await selectEventsByType(['b']);
    expect(storeIds()).toEqual(['b']);
  });
});
