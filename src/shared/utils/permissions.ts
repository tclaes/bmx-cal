import type { EventWithDetails, AdminUser } from '../../types';

export function canEditEvent(event: EventWithDetails, user: AdminUser | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const managedTeamIds = new Set((user.managedTeams ?? []).map(t => t.id));
  if (managedTeamIds.size > 0 && event.team_id && managedTeamIds.has(event.team_id)) return true;
  return false;
}
