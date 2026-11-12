import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import FeatureFlagsPanel from '../features/admin/FeatureFlagsPanel.svelte';

const svc = vi.hoisted(() => ({ getAll: vi.fn(), setFlag: vi.fn() }));

vi.mock('@core/services', async (orig) => {
  const actual = await orig<typeof import('@core/services')>();
  return { ...actual, FeatureFlagService: svc };
});

import { featureFlagsStore, featureEnabled, isFeatureEnabled } from '@core/stores';

const row = (key: string, enabled: boolean) => ({ key, enabled, updated_at: '2026-11-13T00:00:00Z', updated_by: null });

beforeEach(() => {
  svc.getAll.mockReset();
  svc.setFlag.mockReset();
});

describe('feature flags store', () => {
  it('is off before the flags have loaded', () => {
    expect(isFeatureEnabled('notifications')).toBe(false);
  });

  it('is on only for an existing, enabled flag', async () => {
    svc.getAll.mockResolvedValue([row('notifications', true), row('other', false)]);
    await featureFlagsStore.load();
    expect(get(featureEnabled('notifications'))).toBe(true);
    expect(get(featureEnabled('other'))).toBe(false);
    expect(get(featureEnabled('missing'))).toBe(false);
  });

  it('fails closed when reading the flags fails', async () => {
    svc.getAll.mockResolvedValue([row('notifications', true)]);
    await featureFlagsStore.load();
    svc.getAll.mockRejectedValue(new Error('network'));
    await featureFlagsStore.load();
    expect(isFeatureEnabled('notifications')).toBe(false);
    expect(get(featureFlagsStore).loaded).toBe(true);
  });

  it('shows the stored row after an admin change', async () => {
    svc.getAll.mockResolvedValue([row('notifications', false)]);
    await featureFlagsStore.load();
    svc.setFlag.mockResolvedValue({ ...row('notifications', true), updated_by: 'admin-1' });
    await featureFlagsStore.setEnabled('notifications', true);
    expect(svc.setFlag).toHaveBeenCalledWith('notifications', true);
    expect(isFeatureEnabled('notifications')).toBe(true);
    expect(get(featureFlagsStore).flags.notifications.updated_by).toBe('admin-1');
  });

  it('keeps the old value when the change is rejected', async () => {
    svc.getAll.mockResolvedValue([row('notifications', false)]);
    await featureFlagsStore.load();
    svc.setFlag.mockRejectedValue(new Error('rls'));
    await expect(featureFlagsStore.setEnabled('notifications', true)).rejects.toThrow('rls');
    expect(isFeatureEnabled('notifications')).toBe(false);
  });
});

describe('FeatureFlagsPanel', () => {
  it('lists flags and toggles one through the store', async () => {
    svc.getAll.mockResolvedValue([row('notifications', false)]);
    await featureFlagsStore.load();
    svc.setFlag.mockResolvedValue(row('notifications', true));
    render(FeatureFlagsPanel);
    const sw = screen.getByRole('switch', { name: 'notifications' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await fireEvent.click(sw);
    await waitFor(() => expect(sw).toHaveAttribute('aria-checked', 'true'));
    expect(svc.setFlag).toHaveBeenCalledWith('notifications', true);
  });

  it('shows an error when the change is rejected and keeps the state', async () => {
    svc.getAll.mockResolvedValue([row('notifications', false)]);
    await featureFlagsStore.load();
    svc.setFlag.mockRejectedValue(new Error('new row violates row-level security policy'));
    render(FeatureFlagsPanel);
    const sw = screen.getByRole('switch', { name: 'notifications' });
    await fireEvent.click(sw);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });
});
