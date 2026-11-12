import { describe, it, expect } from 'vitest';
import { buildCorsHeaders, corsHeaders, handlePreflight, jsonResponse } from '../../supabase/functions/_shared/cors';

describe('edge shared cors', () => {
  it('default headers match what every function sent before the refactor', () => {
    expect(corsHeaders).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
    });
  });

  it('allows a custom method list (search-uec-livestream also accepts GET)', () => {
    expect(buildCorsHeaders('GET, POST, OPTIONS')['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS');
  });

  it('answers an OPTIONS preflight with 200, the CORS headers and no body', async () => {
    const res = handlePreflight(new Request('https://x.test/fn', { method: 'OPTIONS' }));
    expect(res?.status).toBe(200);
    expect(res?.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(await res?.text()).toBe('');
  });

  it('leaves other methods alone', () => {
    expect(handlePreflight(new Request('https://x.test/fn', { method: 'POST' }))).toBeNull();
  });

  it('jsonResponse carries status, JSON content type and the CORS headers', async () => {
    const res = jsonResponse({ error: 'Unauthorized' }, 401);
    expect(res.status).toBe(401);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('jsonResponse defaults to 200', () => {
    expect(jsonResponse({ ok: true }).status).toBe(200);
  });
});
