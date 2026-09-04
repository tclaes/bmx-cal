import type { ParsedEvent } from '@types';

type Row = Record<string, any>;

function pick(row: Row, keys: string[]): string {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== '') {
      return String(row[key]);
    }
  }
  return '';
}

export function normalizeRow(row: Row, formatDate?: (value: any) => string): ParsedEvent {
  const rawDate = pick(row, ['date', 'Date']);
  return {
    title: pick(row, ['title', 'Title', 'event', 'Event']),
    description: pick(row, ['description', 'Description']),
    date: formatDate ? formatDate(rawDate) : rawDate,
    start_time: pick(row, ['start_time', 'Start_Time', 'time', 'Time']) || null,
    end_time: pick(row, ['end_time', 'End_Time']) || null,
    location: pick(row, ['location', 'Location', 'venue', 'Venue']),
    event_type: pick(row, ['event_type', 'Event_Type', 'type', 'Type']) || null,
  };
}
