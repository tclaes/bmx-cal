import { supabase } from '@data/supabase';
import type { Event, EventWithType, CreateEventInput, UpdateEventInput, EventType } from '@types';

export class EventsService {
  static async getUpcomingEvents(): Promise<EventWithType[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_type:event_types(*)
      `)
      .gte('date', today)
      .order('date', { ascending: true });

    if (error) throw error;
    return data as EventWithType[];
  }

  static async getEventsByDateRange(startDate: string, endDate: string): Promise<EventWithType[]> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_type:event_types(*)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data as EventWithType[];
  }

  static async getEventById(id: string): Promise<EventWithType | null> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_type:event_types(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as EventWithType | null;
  }

  static async createEvent(event: CreateEventInput): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...event,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createBulkEvents(events: CreateEventInput[]): Promise<Event[]> {
    const eventsWithTimestamps = events.map(event => ({
      ...event,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('events')
      .insert(eventsWithTimestamps)
      .select();

    if (error) throw error;
    return data;
  }

  static async updateEvent(event: UpdateEventInput): Promise<Event> {
    const { id, ...updates } = event;

    const { data, error } = await supabase
      .from('events')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getEventTypes(): Promise<EventType[]> {
    const { data, error } = await supabase
      .from('event_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }
}
