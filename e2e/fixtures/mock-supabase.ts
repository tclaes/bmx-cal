import type { Page, Request, Route } from '@playwright/test';
import { SUPABASE_URL } from './env';

type Role = 'user' | 'admin';

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  /** Teams the user manages (drives the team-manager guard). */
  managedTeams?: { id: string; name: string }[];
}

/** A user who can sign in with email + password through the mocked auth endpoints. */
export interface Account extends SessionUser {
  password: string;
}

export interface MockData {
  /** PostgREST tables keyed by name (RPCs as `rpc:<fn>`). Unlisted ones return []. */
  tables?: Record<string, unknown[]>;
  /** Already signed in when the page loads. */
  user?: SessionUser | null;
  /** Accounts that can sign in. Sign-ups are added to this list. */
  accounts?: Account[];
  /** The only `token_hash` accepted when verifying a password-recovery link. */
  recoveryToken?: string;
}

export interface ApiCall {
  method: string;
  /** Path below the Supabase origin, e.g. `/auth/v1/signup`. */
  path: string;
  body: unknown;
}

export interface SupabaseMock {
  /** Every request that hit a Supabase endpoint nobody handled. */
  unmocked: string[];
  /** Mutating PostgREST calls, for payload assertions. */
  writes: { method: string; table: string; body: unknown }[];
  /** Auth and edge-function calls, for payload assertions. */
  calls: ApiCall[];
}

// supabase-js stores the session under sb-<first hostname label>-auth-token.
export const AUTH_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;

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

function toSession(u: SessionUser) {
  return {
    access_token: 'e2e-access-token',
    refresh_token: 'e2e-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: toAuthUser(u),
  };
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(body),
  });

const authError = (route: Route, status: number, code: string, msg: string) =>
  json(route, { code: status, error_code: code, msg, error_description: msg }, status);

function readBody(req: Request): unknown {
  try {
    return req.postDataJSON();
  } catch {
    return null;
  }
}

export async function mockSupabase(page: Page, data: MockData = {}): Promise<SupabaseMock> {
  const mock: SupabaseMock = { unmocked: [], writes: [], calls: [] };
  const accounts = [...(data.accounts ?? [])];
  const recoveryToken = data.recoveryToken ?? 'valid-token';
  let current: SessionUser | null = data.user ?? null;

  // Consent, locale and session are seeded once per tab: init scripts re-run on every
  // navigation, which would otherwise resurrect a session the app just signed out of.
  await page.addInitScript(
    ({ key, session }) => {
      if (sessionStorage.getItem('e2e-seeded')) return;
      sessionStorage.setItem('e2e-seeded', 'true');
      localStorage.setItem(
        'bmx-cookie-consent',
        JSON.stringify({ analytics: 'denied', ads: 'denied', decidedAt: '2025-01-01T00:00:00Z' }),
      );
      localStorage.setItem('pwa-install-dismissed', 'true');
      if (!localStorage.getItem('bmx-locale')) localStorage.setItem('bmx-locale', 'en');
      if (session) localStorage.setItem(key, JSON.stringify(session));
    },
    { key: AUTH_STORAGE_KEY, session: current && toSession(current) },
  );

  // Third-party scripts are never needed.
  await page.route(/googletagmanager|google-analytics|googlesyndication|doubleclick/, (r) => r.abort());

  await page.route(`${SUPABASE_URL}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const path = url.pathname;

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

    if (path.startsWith('/auth/v1/') || path.startsWith('/functions/v1/')) {
      const body = readBody(req);
      if (!(method === 'GET' && path === '/auth/v1/user')) mock.calls.push({ method, path, body });
      const creds = (body ?? {}) as { email?: string; password?: string; token_hash?: string };

      switch (`${method} ${path}`) {
        case 'GET /auth/v1/user':
          return current ? json(route, toAuthUser(current)) : authError(route, 401, 'bad_jwt', 'invalid JWT');

        case 'POST /auth/v1/token': {
          if (url.searchParams.get('grant_type') === 'refresh_token') {
            return current ? json(route, toSession(current)) : authError(route, 400, 'bad_jwt', 'Invalid refresh token');
          }
          const account = accounts.find((a) => a.email === creds.email && a.password === creds.password);
          if (!account) return authError(route, 400, 'invalid_credentials', 'Invalid login credentials');
          current = account;
          return json(route, toSession(account));
        }

        case 'POST /auth/v1/signup': {
          if (accounts.some((a) => a.email === creds.email)) {
            return authError(route, 422, 'user_already_exists', 'User already registered');
          }
          const account: Account = {
            id: `signup-${accounts.length + 1}`,
            email: creds.email ?? '',
            password: creds.password ?? '',
            role: 'user',
          };
          accounts.push(account);
          return json(route, toAuthUser(account));
        }

        case 'POST /auth/v1/logout':
          current = null;
          return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });

        case 'POST /auth/v1/verify': {
          if (creds.token_hash !== recoveryToken) {
            return authError(route, 403, 'otp_expired', 'Email link is invalid or has expired');
          }
          current = accounts[0] ?? { id: 'recovery-user', email: 'recovery@example.test', role: 'user' };
          return json(route, toSession(current));
        }

        case 'PUT /auth/v1/user':
          return current ? json(route, toAuthUser(current)) : authError(route, 401, 'bad_jwt', 'invalid JWT');

        case 'POST /functions/v1/send-password-reset':
          return json(route, { success: true });
      }
    }

    const rpc = path.match(/^\/rest\/v1\/rpc\/([^/]+)$/);
    if (rpc) return json(route, data.tables?.[`rpc:${rpc[1]}`] ?? []);

    const rest = path.match(/^\/rest\/v1\/([^/]+)$/);
    if (rest) {
      const table = rest[1];
      if (method !== 'GET' && method !== 'HEAD') {
        const body = readBody(req);
        mock.writes.push({ method, table, body });
        // `.insert(...).select().single()` expects the created row back.
        const wantsObject = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
        if (method === 'POST' && wantsObject) {
          return json(route, { id: `new-${table}-${mock.writes.length}`, created_at: '2025-01-01T00:00:00Z', ...(body as object) }, 201);
        }
        return json(route, [], method === 'POST' ? 201 : 200);
      }
      let rows = data.tables?.[table] ?? [];
      if (table === 'team_managers' && current) {
        rows = (current.managedTeams ?? []).map((team) => ({ team }));
      }
      const wantsObject = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
      return json(route, wantsObject ? (rows[0] ?? null) : rows);
    }

    mock.unmocked.push(`${method} ${path}${url.search}`);
    return json(route, { message: 'unmocked in e2e' }, 500);
  });

  return mock;
}
