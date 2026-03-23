import { writable } from 'svelte/store';
import { checkForUpdate, storeCurrentVersion, manualUpdateCheck, type VersionInfo } from '@shared/utils/version-checker';

function createUpdateStore() {
  const { subscribe, set, update } = writable({
    available: false,
    forceUpdate: false,
    checking: false,
  });

  return {
    subscribe,
    setAvailable: (available: boolean, forceUpdate = false) =>
      update(state => ({ ...state, available, forceUpdate })),
    setChecking: (checking: boolean) =>
      update(state => ({ ...state, checking })),
    dismiss: () =>
      update(state => ({ ...state, available: false })),
    checkForUpdates: async (): Promise<VersionInfo> => {
      update(state => ({ ...state, checking: true }));

      try {
        const hasUpdate = await manualUpdateCheck();
        const versionInfo = checkForUpdate();

        if (hasUpdate || versionInfo.hasUpdate) {
          update(state => ({
            ...state,
            available: true,
            forceUpdate: versionInfo.forceUpdate,
            checking: false
          }));
        } else {
          update(state => ({ ...state, checking: false }));
        }

        return versionInfo;
      } catch (error) {
        update(state => ({ ...state, checking: false }));
        throw error;
      }
    },
    confirmUpdate: () => {
      storeCurrentVersion();
      set({ available: false, forceUpdate: false, checking: false });
    },
  };
}

export const updateStore = createUpdateStore();

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
