import { describe, it, expect } from 'vitest';
import { buildCases, checkPreflight, runSmoke, FUNCTIONS } from '../../scripts/smoke-edge-functions.mjs';

const DOCUMENTED_FUNCTIONS = [
  'analyze-image',
  'analyze-pdf',
  'create-github-issue',
  'delete-account',
  'get-github-issue-statuses',
  'reopen-github-issue',
  'search-uec-livestream',
  'send-contact-email',
  'send-password-reset',
  'send-push-notifications',
  'sync-jstiming',
];

const PREFLIGHT_OK = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

type Reply = { status: number; headers?: Record<string, string> };

const fakeFetch =
  (respond: (url: string, init: RequestInit) => Reply) =>
  async (url: string | URL | Request, init?: RequestInit) => {
    const { status, headers } = respond(String(url), init ?? {});
    return new Response('', { status, headers });
  };

const wellBehaved = (url: string, init: RequestInit): Reply => {
  if (init.method === 'OPTIONS') return { status: 200, headers: PREFLIGHT_OK };
  return url.endsWith('send-contact-email')
    ? { status: 400, headers: PREFLIGHT_OK }
    : { status: 401 };
};

describe('edge function smoke script', () => {
  it('covers exactly the documented functions, each with a preflight', () => {
    expect(FUNCTIONS.map(f => f.name).sort()).toEqual(DOCUMENTED_FUNCTIONS);
    const preflighted = buildCases().filter(c => c.method === 'OPTIONS').map(c => c.fn).sort();
    expect(preflighted).toEqual(DOCUMENTED_FUNCTIONS);
  });

  it('only probes POST on send-contact-email among the public functions (the reset function rate-limits before validating)', () => {
    const publicPosts = buildCases().filter(c => c.method === 'POST' && c.expectStatus === 400);
    expect(publicPosts.map(c => c.fn)).toEqual(['send-contact-email']);
  });

  it('never sends credentials, and never hangs', async () => {
    const seen: RequestInit[] = [];
    await runSmoke('http://x/functions/v1', fakeFetch((url, init) => {
      seen.push(init);
      return wellBehaved(url, init);
    }) as typeof fetch);
    expect(seen.length).toBeGreaterThan(0);
    for (const init of seen) {
      expect(init.credentials).toBe('omit');
      expect(init.signal).toBeInstanceOf(AbortSignal);
      const names = Object.keys(init.headers as Record<string, string>).map(h => h.toLowerCase());
      expect(names).not.toContain('authorization');
      expect(names).not.toContain('apikey');
      expect(names).not.toContain('cookie');
    }
  });

  it('sends a browser-style preflight', async () => {
    const preflights: RequestInit[] = [];
    await runSmoke('http://x', fakeFetch((url, init) => {
      if (init.method === 'OPTIONS') preflights.push(init);
      return wellBehaved(url, init);
    }) as typeof fetch);
    const h = preflights[0].headers as Record<string, string>;
    expect(h['Access-Control-Request-Method']).toBe('POST');
    expect(h['Access-Control-Request-Headers']).toBe('content-type, authorization');
    expect(h.Origin).toBeTruthy();
  });

  it('passes when functions behave', async () => {
    const results = await runSmoke('http://x/functions/v1/', fakeFetch(wellBehaved) as typeof fetch);
    expect(results.every(r => r.ok)).toBe(true);
  });

  it('fails a preflight that lacks the method or header grants a browser needs', async () => {
    expect(checkPreflight(new Headers(PREFLIGHT_OK))).toBe('');
    expect(checkPreflight(new Headers({ ...PREFLIGHT_OK, 'Access-Control-Allow-Headers': 'Content-Type' })))
      .toContain('authorization header');
    expect(checkPreflight(new Headers({ ...PREFLIGHT_OK, 'Access-Control-Allow-Methods': 'GET, OPTIONS' })))
      .toContain('POST method');
    expect(checkPreflight(new Headers({ 'Access-Control-Allow-Methods': 'POST' }))).toContain('origin');

    const incomplete = await runSmoke('http://x', fakeFetch(() => ({
      status: 200,
      headers: { ...PREFLIGHT_OK, 'Access-Control-Allow-Headers': 'Content-Type' },
    })) as typeof fetch, buildCases().filter(c => c.preflight).slice(0, 1));
    expect(incomplete[0].ok).toBe(false);
    expect(incomplete[0].detail).toContain('preflight does not allow');
  });

  it('fails on a wrong status and on a network error', async () => {
    const wrongStatus = await runSmoke('http://x', fakeFetch(() => ({ status: 200 })) as typeof fetch, [
      { label: 'b', fn: 'f', method: 'POST', body: '{}', expectStatus: 401, expectCors: false },
    ]);
    expect(wrongStatus[0].ok).toBe(false);

    const failing = await runSmoke('http://x', (async () => { throw new Error('down'); }) as typeof fetch, [
      { label: 'c', fn: 'f', method: 'OPTIONS', expectStatus: 200, expectCors: true },
    ]);
    expect(failing[0].ok).toBe(false);
    expect(failing[0].detail).toContain('down');
  });

  it('reports a request that exceeds the timeout as a failure', async () => {
    const hanging = (async (_u: unknown, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      })) as typeof fetch;
    const results = await runSmoke('http://x', hanging, [
      { label: 'slow', fn: 'f', method: 'POST', expectStatus: 401, expectCors: false },
    ], 20);
    expect(results[0].ok).toBe(false);
    expect(results[0].detail).toContain('request failed');
  });
});
