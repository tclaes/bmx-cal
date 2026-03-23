import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  compareVersions,
  meetsMinVersion,
  getStoredVersion,
  storeCurrentVersion,
  checkForUpdate,
  isVersionOutdated,
} from '@shared/utils/version-checker';

describe('version-checker', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.5.3', '2.5.3')).toBe(0);
    });

    it('should return 1 when first version is greater', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
    });

    it('should return -1 when first version is less', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    });

    it('should handle versions with different number of parts', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.1', '1.0.5')).toBe(1);
      expect(compareVersions('1', '1.0.0')).toBe(0);
    });
  });

  describe('meetsMinVersion', () => {
    it('should return true when current version meets minimum', () => {
      expect(meetsMinVersion('2.0.0', '1.0.0')).toBe(true);
      expect(meetsMinVersion('1.0.0', '1.0.0')).toBe(true);
      expect(meetsMinVersion('1.5.0', '1.0.0')).toBe(true);
    });

    it('should return false when current version is below minimum', () => {
      expect(meetsMinVersion('0.9.0', '1.0.0')).toBe(false);
      expect(meetsMinVersion('1.0.0', '1.1.0')).toBe(false);
    });
  });

  describe('getStoredVersion and storeCurrentVersion', () => {
    it('should return null when no version is stored', () => {
      expect(getStoredVersion()).toBe(null);
    });

    it('should store and retrieve version', () => {
      storeCurrentVersion();
      const stored = getStoredVersion();
      expect(stored).toBe('1.0.0');
    });

    it('should handle localStorage errors gracefully', () => {
      const mockGetItem = vi.spyOn(Storage.prototype, 'getItem');
      mockGetItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      expect(getStoredVersion()).toBe(null);

      mockGetItem.mockRestore();
    });
  });

  describe('checkForUpdate', () => {
    it('should detect no update on first use', () => {
      const result = checkForUpdate();
      expect(result.hasUpdate).toBe(false);
      expect(result.stored).toBe(null);
      expect(result.current).toBe('1.0.0');
    });

    it('should detect update when stored version differs', () => {
      localStorage.setItem('app_version', '0.9.0');
      const result = checkForUpdate();
      expect(result.hasUpdate).toBe(true);
      expect(result.stored).toBe('0.9.0');
      expect(result.current).toBe('1.0.0');
    });

    it('should not detect update when versions match', () => {
      localStorage.setItem('app_version', '1.0.0');
      const result = checkForUpdate();
      expect(result.hasUpdate).toBe(false);
      expect(result.stored).toBe('1.0.0');
    });

    it('should include force update flag', () => {
      const result = checkForUpdate();
      expect(result.forceUpdate).toBe(false);
    });

    it('should include min version', () => {
      const result = checkForUpdate();
      expect(result.minVersion).toBe('1.0.0');
    });
  });

  describe('isVersionOutdated', () => {
    it('should return false for first time users', () => {
      expect(isVersionOutdated()).toBe(false);
    });

    it('should return false when stored version meets minimum', () => {
      localStorage.setItem('app_version', '1.0.0');
      expect(isVersionOutdated()).toBe(false);
    });

    it('should return true when stored version is below minimum', () => {
      localStorage.setItem('app_version', '0.5.0');
      expect(isVersionOutdated()).toBe(true);
    });

    it('should return false when stored version exceeds minimum', () => {
      localStorage.setItem('app_version', '2.0.0');
      expect(isVersionOutdated()).toBe(false);
    });
  });
});
