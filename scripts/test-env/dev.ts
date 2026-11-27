import { spawn } from 'node:child_process';
import { assertLocalDevEnv } from './dev-guard';
import { ENV_FILE } from './stack';
import { ROOT } from './workdir';

try {
  assertLocalDevEnv(ENV_FILE);
} catch (e) {
  console.error(`\n${(e as Error).message}`);
  process.exit(1);
}

const child = spawn(
  'npx',
  ['vite', '--mode', 'e2e', '--port', '5173', '--strictPort', ...process.argv.slice(2)],
  { cwd: ROOT, stdio: 'inherit' },
);
for (const sig of ['SIGINT', 'SIGTERM'] as const) process.on(sig, () => child.kill(sig));
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
