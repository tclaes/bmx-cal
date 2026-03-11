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
        const created = await EventsService.createBulkEvents(validEvents);
        console.log('Created events:', created);
        imported = created.length;
      } catch (error) {
        console.error('Bulk insert error:', error);
        errors.push({
          row: 0,
          error: error instanceof Error ? error.message : 'Failed to insert events',
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
      const eventTypeLower = event.event_type.toLowerCase();
      eventTypeId = eventTypeMap.get(eventTypeLower);

      if (!eventTypeId && eventTypeLower.includes('race')) {
        eventTypeId = eventTypeMap.get('race');
      }
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
