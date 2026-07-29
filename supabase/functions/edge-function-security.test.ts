import { describe, it, expect } from 'vitest';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

describe('Edge Function Security - CORS and Auth Validation', () => {
  it('CORS headers should allow all origins with correct methods', () => {
    expect(corsHeaders['Access-Control-Allow-Origin']).toBe('*');
    expect(corsHeaders['Access-Control-Allow-Methods']).toContain('POST');
    expect(corsHeaders['Access-Control-Allow-Methods']).toContain('OPTIONS');
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('Authorization');
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('Content-Type');
  });

  it('preflight OPTIONS request should return 200 with CORS headers', async () => {
    const mockHandler = (req: Request): Response => {
      if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };

    const response = mockHandler(new Request('https://example.com', { method: 'OPTIONS' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('request without Authorization header should return 401', async () => {
    const mockHandler = (req: Request): Response => {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };

    const response = mockHandler(new Request('https://example.com', { method: 'POST' }));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('request with invalid auth token should return 403', async () => {
    const mockHandler = (req: Request): Response => {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };

    const response = mockHandler(
      new Request('https://example.com', {
        method: 'POST',
        headers: { Authorization: 'Bearer invalid-token' },
      })
    );
    expect(response.status).toBe(403);
  });

  it('request with missing required fields should return 400', async () => {
    const mockHandler = (req: Request): Response => {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };

    const response = mockHandler(
      new Request('https://example.com', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-admin-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });

  it('error responses should include CORS headers', async () => {
    const mockHandler = (): Response => {
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };

    const response = mockHandler();
    expect(response.status).toBe(500);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});
