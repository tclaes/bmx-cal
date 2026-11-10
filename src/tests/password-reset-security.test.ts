// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Tests for the send-password-reset Edge Function.
 *
 * These run the real handler from supabase/functions/send-password-reset/index.ts:
 * Deno.serve and Deno.env are stubbed, Supabase's createClient and the Resend
 * fetch call are mocked, and every test sends a real Request through it.
 */

const { createClient, generateLink } = vi.hoisted(() => {
  const generateLink = vi.fn();
  const createClient = vi.fn(() => ({ auth: { admin: { generateLink } } }));
  return { createClient, generateLink };
});

vi.mock('@supabase/supabase-js', () => ({ createClient }));

type Handler = (req: Request) => Promise<Response>;

// Imported through a variable so the frontend type check doesn't follow it into Deno-only code
const FUNCTION_MODULE = '../../supabase/functions/send-password-reset/index.ts';

const FUNCTION_URL = 'https://project.supabase.co/functions/v1/send-password-reset';
const DEFAULT_ENV: Record<string, string> = {
  RESEND_API_KEY: 'resend-key',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  SITE_URL: 'https://bmxkalender.be',
};

let env: Record<string, string>;
let fetchMock: ReturnType<typeof vi.fn>;

async function loadHandler(): Promise<Handler> {
  let handler: Handler | undefined;
  vi.stubGlobal('Deno', {
    env: { get: (key: string) => env[key] },
    serve: (h: Handler) => {
      handler = h;
    },
  });
  // Fresh module per test so the in-memory rate limiter starts empty
  vi.resetModules();
  await import(/* @vite-ignore */ FUNCTION_MODULE);
  if (!handler) throw new Error('Deno.serve was not called');
  return handler;
}

function resetRequest(
  body: unknown,
  { ip = '203.0.113.1', headers = {} }: { ip?: string; headers?: Record<string, string> } = {}
): Request {
  return new Request(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip, ...headers },
    body: JSON.stringify(body),
  });
}

function sentEmail(): { to: string[]; html: string; text: string } {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('https://api.resend.com/emails');
  expect(init.headers.Authorization).toBe('Bearer resend-key');
  return JSON.parse(init.body);
}

function hrefFrom(html: string): string {
  const match = html.match(/href="([^"]*)"/);
  if (!match) throw new Error('No link in email HTML');
  return match[1];
}

beforeEach(() => {
  env = { ...DEFAULT_ENV };
  generateLink.mockReset();
  generateLink.mockResolvedValue({ data: { properties: { hashed_token: 'token-123' } }, error: null });
  createClient.mockClear();
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'email-1' }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('send-password-reset', () => {
  describe('request handling', () => {
    it('answers CORS preflight requests', async () => {
      const handler = await loadHandler();

      const res = await handler(new Request(FUNCTION_URL, { method: 'OPTIONS' }));

      expect(res.status).toBe(200);
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(generateLink).not.toHaveBeenCalled();
    });

    it('returns 503 when the email service is not configured', async () => {
      delete env.RESEND_API_KEY;
      const handler = await loadHandler();

      const res = await handler(resetRequest({ email: 'rider@example.com' }));

      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: 'Email service not configured' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([{}, { email: '' }, { email: '   ' }])('returns 400 when email is missing (%j)', async (body) => {
      const handler = await loadHandler();

      const res = await handler(resetRequest(body));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Email is required' });
      expect(generateLink).not.toHaveBeenCalled();
    });

    it('sends a reset email for a known user', async () => {
      const handler = await loadHandler();

      const res = await handler(resetRequest({ email: '  rider@example.com ' }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true });
      expect(createClient).toHaveBeenCalledWith('https://project.supabase.co', 'service-role-key');
      expect(generateLink).toHaveBeenCalledWith({ type: 'recovery', email: 'rider@example.com' });

      const email = sentEmail();
      expect(email.to).toEqual(['rider@example.com']);
      expect(email.text).toContain(
        'https://bmxkalender.be/reset-password?token_hash=token-123&type=recovery'
      );
      expect(hrefFrom(email.html)).toBe(
        'https://bmxkalender.be/reset-password?token_hash=token-123&amp;type=recovery'
      );
    });
  });

  describe('reset link origin (password-reset poisoning)', () => {
    it('ignores an attacker-supplied Origin header and appUrl', async () => {
      const handler = await loadHandler();

      await handler(
        resetRequest(
          { email: 'rider@example.com', appUrl: 'https://evil.example' },
          { headers: { Origin: 'https://evil.example' } }
        )
      );

      const email = sentEmail();
      expect(hrefFrom(email.html)).toMatch(/^https:\/\/bmxkalender\.be\/reset-password\?/);
      expect(email.html).not.toContain('evil.example');
      expect(email.text).not.toContain('evil.example');
    });

    it('uses only the origin of SITE_URL', async () => {
      env.SITE_URL = 'https://staging.bmxkalender.be/some/path?x=1';
      const handler = await loadHandler();

      await handler(resetRequest({ email: 'rider@example.com' }));

      expect(hrefFrom(sentEmail().html)).toMatch(/^https:\/\/staging\.bmxkalender\.be\/reset-password\?/);
    });

    it.each([
      ['unset', undefined],
      ['empty', '  '],
      ['not a URL', 'not a url'],
      ['javascript: scheme', 'javascript:alert(1)'],
      ['data: scheme', 'data:text/html,hi'],
    ])('falls back to https://bmxkalender.be when SITE_URL is %s', async (_label, siteUrl) => {
      if (siteUrl === undefined) delete env.SITE_URL;
      else env.SITE_URL = siteUrl;
      const handler = await loadHandler();

      await handler(resetRequest({ email: 'rider@example.com' }));

      expect(hrefFrom(sentEmail().html)).toMatch(/^https:\/\/bmxkalender\.be\/reset-password\?/);
    });
  });

  describe('email content escaping', () => {
    it('URL-encodes the token and HTML-escapes the link', async () => {
      generateLink.mockResolvedValue({
        data: { properties: { hashed_token: 'a"b<c>&d \'e' } },
        error: null,
      });
      const handler = await loadHandler();

      await handler(resetRequest({ email: 'rider@example.com' }));

      const { html, text } = sentEmail();
      const encoded = encodeURIComponent('a"b<c>&d \'e');
      expect(text).toContain(`token_hash=${encoded}&type=recovery`);
      expect(hrefFrom(html)).toBe(
        `https://bmxkalender.be/reset-password?token_hash=${encoded.replace(/'/g, '&#039;')}&amp;type=recovery`
      );
      expect(html).not.toContain('<c>');
    });
  });

  describe('Supabase and Resend failures', () => {
    it('returns success without sending an email for an unknown user', async () => {
      generateLink.mockResolvedValue({ data: null, error: { message: 'User not found' } });
      const handler = await loadHandler();

      const res = await handler(resetRequest({ email: 'nobody@example.com' }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns 500 when generating the link fails for another reason', async () => {
      generateLink.mockResolvedValue({ data: null, error: { message: 'Database unavailable' } });
      const handler = await loadHandler();

      const res = await handler(resetRequest({ email: 'rider@example.com' }));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Internal server error' });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns 500 when no token is generated', async () => {
      generateLink.mockResolvedValue({ data: { properties: {} }, error: null });
      const handler = await loadHandler();

      const res = await handler(resetRequest({ email: 'rider@example.com' }));

      expect(res.status).toBe(500);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns 500 without leaking details when Resend rejects the email', async () => {
      fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: 'invalid key' }), { status: 401 }));
      const handler = await loadHandler();

      const res = await handler(resetRequest({ email: 'rider@example.com' }));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Internal server error' });
    });
  });

  describe('rate limiting', () => {
    it('allows 5 requests per IP per hour, then returns 429', async () => {
      const handler = await loadHandler();

      for (let i = 0; i < 5; i++) {
        const res = await handler(resetRequest({ email: 'rider@example.com' }));
        expect(res.status).toBe(200);
      }
      const limited = await handler(resetRequest({ email: 'rider@example.com' }));

      expect(limited.status).toBe(429);
      expect(generateLink).toHaveBeenCalledTimes(5);
    });

    it('counts each client IP separately', async () => {
      const handler = await loadHandler();

      for (let i = 0; i < 5; i++) {
        await handler(resetRequest({ email: 'rider@example.com' }, { ip: '203.0.113.1' }));
      }
      const otherIp = await handler(resetRequest({ email: 'rider@example.com' }, { ip: '198.51.100.7' }));

      expect(otherIp.status).toBe(200);
    });

    it('allows requests again once the hour has passed', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      try {
        const handler = await loadHandler();
        for (let i = 0; i < 5; i++) {
          await handler(resetRequest({ email: 'rider@example.com' }));
        }
        expect((await handler(resetRequest({ email: 'rider@example.com' }))).status).toBe(429);

        vi.setSystemTime(Date.now() + 60 * 60 * 1000 + 1);

        expect((await handler(resetRequest({ email: 'rider@example.com' }))).status).toBe(200);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
