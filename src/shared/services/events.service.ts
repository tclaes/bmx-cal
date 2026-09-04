import { supabase } from '@data/supabase';
import type { Event, EventWithDetails, CreateEventInput, EventType, Location } from '@types';

const EVENT_SELECT = `
  *,
  event_type:event_types!events_event_type_id_fkey(*),
  location_details:locations(*)
`;

export class EventsService {
  static async getUpcomingEvents(): Promise<EventWithDetails[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_SELECT)
      .gte('date', today)
      .order('date', { ascending: true });
    if (error) throw error;
    return data as EventWithDetails[];
  }

  static async getAllEvents(): Promise<EventWithDetails[]> {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_SELECT)
      .order('date', { ascending: true });
    if (error) throw error;
    return data as EventWithDetails[];
  }

  static async getEventsByDateRange(startDate: string, endDate: string): Promise<EventWithDetails[]> {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_SELECT)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    if (error) throw error;
    return data as EventWithDetails[];
  }

  static async getEventById(id: string): Promise<EventWithDetails | null> {
    const { data, error } = await supabase
      .from('events')
      .select(EVENT_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as EventWithDetails | null;
  }

  static async createEvent(event: CreateEventInput): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert({ ...event, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async createBulkEvents(events: CreateEventInput[]): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .insert(events.map(event => ({ ...event, updated_at: new Date().toISOString() })))
      .select();
    if (error) throw error;
    return data;
  }

  static async updateEvent(id: string, updates: Partial<CreateEventInput>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update({ ...updates, updated_at: new Date().toISOString() })
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

  static async getTeamEventType(teamId: string): Promise<EventType | null> {
    const { data, error } = await supabase
      .from('event_types')
      .select('*')
      .eq('team_id', teamId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  static async getLocations(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  }

  static async createLocation(location: { name: string; city?: string; address?: string; country?: string }): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .insert({ ...location, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
