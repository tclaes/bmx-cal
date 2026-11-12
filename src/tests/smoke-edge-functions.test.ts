import { describe, it, expect } from 'vitest';
import { buildCases, runSmoke, FUNCTIONS } from '../../scripts/smoke-edge-functions.mjs';

const fakeFetch =
  (respond: (url: string, init: RequestInit) => { status: number; cors?: boolean }) =>
  async (url: string | URL | Request, init?: RequestInit) => {
    const { status, cors } = respond(String(url), init ?? {});
    return new Response('', { status, headers: cors ? { 'Access-Control-Allow-Origin': '*' } : {} });
  };

describe('edge function smoke script', () => {
  it('covers all 11 functions with a preflight each', () => {
    expect(FUNCTIONS).toHaveLength(11);
    expect(buildCases().filter(c => c.method === 'OPTIONS')).toHaveLength(11);
  });

  it('never sends credentials', () => {
    // runSmoke builds only a Content-Type header; assert it through the fake fetch.
    const seen: RequestInit[] = [];
    return runSmoke('http://x/functions/v1', fakeFetch((_u, init) => {
      seen.push(init);
      return { status: 200, cors: true };
    }) as typeof fetch).then(() => {
      for (const init of seen) {
        expect(Object.keys(init.headers as Record<string, string>)).toEqual(['Content-Type']);
      }
    });
  });

  it('passes when functions behave', async () => {
    const results = await runSmoke('http://x/functions/v1/', fakeFetch((url, init) => {
      if (init.method === 'OPTIONS') return { status: 200, cors: true };
      const isPublic = url.endsWith('send-contact-email') || url.endsWith('send-password-reset');
      return isPublic ? { status: 400, cors: true } : { status: 401 };
    }) as typeof fetch);
    expect(results.every(r => r.ok)).toBe(true);
  });

  it('fails on a missing CORS header, a wrong status and a network error', async () => {
    const wrongCors = await runSmoke('http://x', fakeFetch(() => ({ status: 200, cors: false })) as typeof fetch, [
      { label: 'a', fn: 'f', method: 'OPTIONS', expectStatus: 200, expectCors: true },
    ]);
    expect(wrongCors[0].ok).toBe(false);

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
});
