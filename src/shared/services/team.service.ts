import { supabase } from '@data/supabase';
import type { Team, TeamMember } from '@types';

export interface TeamMemberWithEmail extends TeamMember {
  user_email: string;
}

export class TeamService {
  static async getTeams(): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  }

  static async getTeamMembers(teamId: string): Promise<TeamMemberWithEmail[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('id, user_id, team_id, created_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const userIds = (data ?? []).map(m => m.user_id);
    if (userIds.length === 0) return [];

    const { data: users, error: usersError } = await supabase
      .rpc('get_users_by_ids', { user_ids: userIds });

    const emailMap: Record<string, string> = {};
    if (!usersError && users) {
      for (const u of users) {
        emailMap[u.id] = u.email;
      }
    }

    return (data ?? []).map(m => ({
      ...m,
      user_email: emailMap[m.user_id] ?? m.user_id,
    }));
  }

  static async getAllUsers(): Promise<{ id: string; email: string }[]> {
    const { data, error } = await supabase.rpc('get_all_users');
    if (error) throw error;
    return data ?? [];
  }

  static async addTeamMember(userId: string, teamId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .insert({ user_id: userId, team_id: teamId });
    if (error) throw error;
  }

  static async removeTeamMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);
    if (error) throw error;
  }
}
