import { supabase } from '@data';

const STORAGE_KEY = 'bmx_selected_events';

export const selectionService = {
  getLocalSelections(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveLocalSelections(eventIds: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(eventIds));
    } catch {
      // ignore
    }
  },

  clearLocalSelections(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  async getRemoteSelections(): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_event_selections')
      .select('event_id');
    if (error) throw error;
    return (data as { event_id: string }[]).map(row => row.event_id);
  },

  async addRemoteSelection(eventId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // (user_id, event_id) is unique: re-adding a race that is already saved is not an error.
    const { error } = await supabase
      .from('user_event_selections')
      .upsert({ user_id: user.id, event_id: eventId }, { onConflict: 'user_id,event_id', ignoreDuplicates: true });
    if (error) throw error;
  },

  async removeRemoteSelection(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('user_event_selections')
      .delete()
      .eq('event_id', eventId);
    if (error) throw error;
  },

  async clearRemoteSelections(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('user_event_selections')
      .delete()
      .eq('user_id', user.id);
    if (error) throw error;
  },

  getSelections(): string[] {
    return this.getLocalSelections();
  },

  saveSelections(eventIds: string[]): void {
    this.saveLocalSelections(eventIds);
  },

  toggleSelection(eventId: string): boolean {
    const selections = new Set(this.getLocalSelections());
    if (selections.has(eventId)) {
      selections.delete(eventId);
    } else {
      selections.add(eventId);
    }
    this.saveLocalSelections([...selections]);
    return selections.has(eventId);
  },

  clearAllSelections(): void {
    this.clearLocalSelections();
  }
};
