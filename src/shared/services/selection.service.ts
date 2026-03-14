import { supabase } from '@data/supabase';

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
    await supabase
      .from('user_event_selections')
      .insert({ user_id: user.id, event_id: eventId });
  },

  async removeRemoteSelection(eventId: string): Promise<void> {
    await supabase
      .from('user_event_selections')
      .delete()
      .eq('event_id', eventId);
  },

  async clearRemoteSelections(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('user_event_selections')
      .delete()
      .eq('user_id', user.id);
  },

  getSelections(): string[] {
    return this.getLocalSelections();
  },

  saveSelections(eventIds: string[]): void {
    this.saveLocalSelections(eventIds);
  },

  toggleSelection(eventId: string): boolean {
    const selections = this.getLocalSelections();
    const index = selections.indexOf(eventId);
    if (index > -1) {
      selections.splice(index, 1);
      this.saveLocalSelections(selections);
      return false;
    } else {
      selections.push(eventId);
      this.saveLocalSelections(selections);
      return true;
    }
  },

  clearAllSelections(): void {
    this.clearLocalSelections();
  }
};
