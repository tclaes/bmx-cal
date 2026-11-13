import { seedUsers } from './seed-users';
import { assertDocker, ENV_FILE, getStackEnv, isRunning, startStack, supabase, writeEnvFile } from './stack';
import { assertLocal } from './guard';
import { prepareWorkdir } from './workdir';

async function main() {
  const cmd = process.argv[2];
  if (cmd === 'stop') {
    assertDocker();
    supabase(['stop', '--no-backup']);
    return;
  }

  assertDocker();
  prepareWorkdir();
  if (cmd === 'reset') {
    if (!isRunning()) startStack();
    supabase(['db', 'reset']);
  } else {
    startStack();
  }

  const env = getStackEnv();
  assertLocal(env.apiUrl);
  await seedUsers(env);
  writeEnvFile(env);
  console.log(`\nLocal test environment ready. Env written to ${ENV_FILE}\nRun the app: npm run dev:e2e`);
}

main().catch((e) => { console.error(`\n${e.message ?? e}`); process.exit(1); });
