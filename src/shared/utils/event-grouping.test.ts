import { describe, it, expect } from 'vitest';
import { groupEventsByYear, getDefaultOpenYears } from './event-grouping';
import type { EventWithType } from '../../types';

function makeEvent(id: string, date: string): EventWithType {
  return { id, date, title: `Event ${id}` } as EventWithType;
}

describe('groupEventsByYear', () => {
  it('returns an empty map for no events', () => {
    expect(groupEventsByYear([])).toEqual(new Map());
  });

  it('groups events into the correct year bucket', () => {
    const e1 = makeEvent('1', '2026-03-01');
    const e2 = makeEvent('2', '2026-07-15');
    const result = groupEventsByYear([e1, e2]);
    expect(result.size).toBe(1);
    expect(result.get(2026)).toEqual([e1, e2]);
  });

  it('separates events from different years into different buckets', () => {
    const e2025 = makeEvent('1', '2025-12-31');
    const e2026 = makeEvent('2', '2026-01-01');
    const result = groupEventsByYear([e2025, e2026]);
    expect(result.size).toBe(2);
    expect(result.get(2025)).toEqual([e2025]);
    expect(result.get(2026)).toEqual([e2026]);
  });

  it('sorts years in ascending order', () => {
    const e2027 = makeEvent('3', '2027-06-01');
    const e2025 = makeEvent('1', '2025-06-01');
    const e2026 = makeEvent('2', '2026-06-01');
    const result = groupEventsByYear([e2027, e2025, e2026]);
    expect([...result.keys()]).toEqual([2025, 2026, 2027]);
  });

  it('preserves event order within a year bucket', () => {
    const e1 = makeEvent('1', '2026-01-10');
    const e2 = makeEvent('2', '2026-06-15');
    const e3 = makeEvent('3', '2026-11-20');
    const result = groupEventsByYear([e1, e2, e3]);
    expect(result.get(2026)).toEqual([e1, e2, e3]);
  });
});

describe('getDefaultOpenYears', () => {
  it('returns empty set when map is empty', () => {
    expect(getDefaultOpenYears(new Map(), 2026)).toEqual(new Set());
  });

  it('opens the current year when it exists in the map', () => {
    const e = makeEvent('1', '2026-03-01');
    const map = groupEventsByYear([e]);
    expect(getDefaultOpenYears(map, 2026)).toEqual(new Set([2026]));
  });

  it('returns empty set when current year is not in the map', () => {
    const e = makeEvent('1', '2025-03-01');
    const map = groupEventsByYear([e]);
    expect(getDefaultOpenYears(map, 2026)).toEqual(new Set());
  });

  it('only opens the current year, not other years', () => {
    const e2025 = makeEvent('1', '2025-03-01');
    const e2026 = makeEvent('2', '2026-03-01');
    const e2027 = makeEvent('3', '2027-03-01');
    const map = groupEventsByYear([e2025, e2026, e2027]);
    const open = getDefaultOpenYears(map, 2026);
    expect(open.has(2026)).toBe(true);
    expect(open.has(2025)).toBe(false);
    expect(open.has(2027)).toBe(false);
    expect(open.size).toBe(1);
  });
});
