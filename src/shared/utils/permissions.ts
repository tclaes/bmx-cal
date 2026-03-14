import type { EventWithDetails, AdminUser, Team } from '../../types';

export function canEditEvent(event: EventWithDetails, user: AdminUser | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const managedTeamIds = new Set((user.managedTeams ?? []).map(t => t.id));
  if (managedTeamIds.size > 0 && event.team_id && managedTeamIds.has(event.team_id)) return true;
  return false;
}

export function getInitialTeamExpandedState(teams: Team[], user: AdminUser | null): Record<string, boolean> {
  const isManagerOnly = user !== null && user.role !== 'admin' && (user.managedTeams ?? []).length > 0;
  return Object.fromEntries(teams.map(t => [t.id, isManagerOnly]));
}
