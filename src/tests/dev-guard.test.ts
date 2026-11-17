import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertLocalDevEnv } from '../../scripts/test-env/dev-guard';

function envFile(content: string): string {
  const file = join(mkdtempSync(join(tmpdir(), 'dev-guard-')), '.env.e2e.local');
  writeFileSync(file, content);
  return file;
}

describe('assertLocalDevEnv', () => {
  it('points at test-env:start when the env file is missing', () => {
    expect(() => assertLocalDevEnv('/nonexistent/.env.e2e.local')).toThrow(/test-env:start/);
  });

  it('rejects a non-local Supabase URL and names the host', () => {
    const file = envFile('VITE_SUPABASE_URL=https://abc.supabase.co\nVITE_SUPABASE_ANON_KEY=x\n');
    expect(() => assertLocalDevEnv(file)).toThrow(/abc\.supabase\.co/);
  });

  it('rejects a file without a Supabase URL', () => {
    expect(() => assertLocalDevEnv(envFile('VITE_SUPABASE_ANON_KEY=x\n'))).toThrow(/not set/);
  });

  it('accepts a localhost URL', () => {
    const file = envFile('VITE_SUPABASE_URL=http://127.0.0.1:54321\nVITE_SUPABASE_ANON_KEY=x\n');
    expect(() => assertLocalDevEnv(file)).not.toThrow();
  });
});
