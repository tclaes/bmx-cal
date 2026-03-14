import { supabase } from '@data/supabase';
import type { AdminUser, Team } from '@types';

async function fetchUserTeams(userId: string): Promise<Team[]> {
  const { data } = await supabase
    .from('team_managers')
    .select('team:teams(id, name, created_at)')
    .eq('user_id', userId);

  if (!data) return [];
  return data.map((row: { team: Team }) => row.team).filter(Boolean);
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
    const teams = await fetchUserTeams(user.id);

    const effectiveRole = role === 'admin' || teams.length > 0 ? role : 'user';

    return {
      id: user.id,
      email: user.email || '',
      role: effectiveRole,
      teams,
    };
  }

  static async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'admin';
  }

  static async isTeamManager(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'admin' || (user?.teams?.length ?? 0) > 0;
  }

  static onAuthStateChange(callback: (user: AdminUser | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          const role = session.user.app_metadata?.role || 'user';
          const teams = await fetchUserTeams(session.user.id);

          const adminUser: AdminUser = {
            id: session.user.id,
            email: session.user.email || '',
            role,
            teams,
          };
          callback(adminUser);
        } else {
          callback(null);
        }
      })();
    });
  }
}
