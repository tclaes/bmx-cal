import { supabase } from '@data/supabase';
import type { EventType } from '@types';

export interface NotificationPreference {
  event_type_id: string;
}

const NOTIFIABLE_TYPES = ['European Cup', '3 Nations Cup', 'Belgian Cycling', 'World Cup'];

function isNotifiable(type: EventType): boolean {
  return NOTIFIABLE_TYPES.includes(type.name);
}

export const notificationPreferenceService = {
  async loadPreferredEventTypeIds(): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('event_type_id');

    if (error) throw error;
    return new Set((data ?? []).map((p: NotificationPreference) => p.event_type_id));
  },

  async enable(eventTypeId: string): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .insert({ event_type_id: eventTypeId });

    if (error) throw error;
  },

  async disable(eventTypeId: string): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .delete()
      .eq('event_type_id', eventTypeId);

    if (error) throw error;
  },

  filterNotifiableTypes(types: EventType[]): EventType[] {
    return types.filter(isNotifiable);
  },
};
