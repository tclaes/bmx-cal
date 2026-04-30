import type { EventWithDetails, AdminUser, Team } from '../../types';

/**
 * Can the current user access the "Create my calendar" feature?
 * Today: any authenticated user.
 * Later: will be gated on a role/permission on AdminUser (e.g. user.role === 'member'
 * or a dedicated permission flag). The single call site lets us tighten this without
 * hunting down UI checks.
 */
export function canAccessMyCalendar(user: AdminUser | null): boolean {
  return user !== null;
}

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
