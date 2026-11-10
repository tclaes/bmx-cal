import { writable, derived } from 'svelte/store';
import type { AdminUser } from '@types';

export interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,
    setUser: (user: AdminUser | null) =>
      update(state => ({ ...state, user, loading: false })),
    setLoading: (loading: boolean) =>
      update(state => ({ ...state, loading })),
    setError: (error: string | null) =>
      update(state => ({ ...state, error })),
    logout: () =>
      set({ user: null, loading: false, error: null }),
    reset: () => set(initialState),
  };
}

const baseAuthStore = createAuthStore();

export const authStore = {
  ...baseAuthStore,
  isAuthenticated: derived(baseAuthStore, $auth => $auth.user !== null)
};

export const user = derived(baseAuthStore, $auth => $auth.user);
export const isAdmin = derived(baseAuthStore, $auth => $auth.user?.role === 'admin');
export const isTeamManager = derived(baseAuthStore, $auth =>
  $auth.user?.role === 'admin' || ($auth.user?.managedTeams?.length ?? 0) > 0
);
export const userTeams = derived(baseAuthStore, $auth => $auth.user?.teams ?? []);
export const userManagedTeams = derived(baseAuthStore, $auth => $auth.user?.managedTeams ?? []);
