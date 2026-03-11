import { supabase } from '@data/supabase';
import type { AdminUser } from '@types';

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

    return {
      id: user.id,
      email: user.email || '',
      role: user.app_metadata?.role || 'user',
    };
  }

  static async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'admin';
  }

  static onAuthStateChange(callback: (user: AdminUser | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          const adminUser: AdminUser = {
            id: session.user.id,
            email: session.user.email || '',
            role: session.user.app_metadata?.role || 'user',
          };
          callback(adminUser);
        } else {
          callback(null);
        }
      })();
    });
  }
}
