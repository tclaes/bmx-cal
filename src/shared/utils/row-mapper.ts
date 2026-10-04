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

const START_TIME_KEYS = [
  'start_time', 'Start_Time', 'starttime', 'StartTime',
  'start', 'Start',
  'begin', 'Begin',
  'van', 'Van',
  'time', 'Time',
  'uur', 'Uur',
];

const END_TIME_KEYS = [
  'end_time', 'End_Time', 'endtime', 'EndTime',
  'end', 'End',
  'eind', 'Eind',
  'tot', 'Tot',
  'until', 'Until',
];

const TITLE_KEYS = ['title', 'Title', 'event', 'Event', 'naam', 'Naam', 'name', 'Name', 'activiteit', 'Activiteit'];
const DATE_KEYS = ['date', 'Date', 'datum', 'Datum', 'dag', 'Dag', 'when', 'When'];
const DESCRIPTION_KEYS = ['description', 'Description', 'omschrijving', 'Omschrijving', 'details', 'Details', 'info', 'Info'];
const LOCATION_KEYS = ['location', 'Location', 'venue', 'Venue', 'locatie', 'Locatie', 'plaats', 'Plaats', 'place', 'Place'];
const TYPE_KEYS = ['event_type', 'Event_Type', 'type', 'Type', 'categorie', 'Categorie', 'category', 'Category'];

function formatTimeValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^\d{1,2}:\d{2}/.test(trimmed)) {
    const parts = trimmed.split(':');
    const h = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    return `${h}:${m}`;
  }

  const timeOnly = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (timeOnly) {
    return `${timeOnly[1].padStart(2, '0')}:${timeOnly[2]}`;
  }

  const hms = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (hms) {
    return `${hms[1].padStart(2, '0')}:${hms[2]}`;
  }

  return trimmed;
}

export function normalizeRow(row: Row, formatDate?: (value: any) => string): ParsedEvent {
  const rawDate = pick(row, DATE_KEYS);
  return {
    title: pick(row, TITLE_KEYS),
    description: pick(row, DESCRIPTION_KEYS),
    date: formatDate ? formatDate(rawDate) : rawDate,
    start_time: formatTimeValue(pick(row, START_TIME_KEYS)) || null,
    end_time: formatTimeValue(pick(row, END_TIME_KEYS)) || null,
    location: pick(row, LOCATION_KEYS),
    event_type: pick(row, TYPE_KEYS) || null,
  };
}
