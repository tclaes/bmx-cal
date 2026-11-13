import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

const sel = vi.hoisted(() => ({
  getLocalSelections: vi.fn(() => [] as string[]),
  getRemoteSelections: vi.fn(async () => [] as string[]),
  addRemoteSelection: vi.fn(async () => {}),
  saveLocalSelections: vi.fn(),
}));

vi.mock('@core/services', async (orig) => {
  const actual = await orig<typeof import('@core/services')>();
  return { ...actual, selectionService: sel };
});

import { adoptLocalSelections, selectedEventIds } from '@core/stores';

beforeEach(() => {
  Object.values(sel).forEach(f => f.mockClear());
  sel.getLocalSelections.mockReturnValue([]);
  sel.getRemoteSelections.mockResolvedValue([]);
  selectedEventIds.set(new Set());
});

describe('adoptLocalSelections', () => {
  it('does nothing when nothing was selected while signed out', async () => {
    await adoptLocalSelections();
    expect(sel.getRemoteSelections).not.toHaveBeenCalled();
    expect(sel.addRemoteSelection).not.toHaveBeenCalled();
  });

  it('moves races selected while signed out into the new account', async () => {
    sel.getLocalSelections.mockReturnValue(['a', 'b']);
    sel.getRemoteSelections.mockResolvedValue([]);
    await adoptLocalSelections();
    expect(sel.addRemoteSelection).toHaveBeenCalledTimes(2);
    expect([...get(selectedEventIds)].sort()).toEqual(['a', 'b']);
  });

  it('merges with the existing account selection and only adds what is missing', async () => {
    sel.getLocalSelections.mockReturnValue(['a', 'b']);
    sel.getRemoteSelections.mockResolvedValue(['b', 'c']);
    await adoptLocalSelections();
    expect(sel.addRemoteSelection).toHaveBeenCalledTimes(1);
    expect(sel.addRemoteSelection).toHaveBeenCalledWith('a');
    expect([...get(selectedEventIds)].sort()).toEqual(['a', 'b', 'c']);
    expect(sel.saveLocalSelections).toHaveBeenCalledWith(expect.arrayContaining(['a', 'b', 'c']));
  });

  it('keeps the local selection when the account cannot be reached', async () => {
    sel.getLocalSelections.mockReturnValue(['a']);
    sel.getRemoteSelections.mockRejectedValue(new Error('offline'));
    await expect(adoptLocalSelections()).resolves.toBeUndefined();
    expect(sel.saveLocalSelections).not.toHaveBeenCalled();
  });
});
