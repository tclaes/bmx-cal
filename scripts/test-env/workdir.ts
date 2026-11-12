import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '../..');
export const WORKDIR = resolve(ROOT, '.test-env');

// Runs right before the first migration that references hand-created production rows.
const REFERENCE_DATA_VERSION = '20260314125000';
const PROJECT_ID = 'bmx-cal-test-env';

/**
 * Builds a throwaway Supabase project dir (.test-env/supabase) from the repo's
 * migrations plus the reference-data snapshot, leaving supabase/migrations untouched.
 */
export function prepareWorkdir(): string {
  const src = resolve(ROOT, 'supabase');
  const dest = resolve(WORKDIR, 'supabase');

  rmSync(WORKDIR, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });

  cpSync(resolve(src, 'migrations'), resolve(dest, 'migrations'), { recursive: true });
  cpSync(
    resolve(src, 'test-env/reference-data.sql'),
    resolve(dest, `migrations/${REFERENCE_DATA_VERSION}_test_env_reference_data.sql`),
  );

  const config = readFileSync(resolve(src, 'config.toml'), 'utf8');
  const withId = /^project_id\s*=/m.test(config) ? config : `project_id = "${PROJECT_ID}"\n\n${config}`;
  writeFileSync(resolve(dest, 'config.toml'), withId);

  const seed = resolve(src, 'test-env/seed.sql');
  if (existsSync(seed)) cpSync(seed, resolve(dest, 'seed.sql'));

  return WORKDIR;
}
