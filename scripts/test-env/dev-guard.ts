import { existsSync, readFileSync } from 'node:fs';
import { assertLocal } from './guard';

/**
 * Throws unless the stack env file exists and points at localhost.
 * `npm run dev` must never fall back to the production values in `.env`.
 */
export function assertLocalDevEnv(envFile: string): void {
  if (!existsSync(envFile)) {
    throw new Error(
      'Local stack env file not found. Run `npm run test-env:start` first (Docker must be running),\n' +
        'or use `npm run dev:remote` to run against the Supabase project in .env.',
    );
  }
  const line = readFileSync(envFile, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('VITE_SUPABASE_URL='));
  assertLocal(line?.slice('VITE_SUPABASE_URL='.length).trim());
}
