import type { ParsedEvent } from '@types';

export async function parseICalendar(file: File): Promise<ParsedEvent[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const events = parseICalText(text);
        resolve(events);
      } catch (error) {
        reject(new Error('Failed to parse iCalendar file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read iCalendar file'));
    };

    reader.readAsText(file);
  });
}

function parseICalText(text: string): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const lines = text.split(/\r?\n/);

  let currentEvent: Partial<ParsedEvent> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.title && currentEvent.date && currentEvent.location) {
        events.push(currentEvent as ParsedEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);

      if (key.startsWith('SUMMARY')) {
        currentEvent.title = value;
      } else if (key.startsWith('DESCRIPTION')) {
        currentEvent.description = value;
      } else if (key.startsWith('DTSTART')) {
        const dateTime = parseDateTimeValue(value);
        currentEvent.date = dateTime.date;
        currentEvent.start_time = dateTime.time;
      } else if (key.startsWith('DTEND')) {
        const dateTime = parseDateTimeValue(value);
        currentEvent.end_time = dateTime.time;
      } else if (key.startsWith('LOCATION')) {
        currentEvent.location = value;
      } else if (key.startsWith('CATEGORIES')) {
        currentEvent.event_type = value.split(',')[0];
      }
    }
  }

  return events;
}

function parseDateTimeValue(value: string): { date: string; time: string | null } {
  const cleanValue = value.replace(/[^0-9T]/g, '');

  if (cleanValue.length >= 8) {
    const year = cleanValue.substring(0, 4);
    const month = cleanValue.substring(4, 6);
    const day = cleanValue.substring(6, 8);
    const date = `${year}-${month}-${day}`;

    let time: string | null = null;
    if (cleanValue.length >= 13 && cleanValue.includes('T')) {
      const hour = cleanValue.substring(9, 11);
      const minute = cleanValue.substring(11, 13);
      time = `${hour}:${minute}`;
    }

    return { date, time };
  }

  return { date: '', time: null };
}
