import { describe, it, expect } from 'vitest';
import { buildCorsHeaders, corsHeaders, handlePreflight, jsonResponse } from '../../supabase/functions/_shared/cors';

const DEFAULT_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function headersOf(res: Response | null | undefined) {
  return {
    'Access-Control-Allow-Origin': res?.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': res?.headers.get('Access-Control-Allow-Methods'),
    'Access-Control-Allow-Headers': res?.headers.get('Access-Control-Allow-Headers'),
  };
}

describe('edge shared cors', () => {
  it('default headers match what every function sent before the refactor', () => {
    expect(corsHeaders).toEqual(DEFAULT_HEADERS);
  });

  it('a custom method list changes only the methods (search-uec-livestream also accepts GET)', () => {
    expect(buildCorsHeaders('GET, POST, OPTIONS')).toEqual({
      ...DEFAULT_HEADERS,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
  });

  it('answers an OPTIONS preflight with 200, the full CORS header set and no body', async () => {
    const res = handlePreflight(new Request('https://x.test/fn', { method: 'OPTIONS' }));
    expect(res?.status).toBe(200);
    expect(headersOf(res)).toEqual(DEFAULT_HEADERS);
    expect(await res?.text()).toBe('');
  });

  it('uses the headers it is given for the preflight', () => {
    const custom = buildCorsHeaders('GET, POST, OPTIONS');
    const res = handlePreflight(new Request('https://x.test/fn', { method: 'OPTIONS' }), custom);
    expect(headersOf(res)['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS');
  });

  it('leaves other methods alone', () => {
    expect(handlePreflight(new Request('https://x.test/fn', { method: 'POST' }))).toBeNull();
  });

  it('jsonResponse carries status, JSON content type, body and the full CORS header set', async () => {
    const res = jsonResponse({ error: 'Unauthorized' }, 401);
    expect(res.status).toBe(401);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(headersOf(res)).toEqual(DEFAULT_HEADERS);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('jsonResponse can use custom CORS headers and defaults to 200', () => {
    const res = jsonResponse({ ok: true }, undefined, buildCorsHeaders('GET, POST, OPTIONS'));
    expect(res.status).toBe(200);
    expect(headersOf(res)['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS');
  });
});
