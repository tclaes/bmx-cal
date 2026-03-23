import { APP_VERSION, MIN_VERSION, FORCE_UPDATE } from '@shared/config/version';

const VERSION_KEY = 'app_version';

export interface VersionInfo {
  current: string;
  stored: string | null;
  hasUpdate: boolean;
  forceUpdate: boolean;
  minVersion: string;
}

/**
 * Compare two semantic version strings
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

/**
 * Check if current version meets minimum required version
 */
export function meetsMinVersion(currentVersion: string, minVersion: string): boolean {
  return compareVersions(currentVersion, minVersion) >= 0;
}

/**
 * Get stored version from localStorage
 */
export function getStoredVersion(): string | null {
  try {
    return localStorage.getItem(VERSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Store current version in localStorage
 */
export function storeCurrentVersion(): void {
  try {
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Check if app version has been updated
 */
export function checkForUpdate(): VersionInfo {
  const storedVersion = getStoredVersion();
  const hasUpdate = storedVersion !== null && compareVersions(APP_VERSION, storedVersion) > 0;

  return {
    current: APP_VERSION,
    stored: storedVersion,
    hasUpdate,
    forceUpdate: FORCE_UPDATE,
    minVersion: MIN_VERSION,
  };
}

/**
 * Check if stored version is outdated (below minimum required)
 */
export function isVersionOutdated(): boolean {
  const storedVersion = getStoredVersion();

  if (!storedVersion) {
    return false; // First time user
  }

  return !meetsMinVersion(storedVersion, MIN_VERSION);
}

/**
 * Manually check for updates by clearing cache and reloading
 */
export async function manualUpdateCheck(): Promise<boolean> {
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Tell service worker to skip waiting and activate new version
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration) {
        // Force update check
        await registration.update();

        // Check if there's a waiting worker
        if (registration.waiting) {
          // Send skip waiting message
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Manual update check failed:', error);
    return false;
  }
}
