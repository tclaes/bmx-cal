import { supabase } from '@data/supabase';
import type { ImportLog, ImportResult, CreateEventInput, ParsedEvent } from '@types';
import { EventsService } from './events.service';

const EVENT_TYPE_KEYWORDS: Array<[string, string]> = [
  ['race', 'race'],
  ['racing', 'race'],
  ['competition', 'race'],
  ['championship', 'race'],
  ['freestyle', 'freestyle'],
  ['park', 'park'],
  ['street', 'street'],
  ['dirt', 'dirt'],
  ['flatland', 'flatland'],
];

export class ImportService {
  static async importEvents(
    events: ParsedEvent[],
    filename: string,
    userId: string
  ): Promise<ImportResult> {
    const errors: Array<{ row: number; error: string }> = [];
    const validEvents: CreateEventInput[] = [];

    const [eventTypes, locations] = await Promise.all([
      EventsService.getEventTypes(),
      EventsService.getLocations(),
    ]);

    const eventTypeMap = new Map(eventTypes.map(et => [et.name.toLowerCase(), et.id]));
    const locationMap = new Map(locations.map(loc => [loc.name.toLowerCase().trim(), loc.id]));

    events.forEach((event, index) => {
      try {
        validEvents.push(this.validateEvent(event, eventTypeMap, locationMap));
      } catch (error) {
        errors.push({
          row: index + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    let imported = 0;
    if (validEvents.length > 0) {
      try {
        const result = await this.upsertEvents(validEvents);
        imported = result.created + result.updated;
      } catch (error) {
        errors.push({
          row: 0,
          error: error instanceof Error ? error.message : 'Failed to upsert events',
        });
      }
    }

    await this.logImport(filename, userId, imported, errors);

    return {
      success: errors.length === 0,
      imported,
      errors,
    };
  }

  private static async upsertEvents(
    events: CreateEventInput[]
  ): Promise<{ created: number; updated: number }> {
    const { data: existingEvents, error: fetchError } = await supabase
      .from('events')
      .select('id, title, date');

    if (fetchError) throw fetchError;

    const existingMap = new Map(
      existingEvents?.map(e => [`${e.title.toLowerCase()}|${e.date}`, e.id]) || []
    );

    const toCreate: CreateEventInput[] = [];
    const toUpdate: Array<{ id: string; data: CreateEventInput }> = [];

    events.forEach(event => {
      const key = `${event.title.toLowerCase()}|${event.date}`;
      const existingId = existingMap.get(key);
      if (existingId) {
        toUpdate.push({ id: existingId, data: event });
      } else {
        toCreate.push(event);
      }
    });

    let created = 0;
    let updated = 0;

    if (toCreate.length > 0) {
      const { data, error } = await supabase
        .from('events')
        .insert(toCreate)
        .select();
      if (error) throw error;
      created = data?.length || 0;
    }

    for (const { id, data } of toUpdate) {
      const { error } = await supabase
        .from('events')
        .update(data)
        .eq('id', id);
      if (!error) updated++;
    }

    return { created, updated };
  }

  private static validateEvent(
    event: ParsedEvent,
    eventTypeMap: Map<string, string>,
    locationMap: Map<string, string>
  ): CreateEventInput {
    if (!event.title?.trim()) throw new Error('Title is required');
    if (!event.date) throw new Error('Date is required');

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(event.date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }

    let eventTypeId: string | undefined;
    if (event.event_type) {
      const eventTypeLower = event.event_type.toLowerCase().trim();
      eventTypeId = eventTypeMap.get(eventTypeLower);

      if (!eventTypeId) {
        for (const [keyword, mappedType] of EVENT_TYPE_KEYWORDS) {
          if (eventTypeLower.includes(keyword)) {
            eventTypeId = eventTypeMap.get(mappedType);
            break;
          }
        }
      }
    }

    let locationId: string | undefined;
    const locationText = event.location?.trim() || 'TBD';
    const locationLower = locationText.toLowerCase();

    locationId = locationMap.get(locationLower);

    if (!locationId) {
      for (const [locName, locId] of locationMap.entries()) {
        if (locationLower.includes(locName) || locName.includes(locationLower)) {
          locationId = locId;
          break;
        }
      }
    }

    return {
      title: event.title.trim(),
      description: event.description?.trim() || '',
      date: event.date,
      start_time: event.start_time || null,
      end_time: event.end_time || null,
      location: locationText,
      location_id: locationId,
      event_type_id: eventTypeId,
      status: 'upcoming',
    };
  }

  private static async logImport(
    filename: string,
    userId: string,
    eventsCount: number,
    errors: Array<{ row: number; error: string }>
  ): Promise<void> {
    const status = errors.length === 0 ? 'success' : eventsCount > 0 ? 'partial' : 'failed';

    await supabase.from('import_logs').insert({
      filename,
      imported_by: userId,
      events_count: eventsCount,
      status,
      error_log: errors,
    });
  }

  static async getImportHistory(): Promise<ImportLog[]> {
    const { data, error } = await supabase
      .from('import_logs')
      .select('*')
      .order('imported_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  }
}
