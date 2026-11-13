import { writable, derived, get, type Readable } from 'svelte/store';
import { FeatureFlagService } from '@core/services';
import type { FeatureFlag } from '@types';

interface FeatureFlagsState {
  loaded: boolean;
  /** Set when the flags could not be read; every feature stays off. */
  error: string | null;
  flags: Record<string, FeatureFlag>;
}

function createFeatureFlagsStore() {
  const { subscribe, set, update } = writable<FeatureFlagsState>({ loaded: false, error: null, flags: {} });

  return {
    subscribe,
    /** Fails closed: on error nothing is enabled and the page keeps working. */
    load: async () => {
      try {
        const list = await FeatureFlagService.getAll();
        set({ loaded: true, error: null, flags: Object.fromEntries(list.map(f => [f.key, f])) });
      } catch (err) {
        console.error('Failed to load feature flags', err);
        set({ loaded: true, error: err instanceof Error ? err.message : 'Failed to load feature flags', flags: {} });
      }
    },
    /** Admin action: stores the change, then reflects the stored row. */
    setEnabled: async (key: string, enabled: boolean) => {
      const row = await FeatureFlagService.setFlag(key, enabled);
      update(s => ({ ...s, flags: { ...s.flags, [key]: row } }));
    },
  };
}

export const featureFlagsStore = createFeatureFlagsStore();

/** True only when the flags are loaded and the flag exists and is enabled. */
export function featureEnabled(key: string): Readable<boolean> {
  return derived(featureFlagsStore, s => s.loaded && s.flags[key]?.enabled === true);
}

export function isFeatureEnabled(key: string): boolean {
  return get(featureEnabled(key));
}
