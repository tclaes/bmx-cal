import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertLocal } from './guard';
import { getStackEnv } from './stack';
import { ROOT } from './workdir';
import { TEST_PASSWORD, TEST_USERS } from './users';

export const AUTH_DIR = resolve(ROOT, 'e2e/.auth');
export const APP_ORIGIN = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

/**
 * Signs each test role in with the normal password flow and writes a Playwright
 * storageState per role, so a browser can open the app already logged in.
 */
export async function writeSessions(): Promise<void> {
  const env = getStackEnv();
  assertLocal(env.apiUrl);
  // supabase-js stores the session under `sb-<first hostname label>-auth-token`.
  const storageKey = `sb-${new URL(env.apiUrl).hostname.split('.')[0]}-auth-token`;
  mkdirSync(AUTH_DIR, { recursive: true });

  for (const u of TEST_USERS) {
    const client = createClient(env.apiUrl, env.anonKey, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({ email: u.email, password: TEST_PASSWORD });
    if (error || !data.session) throw error ?? new Error(`Login failed for ${u.email}`);

    const value = JSON.stringify(data.session);
    const state = {
      cookies: [],
      origins: [{ origin: APP_ORIGIN, localStorage: [{ name: storageKey, value }, { name: 'bmx-locale', value: 'en' }] }],
    };
    const file = resolve(AUTH_DIR, `${u.role}.json`);
    writeFileSync(file, JSON.stringify(state, null, 2));
    console.log(`${u.role}: ${file}`);
    if (u.role === process.argv[2]) {
      console.log(`\nlocalStorage snippet for ${u.role} (run on ${APP_ORIGIN}, then reload):\nlocalStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(value)})`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeSessions().catch((e) => { console.error(e.message ?? e); process.exit(1); });
}
