import { supabase } from '@data/supabase';

export interface SavedCalendar {
  id: string;
  name: string;
  created_at: string;
  event_count?: number;
}

export const CalendarService = {
  async saveCalendar(name: string, eventIds: string[]): Promise<SavedCalendar> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to save a calendar');

    const { data: calendar, error: calError } = await supabase
      .from('user_calendars')
      .insert({ user_id: user.id, name: name.trim() })
      .select('id, name, created_at')
      .single();

    if (calError) throw calError;

    if (eventIds.length > 0) {
      const rows = eventIds.map(event_id => ({ calendar_id: calendar.id, event_id }));
      const { error: eventsError } = await supabase
        .from('user_calendar_events')
        .insert(rows);
      if (eventsError) throw eventsError;
    }

    return { ...calendar, event_count: eventIds.length };
  },

  async getUserCalendars(): Promise<SavedCalendar[]> {
    const { data, error } = await supabase
      .from('user_calendars')
      .select('id, name, created_at, user_calendar_events(count)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data as any[]).map(row => ({
      id: row.id,
      name: row.name,
      created_at: row.created_at,
      event_count: row.user_calendar_events?.[0]?.count ?? 0,
    }));
  },

  async deleteCalendar(calendarId: string): Promise<void> {
    const { error } = await supabase
      .from('user_calendars')
      .delete()
      .eq('id', calendarId);
    if (error) throw error;
  },

  async getCalendarEventIds(calendarId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_calendar_events')
      .select('event_id')
      .eq('calendar_id', calendarId);
    if (error) throw error;
    return (data as { event_id: string }[]).map(r => r.event_id);
  }
};
