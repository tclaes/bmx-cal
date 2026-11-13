import type { Page, Route } from '@playwright/test';
import { SUPABASE_URL } from './env';

type Role = 'user' | 'admin';

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  /** Teams the user manages (drives the team-manager guard). */
  managedTeams?: { id: string; name: string }[];
}

export interface MockData {
  /** PostgREST tables keyed by name (RPCs as `rpc:<fn>`). Unlisted ones return []. */
  tables?: Record<string, unknown[]>;
  user?: SessionUser | null;
}

export interface SupabaseMock {
  /** Every request that hit a Supabase endpoint nobody handled. */
  unmocked: string[];
  /** Mutating PostgREST calls, for payload assertions. */
  writes: { method: string; table: string; body: unknown }[];
}

// supabase-js stores the session under sb-<first hostname label>-auth-token.
const AUTH_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;

function toAuthUser(u: SessionUser) {
  return {
    id: u.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: u.email,
    app_metadata: { role: u.role },
    user_metadata: {},
    created_at: '2025-01-01T00:00:00Z',
  };
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(body),
  });

export async function mockSupabase(page: Page, data: MockData = {}): Promise<SupabaseMock> {
  const mock: SupabaseMock = { unmocked: [], writes: [] };
  const user = data.user ?? null;

  // Consent + locale pre-seeded so banners never cover the page under test.
  await page.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(
        'bmx-cookie-consent',
        JSON.stringify({ analytics: 'denied', ads: 'denied', decidedAt: '2025-01-01T00:00:00Z' }),
      );
      localStorage.setItem('pwa-install-dismissed', 'true');
      if (!localStorage.getItem('bmx-locale')) localStorage.setItem('bmx-locale', 'en');
      if (session) localStorage.setItem(key, JSON.stringify(session));
    },
    {
      key: AUTH_STORAGE_KEY,
      session: user && {
        access_token: 'e2e-access-token',
        refresh_token: 'e2e-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: toAuthUser(user),
      },
    },
  );

  // Third-party scripts are never needed.
  await page.route(/googletagmanager|google-analytics|googlesyndication|doubleclick/, (r) => r.abort());

  await page.route(`${SUPABASE_URL}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();

    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': '*',
        },
      });
    }

    if (url.pathname === '/auth/v1/user') {
      return user
        ? json(route, toAuthUser(user))
        : json(route, { msg: 'invalid JWT', code: 401 }, 401);
    }

    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/([^/]+)$/);
    if (rpc) return json(route, data.tables?.[`rpc:${rpc[1]}`] ?? []);

    const rest = url.pathname.match(/^\/rest\/v1\/([^/]+)$/);
    if (rest) {
      const table = rest[1];
      if (method !== 'GET' && method !== 'HEAD') {
        mock.writes.push({ method, table, body: req.postDataJSON() });
        return json(route, [], method === 'POST' ? 201 : 200);
      }
      let rows = data.tables?.[table] ?? [];
      if (table === 'team_managers' && user) {
        rows = (user.managedTeams ?? []).map((team) => ({ team }));
      }
      const wantsObject = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
      return json(route, wantsObject ? (rows[0] ?? null) : rows);
    }

    mock.unmocked.push(`${method} ${url.pathname}${url.search}`);
    return json(route, { message: 'unmocked in e2e' }, 500);
  });

  return mock;
}
