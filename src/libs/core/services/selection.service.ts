import { supabase } from '@data';

const STORAGE_KEY = 'bmx_selected_events';

// The selection as last saved. When saving to storage fails (private mode, full quota) storage
// is behind, so reads use this copy until a save succeeds again: otherwise toggling the same
// race twice would read the same stale value and the race could never be deselected.
let lastSaved: string[] = [];
let storageBehind = false;

export const selectionService = {
  getLocalSelections(): string[] {
    if (storageBehind) return [...lastSaved];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveLocalSelections(eventIds: string[]): void {
    lastSaved = [...eventIds];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(eventIds));
      storageBehind = false;
    } catch (e) {
      // Storage can be unavailable (private mode, quota): keep working from the saved copy above.
      storageBehind = true;
      console.warn('[selection] Could not save the selection on this device.', e);
    }
  },

  clearLocalSelections(): void {
    lastSaved = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
      storageBehind = false;
    } catch (e) {
      // Storage can be unavailable (private mode): the in-memory selection is cleared anyway.
      storageBehind = true;
      console.warn('[selection] Could not clear the selection on this device.', e);
    }
  },

  async getRemoteSelections(): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_event_selections')
      .select('event_id');
    if (error) throw error;
    return (data as { event_id: string }[]).map(row => row.event_id);
  },

  // The account writes take the user id from the caller instead of looking it up, so a write
  // started for one account can never end up writing another account's rows.

  async addRemoteSelection(eventId: string, userId: string): Promise<void> {
    // (user_id, event_id) is unique: re-adding a race that is already saved is not an error.
    const { error } = await supabase
      .from('user_event_selections')
      .upsert({ user_id: userId, event_id: eventId }, { onConflict: 'user_id,event_id', ignoreDuplicates: true });
    if (error) throw error;
  },

  async removeRemoteSelection(eventId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_event_selections')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId);
    if (error) throw error;
  },

  async clearRemoteSelections(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_event_selections')
      .delete()
      .eq('user_id', userId);
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
