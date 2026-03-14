const STORAGE_KEY = 'bmx_selected_events';

export const selectionService = {
  getSelections(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load selections:', error);
      return [];
    }
  },

  saveSelections(eventIds: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(eventIds));
    } catch (error) {
      console.error('Failed to save selections:', error);
    }
  },

  toggleSelection(eventId: string): boolean {
    const selections = this.getSelections();
    const index = selections.indexOf(eventId);

    if (index > -1) {
      selections.splice(index, 1);
      this.saveSelections(selections);
      return false;
    } else {
      selections.push(eventId);
      this.saveSelections(selections);
      return true;
    }
  },

  clearAllSelections(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
