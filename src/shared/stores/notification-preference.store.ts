import { writable, derived } from 'svelte/store';
import { notificationPreferenceService } from '../services/notification-preference.service';

interface NotificationPrefState {
  preferredEventTypeIds: Set<string>;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationPrefState = {
  preferredEventTypeIds: new Set<string>(),
  loading: true,
  error: null,
};

function createNotificationPrefStore() {
  const { subscribe, set, update } = writable<NotificationPrefState>(initialState);

  return {
    subscribe,
    load: async () => {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const ids = await notificationPreferenceService.loadPreferredEventTypeIds();
        update(s => ({ ...s, preferredEventTypeIds: ids, loading: false }));
      } catch (err) {
        update(s => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load notification preferences',
        }));
      }
    },
    toggle: async (eventTypeId: string, enabled: boolean) => {
      update(s => {
        const next = new Set(s.preferredEventTypeIds);
        if (enabled) next.add(eventTypeId);
        else next.delete(eventTypeId);
        return { ...s, preferredEventTypeIds: next, error: null };
      });
      try {
        if (enabled) {
          await notificationPreferenceService.enable(eventTypeId);
        } else {
          await notificationPreferenceService.disable(eventTypeId);
        }
      } catch (err) {
        update(s => ({
          ...s,
          error: err instanceof Error ? err.message : 'Failed to update notification preference',
        }));
      }
    },
    reset: () => set(initialState),
  };
}

const baseStore = createNotificationPrefStore();

export const notificationPrefStore = {
  ...baseStore,
  preferredIds: derived(baseStore, $s => $s.preferredEventTypeIds),
};
