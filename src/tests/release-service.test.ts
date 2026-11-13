import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const maybeSingle = vi.fn();
vi.mock('@data', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => maybeSingle() }) }) }),
  },
}));

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
    expect(init).toEqual({ cache: 'no-store' });
  });

  it('returns null for the SPA fallback (HTML with status 200)', async () => {
    fetchMock.mockResolvedValue(response('<!doctype html>', 'text/html; charset=UTF-8'));
    expect(await ReleaseService.fetchManifest()).toBeNull();
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
  });
  afterEach(() => {
    vi.useRealTimers();
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

  it('gives up after 3 seconds', async () => {
    vi.useFakeTimers();
    maybeSingle.mockReturnValue(new Promise(() => {}));
    const result = ReleaseService.fetchOverride();
    await vi.advanceTimersByTimeAsync(3000);
    expect(await result).toBeNull();
  });
});
