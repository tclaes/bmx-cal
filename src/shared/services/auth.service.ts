import { supabase } from '@data/supabase';
import type { AdminUser, Team } from '@types';

async function fetchUserTeams(userId: string): Promise<{ allTeams: Team[]; managedTeams: Team[] }> {
  const [managersResult, membersResult] = await Promise.all([
    supabase
      .from('team_managers')
      .select('team:teams(id, name, created_at)')
      .eq('user_id', userId),
    supabase
      .from('team_members')
      .select('team:teams(id, name, created_at)')
      .eq('user_id', userId),
  ]);

  const managedTeams: Team[] = (managersResult.data ?? [])
    .map((row: { team: Team }) => row.team)
    .filter(Boolean);
  const memberTeams: Team[] = (membersResult.data ?? [])
    .map((row: { team: Team }) => row.team)
    .filter(Boolean);

  const seen = new Set<string>();
  const allTeams: Team[] = [];
  for (const t of [...managedTeams, ...memberTeams]) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      allTeams.push(t);
    }
  }
  return { allTeams, managedTeams };
}

export class AuthService {
  static async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  static async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser(): Promise<AdminUser | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const role = user.app_metadata?.role || 'user';
    const { allTeams, managedTeams } = await fetchUserTeams(user.id);

    return {
      id: user.id,
      email: user.email || '',
      role,
      teams: allTeams,
      managedTeams,
    };
  }

  static async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'admin';
  }

  static async isTeamManager(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'admin' || (user?.managedTeams?.length ?? 0) > 0;
  }

  static onAuthStateChange(callback: (user: AdminUser | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          const role = session.user.app_metadata?.role || 'user';
          const { allTeams, managedTeams } = await fetchUserTeams(session.user.id);

          const adminUser: AdminUser = {
            id: session.user.id,
            email: session.user.email || '',
            role,
            teams: allTeams,
            managedTeams,
          };
          callback(adminUser);
        } else {
          callback(null);
        }
      })();
    });
  }
}
