import { describe, it, expect, vi, beforeEach } from 'vitest';

const q = vi.hoisted(() => {
  const chain: any = {};
  chain.select = vi.fn(() => chain);
  chain.order = vi.fn(async () => chain.result);
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(async () => chain.result);
  chain.result = { data: null, error: null };
  return { chain, from: vi.fn(() => chain) };
});

vi.mock('@data', () => ({ supabase: { from: q.from } }));

import { FeatureFlagService } from '../libs/core/services/feature-flag.service';

beforeEach(() => {
  vi.clearAllMocks();
  q.chain.result = { data: null, error: null };
});

describe('FeatureFlagService', () => {
  it('reads all flags ordered by key', async () => {
    q.chain.result = { data: [{ key: 'notifications', enabled: false }], error: null };
    const flags = await FeatureFlagService.getAll();
    expect(q.from).toHaveBeenCalledWith('feature_flags');
    expect(q.chain.order).toHaveBeenCalledWith('key');
    expect(flags).toEqual([{ key: 'notifications', enabled: false }]);
  });

  it('throws when reading fails', async () => {
    q.chain.result = { data: null, error: new Error('no table') };
    await expect(FeatureFlagService.getAll()).rejects.toThrow('no table');
  });

  it('updates only the named flag and returns the stored row', async () => {
    const row = { key: 'notifications', enabled: true, updated_at: 'x', updated_by: 'u' };
    q.chain.result = { data: row, error: null };
    await expect(FeatureFlagService.setFlag('notifications', true)).resolves.toEqual(row);
    expect(q.chain.update).toHaveBeenCalledWith({ enabled: true });
    expect(q.chain.eq).toHaveBeenCalledWith('key', 'notifications');
  });

  it('throws when the update matches no row, as happens for a non-admin under RLS', async () => {
    q.chain.result = { data: null, error: { code: 'PGRST116', message: 'The result contains 0 rows' } };
    await expect(FeatureFlagService.setFlag('notifications', true)).rejects.toMatchObject({ code: 'PGRST116' });
  });
});
