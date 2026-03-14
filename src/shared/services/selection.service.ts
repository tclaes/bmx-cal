import { supabase } from '../../data/supabase';

export interface UserEventSelection {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

export const selectionService = {
  async getUserSelections(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_event_selections')
      .select('event_id')
      .eq('user_id', userId);

    if (error) throw error;
    return data?.map(s => s.event_id) || [];
  },

  async toggleSelection(userId: string, eventId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('user_event_selections')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('user_event_selections')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from('user_event_selections')
        .insert({ user_id: userId, event_id: eventId });

      if (error) throw error;
      return true;
    }
  },

  async clearAllSelections(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_event_selections')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
};
