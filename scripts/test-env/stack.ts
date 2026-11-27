import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, WORKDIR } from './workdir';

export const ENV_FILE = resolve(ROOT, '.env.e2e.local');
// Services the app does not need; keeps startup fast (also in CI).
const EXCLUDED = 'studio,imgproxy,logflare,vector,edge-runtime';

export interface StackEnv {
  apiUrl: string;
  anonKey: string;
  serviceRoleKey: string;
}

export function supabase(args: string[], opts: { quiet?: boolean } = {}): string {
  const res = spawnSync('npx', ['supabase', ...args, '--workdir', WORKDIR], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: opts.quiet ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'inherit'],
  });
  if (res.status !== 0) {
    throw new Error(`supabase ${args.join(' ')} failed${opts.quiet ? `: ${res.stderr}` : ''}`);
  }
  return res.stdout ?? '';
}

export function assertDocker(): void {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore' });
  } catch {
    throw new Error('Docker is required for the local test environment but is not running. Start Docker and retry.');
  }
}

export function startStack(): void {
  supabase(['start', '-x', EXCLUDED]);
}

export function isRunning(): boolean {
  try {
    supabase(['status', '-o', 'env'], { quiet: true });
    return true;
  } catch {
    return false;
  }
}

export function getStackEnv(): StackEnv {
  const out = supabase(['status', '-o', 'env'], { quiet: true });
  const vars = Object.fromEntries(
    out.split('\n').map((l) => l.match(/^([A-Z0-9_]+)="?(.*?)"?$/)).filter(Boolean).map((m) => [m![1], m![2]]),
  );
  const { API_URL, ANON_KEY, SERVICE_ROLE_KEY } = vars;
  if (!API_URL || !ANON_KEY || !SERVICE_ROLE_KEY) throw new Error('Could not read keys from `supabase status`. Is the stack running?');
  return { apiUrl: API_URL, anonKey: ANON_KEY, serviceRoleKey: SERVICE_ROLE_KEY };
}

/** Points the Vite `e2e` mode at the local stack. Only public (anon) values go in the file. */
export function writeEnvFile(env: StackEnv): void {
  writeFileSync(ENV_FILE, `VITE_SUPABASE_URL=${env.apiUrl}\nVITE_SUPABASE_ANON_KEY=${env.anonKey}\n`);
}
