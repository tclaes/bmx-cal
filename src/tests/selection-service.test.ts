import { describe, it, expect, vi } from 'vitest';
import { selectionService } from '@core/services';

describe('selectionService storage errors', () => {
  it('logs instead of throwing when the selection cannot be saved or cleared on this device', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
    try {
      expect(() => selectionService.saveLocalSelections(['a'])).not.toThrow();
      expect(() => selectionService.clearLocalSelections()).not.toThrow();
      expect(warn).toHaveBeenCalledWith(
        '[selection] Could not save the selection on this device.',
        expect.objectContaining({ message: 'quota' }),
      );
      expect(warn).toHaveBeenCalledWith(
        '[selection] Could not clear the selection on this device.',
        expect.objectContaining({ message: 'blocked' }),
      );
    } finally {
      setItem.mockRestore();
      removeItem.mockRestore();
      warn.mockRestore();
    }
    selectionService.saveLocalSelections([]); // storage works again: reset the saved-copy mode
  });

  it('keeps working from the saved copy while storage fails, so a race can be selected and deselected', () => {
    localStorage.clear();
    selectionService.saveLocalSelections(['x']); // storage works: ['x'] is saved
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    try {
      expect(selectionService.toggleSelection('a')).toBe(true);
      expect(selectionService.getLocalSelections().sort()).toEqual(['a', 'x']); // not the stale ['x']
      expect(selectionService.toggleSelection('a')).toBe(false);
      expect(selectionService.getLocalSelections()).toEqual(['x']);
    } finally {
      setItem.mockRestore();
      warn.mockRestore();
    }
    // Storage works again: the next save goes through and storage is the source once more.
    selectionService.saveLocalSelections(['b']);
    expect(JSON.parse(localStorage.getItem('bmx_selected_events')!)).toEqual(['b']);
    expect(selectionService.getLocalSelections()).toEqual(['b']);
  });
});
