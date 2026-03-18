import { writable } from 'svelte/store';

export const updateAvailable = writable(false);

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
