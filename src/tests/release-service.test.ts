import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const maybeSingle = vi.fn();
const query = {
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  abortSignal: vi.fn(),
};
vi.mock('@data', () => {
  const chain = {
    select: (...args: unknown[]) => { query.select(...args); return chain; },
    eq: (...args: unknown[]) => { query.eq(...args); return chain; },
    abortSignal: (signal: AbortSignal) => { query.abortSignal(signal); return chain; },
    maybeSingle: () => maybeSingle(query.abortSignal.mock.lastCall?.[0]),
  };
  return { supabase: { from: (table: string) => { query.from(table); return chain; } } };
});

import { ReleaseService } from '@core/services/release.service';

const response = (body: string, contentType: string, ok = true) =>
  ({ ok, headers: new Headers({ 'content-type': contentType }), json: async () => JSON.parse(body) }) as Response;

describe('ReleaseService.fetchManifest', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches /version.json uncached with a cache-busting query', async () => {
    fetchMock.mockResolvedValue(response('{"version":"1.0.0","minVersion":"1.0.0"}', 'application/json'));
    expect(await ReleaseService.fetchManifest()).toEqual({ version: '1.0.0', minVersion: '1.0.0' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/^\/version\.json\?ts=\d+$/);
    expect(init).toMatchObject({ cache: 'no-store', priority: 'low' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('gives up when the request hangs, so later checks are not blocked', async () => {
    vi.useFakeTimers();
    // AbortSignal.timeout runs on Node's internal timers; route it through the fake clock.
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms: number) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new DOMException('timed out', 'TimeoutError')), ms);
      return controller.signal;
    });
    fetchMock.mockImplementation((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
    }));
    const result = ReleaseService.fetchManifest();
    await vi.advanceTimersByTimeAsync(5000);
    expect(await result).toBeNull();
    expect(timeoutSpy).toHaveBeenCalledWith(5000);
    timeoutSpy.mockRestore();
    vi.useRealTimers();
  });

  it('returns null for the SPA fallback (HTML with status 200)', async () => {
    fetchMock.mockResolvedValue(response('<!doctype html>', 'text/html; charset=UTF-8'));
    expect(await ReleaseService.fetchManifest()).toBeNull();
  });

  it('accepts valid JSON regardless of the content-type header', async () => {
    fetchMock.mockResolvedValue(response('{"version":"1.0.0","minVersion":"1.0.0"}', 'text/plain'));
    expect(await ReleaseService.fetchManifest()).toEqual({ version: '1.0.0', minVersion: '1.0.0' });
  });

  it('returns null on HTTP errors, network errors and invalid JSON', async () => {
    fetchMock.mockResolvedValueOnce(response('{}', 'application/json', false));
    expect(await ReleaseService.fetchManifest()).toBeNull();
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    expect(await ReleaseService.fetchManifest()).toBeNull();
    fetchMock.mockResolvedValueOnce(response('not json', 'application/json'));
    expect(await ReleaseService.fetchManifest()).toBeNull();
  });
});

describe('ReleaseService.fetchOverride', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    Object.values(query).forEach((fn) => fn.mockClear());
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('queries the single policy row', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await ReleaseService.fetchOverride();
    expect(query.from).toHaveBeenCalledWith('app_release_policy');
    expect(query.select).toHaveBeenCalledWith('min_version, message');
    expect(query.eq).toHaveBeenCalledWith('id', 1);
    expect(query.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it('maps the policy row', async () => {
    maybeSingle.mockResolvedValue({ data: { min_version: '1.4.0', message: { nl: 'x' } }, error: null });
    expect(await ReleaseService.fetchOverride()).toEqual({ minVersion: '1.4.0', message: { nl: 'x' } });
  });

  it('returns null on errors or a missing row', async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'relation does not exist' } });
    expect(await ReleaseService.fetchOverride()).toBeNull();
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect(await ReleaseService.fetchOverride()).toBeNull();
  });

  it('aborts the request after 3 seconds', async () => {
    vi.useFakeTimers();
    // AbortSignal.timeout runs on Node's internal timers; route it through the fake clock.
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms: number) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new DOMException('timed out', 'TimeoutError')), ms);
      return controller.signal;
    });
    // Like supabase-js, resolve with an error once the signal aborts.
    maybeSingle.mockImplementation((signal: AbortSignal) => new Promise((resolve) => {
      signal.addEventListener('abort', () => resolve({ data: null, error: { message: 'AbortError' } }));
    }));
    const result = ReleaseService.fetchOverride();
    await vi.advanceTimersByTimeAsync(3000);
    expect(await result).toBeNull();
    expect(timeoutSpy).toHaveBeenCalledWith(3000);
  });
});
