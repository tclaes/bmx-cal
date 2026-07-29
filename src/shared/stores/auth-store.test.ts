import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore, isAdmin, isTeamManager, userTeams, userManagedTeams } from './auth.store';
import type { AdminUser, Team } from '../../types';

const team1: Team = { id: 'team-1', name: 'Team Alpha', created_at: '2026-01-01T00:00:00Z' };
const team2: Team = { id: 'team-2', name: 'Team Beta', created_at: '2026-01-01T00:00:00Z' };

function makeUser(overrides: Partial<AdminUser>): AdminUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    role: 'user',
    teams: [],
    managedTeams: [],
    ...overrides,
  };
}

describe('authStore', () => {
  beforeEach(() => {
    authStore.reset();
  });

  it('starts with no user', () => {
    expect(get(authStore).user).toBeNull();
  });

  it('setUser stores the user', () => {
    const user = makeUser({ role: 'admin' });
    authStore.setUser(user);
    expect(get(authStore).user).toEqual(user);
  });

  it('logout clears the user', () => {
    authStore.setUser(makeUser({ role: 'admin' }));
    authStore.logout();
    expect(get(authStore).user).toBeNull();
  });
});

describe('isAdmin derived store', () => {
  beforeEach(() => {
    authStore.reset();
  });

  it('is false when no user', () => {
    expect(get(isAdmin)).toBe(false);
  });

  it('is false for plain user role', () => {
    authStore.setUser(makeUser({ role: 'user' }));
    expect(get(isAdmin)).toBe(false);
  });

  it('is false for team manager role without admin', () => {
    authStore.setUser(makeUser({ role: 'user', managedTeams: [team1] }));
    expect(get(isAdmin)).toBe(false);
  });

  it('is true for admin role', () => {
    authStore.setUser(makeUser({ role: 'admin' }));
    expect(get(isAdmin)).toBe(true);
  });
});

describe('isTeamManager derived store', () => {
  beforeEach(() => {
    authStore.reset();
  });

  it('is false when no user', () => {
    expect(get(isTeamManager)).toBe(false);
  });

  it('is false for plain user with no teams', () => {
    authStore.setUser(makeUser({ role: 'user', managedTeams: [] }));
    expect(get(isTeamManager)).toBe(false);
  });

  it('is false for team member only (teams but no managedTeams)', () => {
    authStore.setUser(makeUser({ role: 'user', teams: [team1], managedTeams: [] }));
    expect(get(isTeamManager)).toBe(false);
  });

  it('is true for user who manages a team', () => {
    authStore.setUser(makeUser({ role: 'user', teams: [team1], managedTeams: [team1] }));
    expect(get(isTeamManager)).toBe(true);
  });

  it('is true for admin even without managed teams', () => {
    authStore.setUser(makeUser({ role: 'admin', teams: [], managedTeams: [] }));
    expect(get(isTeamManager)).toBe(true);
  });

  it('is true for admin who also manages teams', () => {
    authStore.setUser(makeUser({ role: 'admin', teams: [team1], managedTeams: [team1] }));
    expect(get(isTeamManager)).toBe(true);
  });

  it('resets to false after logout', () => {
    authStore.setUser(makeUser({ role: 'user', managedTeams: [team1] }));
    expect(get(isTeamManager)).toBe(true);
    authStore.logout();
    expect(get(isTeamManager)).toBe(false);
  });
});

describe('userTeams derived store', () => {
  beforeEach(() => {
    authStore.reset();
  });

  it('returns empty array when no user', () => {
    expect(get(userTeams)).toEqual([]);
  });

  it('returns all teams (including member-only teams)', () => {
    authStore.setUser(makeUser({ teams: [team1, team2], managedTeams: [team1] }));
    expect(get(userTeams)).toEqual([team1, team2]);
  });
});

describe('userManagedTeams derived store', () => {
  beforeEach(() => {
    authStore.reset();
  });

  it('returns empty array when no user', () => {
    expect(get(userManagedTeams)).toEqual([]);
  });

  it('returns only managed teams, not member-only teams', () => {
    authStore.setUser(makeUser({ teams: [team1, team2], managedTeams: [team1] }));
    expect(get(userManagedTeams)).toEqual([team1]);
    expect(get(userManagedTeams)).not.toContain(team2);
  });

  it('returns all managed teams when user manages multiple', () => {
    authStore.setUser(makeUser({ teams: [team1, team2], managedTeams: [team1, team2] }));
    expect(get(userManagedTeams)).toHaveLength(2);
  });
});
