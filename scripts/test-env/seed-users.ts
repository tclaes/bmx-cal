import { createClient } from '@supabase/supabase-js';
import { assertLocal } from './guard';
import { getStackEnv, type StackEnv } from './stack';
import { TEST_PASSWORD, TEST_TEAM_ID, TEST_USERS } from './users';

/** Idempotently creates the test users and their team membership via the admin API. */
export async function seedUsers(env: StackEnv = getStackEnv()): Promise<void> {
  assertLocal(env.apiUrl);
  const admin = createClient(env.apiUrl, env.serviceRoleKey, { auth: { persistSession: false } });

  const { data: existing, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  for (const u of TEST_USERS) {
    const attrs = {
      email: u.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      app_metadata: u.appRole ? { role: u.appRole } : {},
    };
    const found = existing.users.find((x) => x.email === u.email);
    const { data, error } = found
      ? await admin.auth.admin.updateUserById(found.id, attrs)
      : await admin.auth.admin.createUser(attrs);
    if (error || !data.user) throw error ?? new Error(`Could not seed ${u.email}`);

    const table = u.managesTeam ? 'team_managers' : 'team_members';
    if (u.role !== 'admin') {
      const { error: linkError } = await admin
        .from(table)
        .upsert({ user_id: data.user.id, team_id: TEST_TEAM_ID }, { onConflict: 'user_id,team_id', ignoreDuplicates: true });
      if (linkError) throw linkError;
    }
    console.log(`seeded ${u.role}: ${u.email}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers().catch((e) => { console.error(e.message ?? e); process.exit(1); });
}
