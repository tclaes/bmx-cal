import { writable, get } from 'svelte/store';
import { ReleaseService } from '@core/services';
import {
  isValidManifest,
  isOverrideActive,
  resolveUpdateState,
  toLocalizedText,
  type LocalizedText,
  type UpdateState,
} from '@shared/utils';
import { APP_VERSION } from '@config';

export const DISMISSED_VERSION_KEY = 'update_dismissed_version';
const SW_UPDATE_TIMEOUT_MS = 3000;

export type UpdateCheckResult = UpdateState | 'error';

export interface UpdateStoreState {
  state: UpdateState;
  deployedVersion: string | null;
  /** Admin message, only set when the override caused the mandatory update. */
  message: LocalizedText | null;
  checking: boolean;
}

const initialState: UpdateStoreState = {
  state: 'none',
  deployedVersion: null,
  message: null,
  checking: false,
};

// Fallback when localStorage is unavailable (private mode, blocked storage), so a
// dismissal still holds for the rest of this session instead of being lost.
const memoryStorage = new Map<string, string>();

function readStorage(key: string): string | null {
  try {
    // Session memory first: it holds a dismissal whose localStorage write failed.
    return memoryStorage.get(key) ?? localStorage.getItem(key);
  } catch (error) {
    console.warn(`[updates] Could not read "${key}" from localStorage; using session memory.`, error);
    return memoryStorage.get(key) ?? null;
  }
}

function writeStorage(key: string, value: string): void {
  memoryStorage.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[updates] Could not save "${key}" to localStorage; it is kept for this session only.`, error);
  }
}

/**
 * Ask the browser to fetch the new service worker before reloading. This is best effort:
 * navigations are network-first, so the reload loads the new version even if this fails.
 * Returns whether the update request completed in time.
 */
async function updateServiceWorker(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    const updatedInTime = await Promise.race([
      registration.update().then(() => true),
      new Promise<false>((resolve) => setTimeout(() => resolve(false), SW_UPDATE_TIMEOUT_MS)),
    ]);
    if (!updatedInTime) {
      console.warn(`[updates] Service worker update took longer than ${SW_UPDATE_TIMEOUT_MS} ms; reloading anyway.`);
    }
    return updatedInTime;
  } catch (error) {
    console.warn('[updates] Service worker update failed; reloading anyway.', error);
    return false;
  }
}

function createUpdateStore() {
  const { subscribe, set, update } = writable<UpdateStoreState>({ ...initialState });
  let inFlight: Promise<UpdateCheckResult> | null = null;

  async function runCheck(): Promise<UpdateCheckResult> {
    update((s) => ({ ...s, checking: true }));

    const [manifest, override] = await Promise.all([
      ReleaseService.fetchManifest(),
      ReleaseService.fetchOverride(),
    ]);

    if (!isValidManifest(manifest)) {
      // Keep the last known result: a transient network error must not close an open
      // mandatory dialog. Before any successful check the state is still 'none'.
      update((s) => ({ ...s, checking: false }));
      return 'error';
    }

    const overrideMin = override?.minVersion ?? null;
    const input = {
      running: APP_VERSION,
      deployed: manifest.version,
      publishedMin: manifest.minVersion,
      overrideMin,
    };
    // What is deployed, regardless of a dismissed banner: a manual check must not
    // report "latest version" while a newer release exists.
    const available = resolveUpdateState(input);
    const state = resolveUpdateState({ ...input, dismissedVersion: readStorage(DISMISSED_VERSION_KEY) });

    const message = state === 'mandatory' && isOverrideActive(manifest.minVersion, overrideMin, manifest.version)
      ? toLocalizedText(override?.message)
      : null;

    set({ state, deployedVersion: manifest.version, message, checking: false });
    return available;
  }

  return {
    subscribe,
    /**
     * Check the published release. Concurrent calls share one request. Resolves to what is
     * available (a dismissed banner still counts as 'optional'), or 'error' when the check failed.
     */
    check(): Promise<UpdateCheckResult> {
      if (!inFlight) {
        inFlight = runCheck().finally(() => {
          inFlight = null;
        });
      }
      return inFlight;
    },
    /** Hide the optional banner for the currently deployed version. Mandatory updates cannot be dismissed. */
    dismiss(): void {
      const current = get({ subscribe });
      if (current.state !== 'optional') return;
      if (current.deployedVersion) writeStorage(DISMISSED_VERSION_KEY, current.deployedVersion);
      update((s) => ({ ...s, state: 'none' }));
    },
    /** Load the deployed version. */
    async applyUpdate(): Promise<void> {
      await updateServiceWorker();
      window.location.reload();
    },
    reset(): void {
      inFlight = null;
      memoryStorage.clear();
      set({ ...initialState });
    },
  };
}

export const updateStore = createUpdateStore();

export const VISIBILITY_THROTTLE_MS = 60 * 1000;
export const CHECK_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Check for updates now, whenever the app returns to the foreground (at most once a minute)
 * and every 30 minutes. Returns a function that stops the checks.
 */
export function startUpdateChecks(): () => void {
  let lastCheck = Date.now();
  const run = () => {
    lastCheck = Date.now();
    void updateStore.check();
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible' && Date.now() - lastCheck >= VISIBILITY_THROTTLE_MS) {
      run();
    }
  };

  run();
  document.addEventListener('visibilitychange', onVisibility);
  const interval = setInterval(run, CHECK_INTERVAL_MS);

  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    clearInterval(interval);
  };
}

function createInstallPromptStore() {
  const { subscribe, set, update } = writable({
    canInstall: false,
    isInstalled: false,
  });

  return {
    subscribe,
    setCanInstall: (canInstall: boolean) => update(state => ({ ...state, canInstall })),
    setInstalled: (isInstalled: boolean) => update(state => ({ ...state, isInstalled })),
    reset: () => set({ canInstall: false, isInstalled: false }),
  };
}

export const installPromptStore = createInstallPromptStore();
