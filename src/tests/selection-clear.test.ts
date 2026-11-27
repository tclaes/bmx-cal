import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

const auth = vi.hoisted(() => ({ user: null as { id: string } | null }));
const db = vi.hoisted(() => ({ deleteError: null as { message: string } | null }));

vi.mock('@data', () => ({
  supabase: {
    auth: { getUser: vi.fn(async () => ({ data: { user: auth.user } })) },
    from: vi.fn(() => ({
      delete: () => ({ eq: async () => ({ error: db.deleteError }) }),
    })),
  },
}));

import { clearAllSelections, selectedEventIds, authStore } from '@core/stores';
import { selectionService } from '@core/services';

/** Signs in the same account for the app and for Supabase (a write follows the app's account). */
function signIn(id: string | null) {
  auth.user = id ? { id } : null;
  authStore.setUser(id ? ({ id } as any) : null);
}

beforeEach(() => {
  signIn(null);
  db.deleteError = null;
  localStorage.clear();
  selectionService.saveLocalSelections(['1', '2']);
  selectedEventIds.set(new Set(['1', '2']));
});

describe('clearAllSelections', () => {
  it('signed out: clears this device', async () => {
    await clearAllSelections();
    expect(get(selectedEventIds).size).toBe(0);
    expect(selectionService.getLocalSelections()).toEqual([]);
  });

  it('signed in: clears the account, then this device', async () => {
    signIn('u1');
    await clearAllSelections();
    expect(get(selectedEventIds).size).toBe(0);
    expect(selectionService.getLocalSelections()).toEqual([]);
  });

  it('signed in: a failed account clear throws and leaves the selection untouched everywhere', async () => {
    signIn('u1');
    db.deleteError = { message: 'permission denied' };
    await expect(clearAllSelections()).rejects.toMatchObject({ message: 'permission denied' });
    expect([...get(selectedEventIds)].sort()).toEqual(['1', '2']);
    expect(selectionService.getLocalSelections().sort()).toEqual(['1', '2']);
  });
});
