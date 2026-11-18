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
  });
});
