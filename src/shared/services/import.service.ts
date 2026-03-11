import { supabase } from '@data/supabase';
import type { ImportLog, ImportResult, CreateEventInput, ParsedEvent } from '@types';
import { EventsService } from './events.service';

export class ImportService {
  static async importEvents(
    events: ParsedEvent[],
    filename: string,
    userId: string
  ): Promise<ImportResult> {
    const errors: Array<{ row: number; error: string }> = [];
    const validEvents: CreateEventInput[] = [];

    const eventTypes = await EventsService.getEventTypes();
    const eventTypeMap = new Map(eventTypes.map(et => [et.name.toLowerCase(), et.id]));

    console.log('Event types:', eventTypes);
    console.log('Validating events:', events);

    events.forEach((event, index) => {
      try {
        const validatedEvent = this.validateEvent(event, eventTypeMap);
        console.log(`Validated event ${index + 1}:`, validatedEvent);
        validEvents.push(validatedEvent);
      } catch (error) {
        console.error(`Validation error for event ${index + 1}:`, error);
        errors.push({
          row: index + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    console.log('Valid events to import:', validEvents);
    console.log('Validation errors:', errors);

    let imported = 0;
    if (validEvents.length > 0) {
      try {
        const result = await this.upsertEvents(validEvents);
        console.log('Upserted events:', result);
        imported = result.created + result.updated;
      } catch (error) {
        console.error('Upsert error:', error);
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

    console.log(`Creating ${toCreate.length} new events, updating ${toUpdate.length} existing events`);

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

      if (error) {
        console.error(`Failed to update event ${id}:`, error);
      } else {
        updated++;
      }
    }

    return { created, updated };
  }

  private static validateEvent(
    event: ParsedEvent,
    eventTypeMap: Map<string, string>
  ): CreateEventInput {
    if (!event.title || event.title.trim() === '') {
      throw new Error('Title is required');
    }

    if (!event.date) {
      throw new Error('Date is required');
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(event.date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }

    let eventTypeId: string | undefined;
    if (event.event_type) {
      const eventTypeLower = event.event_type.toLowerCase().trim();

      eventTypeId = eventTypeMap.get(eventTypeLower);

      if (!eventTypeId) {
        if (eventTypeLower.includes('race') || eventTypeLower.includes('racing') ||
            eventTypeLower.includes('competition') || eventTypeLower.includes('championship')) {
          eventTypeId = eventTypeMap.get('race');
        } else if (eventTypeLower.includes('freestyle')) {
          eventTypeId = eventTypeMap.get('freestyle');
        } else if (eventTypeLower.includes('park')) {
          eventTypeId = eventTypeMap.get('park');
        } else if (eventTypeLower.includes('street')) {
          eventTypeId = eventTypeMap.get('street');
        } else if (eventTypeLower.includes('dirt')) {
          eventTypeId = eventTypeMap.get('dirt');
        } else if (eventTypeLower.includes('flatland')) {
          eventTypeId = eventTypeMap.get('flatland');
        }
      }

      console.log(`Matched event type "${event.event_type}" to ID:`, eventTypeId);
    }

    return {
      title: event.title.trim(),
      description: event.description?.trim() || '',
      date: event.date,
      start_time: event.start_time || null,
      end_time: event.end_time || null,
      location: event.location?.trim() || 'TBD',
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
