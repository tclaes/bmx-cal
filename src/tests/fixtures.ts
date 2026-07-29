import type { AdminUser, Team } from '../../types';

export const team1: Team = { id: 'team-1', name: 'Team Alpha', created_at: '2026-01-01T00:00:00Z' };
export const team2: Team = { id: 'team-2', name: 'Team Beta', created_at: '2026-01-01T00:00:00Z' };
export const teams = [team1, team2];

export function makeUser(overrides: Partial<AdminUser>): AdminUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    role: 'user',
    teams: [],
    managedTeams: [],
    ...overrides,
  };
}
