import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@config', () => ({ APP_VERSION: '1.3.0', MIN_VERSION: '1.0.0', RELEASE_NOTES: {} }));

const fetchManifest = vi.fn();
const fetchOverride = vi.fn();
vi.mock('@core/services', () => ({
  ReleaseService: {
    fetchManifest: (...args: unknown[]) => fetchManifest(...args),
    fetchOverride: (...args: unknown[]) => fetchOverride(...args),
  },
}));

import {
  updateStore,
  startUpdateChecks,
  DISMISSED_VERSION_KEY,
  CHECK_INTERVAL_MS,
  VISIBILITY_THROTTLE_MS,
} from '@core/stores/pwa.store';

const manifest = (version: string, minVersion = '1.0.0') => ({ version, minVersion, notes: {} });

beforeEach(() => {
  localStorage.clear();
  updateStore.reset();
  fetchManifest.mockReset();
  fetchOverride.mockReset().mockResolvedValue(null);
});

describe('updateStore.check', () => {
  it('feature release → optional', async () => {
    fetchManifest.mockResolvedValue(manifest('1.4.0'));
    expect(await updateStore.check()).toBe('optional');
    expect(get(updateStore)).toMatchObject({ state: 'optional', deployedVersion: '1.4.0', checking: false });
  });

  it('crucial fix → mandatory', async () => {
    fetchManifest.mockResolvedValue(manifest('1.3.1', '1.3.1'));
    expect(await updateStore.check()).toBe('mandatory');
    expect(get(updateStore).message).toBeNull();
  });

  it('up to date → none', async () => {
    fetchManifest.mockResolvedValue(manifest('1.3.0'));
    expect(await updateStore.check()).toBe('none');
  });

  it('offline → none, reported as error', async () => {
    fetchManifest.mockResolvedValue(null);
    expect(await updateStore.check()).toBe('error');
    expect(get(updateStore).state).toBe('none');
  });

  it('keeps an open mandatory update when a later check fails', async () => {
    fetchManifest.mockResolvedValue(manifest('1.3.1', '1.3.1'));
    await updateStore.check();
    fetchManifest.mockResolvedValue(null);

    expect(await updateStore.check()).toBe('error');
    expect(get(updateStore).state).toBe('mandatory');
  });

  it('SPA fallback HTML (rejected by the service as null or a string) → none', async () => {
    fetchManifest.mockResolvedValue('<!doctype html><html></html>');
    expect(await updateStore.check()).toBe('error');
    expect(get(updateStore).state).toBe('none');
  });

  it('override raises the minimum and carries its message', async () => {
    fetchManifest.mockResolvedValue(manifest('1.4.0', '1.2.0'));
    fetchOverride.mockResolvedValue({ minVersion: '1.4.0', message: { nl: 'Belangrijke fix', fr: '', x: 1 } });
    expect(await updateStore.check()).toBe('mandatory');
    expect(get(updateStore).message).toEqual({ nl: 'Belangrijke fix' });
  });

  it('override failure falls back to the published minimum', async () => {
    fetchManifest.mockResolvedValue(manifest('1.4.0', '1.0.0'));
    fetchOverride.mockResolvedValue(null);
    expect(await updateStore.check()).toBe('optional');
  });

  it('shares one request between concurrent checks', async () => {
    fetchManifest.mockResolvedValue(manifest('1.4.0'));
    await Promise.all([updateStore.check(), updateStore.check()]);
    expect(fetchManifest).toHaveBeenCalledTimes(1);
  });
});

describe('updateStore.dismiss', () => {
  it('remembers the dismissed version across checks', async () => {
    fetchManifest.mockResolvedValue(manifest('1.4.0'));
    await updateStore.check();
    updateStore.dismiss();
    expect(get(updateStore).state).toBe('none');
    expect(localStorage.getItem(DISMISSED_VERSION_KEY)).toBe('1.4.0');

    await updateStore.check();
    expect(get(updateStore).state).toBe('none');
  });

  it('still reports an available update to a manual check after dismissing', async () => {
    fetchManifest.mockResolvedValue(manifest('1.4.0'));
    await updateStore.check();
    updateStore.dismiss();

    expect(await updateStore.check()).toBe('optional');
    expect(get(updateStore).state).toBe('none');
  });

  it('shows the banner again for a newer release', async () => {
    localStorage.setItem(DISMISSED_VERSION_KEY, '1.4.0');
    fetchManifest.mockResolvedValue(manifest('1.5.0'));
    expect(await updateStore.check()).toBe('optional');
  });

  it('keeps the dismissal for the session when localStorage is unavailable', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    fetchManifest.mockResolvedValue(manifest('1.4.0'));

    await updateStore.check();
    updateStore.dismiss();
    await updateStore.check();
    expect(get(updateStore).state).toBe('none');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('update_dismissed_version'), expect.any(Error));

    getItem.mockRestore();
    setItem.mockRestore();
    warn.mockRestore();
  });

  it('cannot dismiss a mandatory update', async () => {
    fetchManifest.mockResolvedValue(manifest('1.3.1', '1.3.1'));
    await updateStore.check();
    updateStore.dismiss();
    expect(get(updateStore).state).toBe('mandatory');
  });
});

describe('updateStore.applyUpdate', () => {
  const originalLocation = window.location;
  const reload = vi.fn();

  beforeEach(() => {
    reload.mockReset();
    Object.defineProperty(window, 'location', { configurable: true, value: { ...originalLocation, reload } });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    Reflect.deleteProperty(navigator, 'serviceWorker');
  });

  it('asks the service worker to update, then reloads', async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistration: vi.fn().mockResolvedValue({ update }) },
    });
    await updateStore.applyUpdate();
    expect(update).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });

  it('still reloads and logs when the service worker update fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistration: vi.fn().mockResolvedValue({ update: vi.fn().mockRejectedValue(new Error('network')) }) },
    });
    await updateStore.applyUpdate();
    expect(reload).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('update failed'), expect.any(Error));
    warn.mockRestore();
  });

  it('still reloads when the service worker update hangs', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistration: vi.fn().mockResolvedValue({ update: () => new Promise(() => {}) }) },
    });
    const done = updateStore.applyUpdate();
    await vi.advanceTimersByTimeAsync(3000);
    await done;
    expect(reload).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('took longer'));
    warn.mockRestore();
    vi.useRealTimers();
  });
});

describe('startUpdateChecks', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('checks on start, on return to the foreground (throttled) and every 30 minutes', async () => {
    vi.useFakeTimers();
    fetchManifest.mockResolvedValue(manifest('1.3.0'));
    const stop = startUpdateChecks();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchManifest).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchManifest).toHaveBeenCalledTimes(1); // throttled

    await vi.advanceTimersByTimeAsync(VISIBILITY_THROTTLE_MS);
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchManifest).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(CHECK_INTERVAL_MS);
    expect(fetchManifest).toHaveBeenCalledTimes(3);

    stop();
    await vi.advanceTimersByTimeAsync(CHECK_INTERVAL_MS);
    expect(fetchManifest).toHaveBeenCalledTimes(3);
  });
});
