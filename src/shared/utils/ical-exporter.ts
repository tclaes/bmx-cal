import type { EventWithDetails } from '@types';

function buildLocationString(event: EventWithDetails): string {
  const details = event.location_details;
  if (details) {
    const parts = [
      details.name,
      details.address,
      details.city,
      details.postal_code,
      details.country,
    ].filter(Boolean);
    return parts.join(', ');
  }
  return event.location || '';
}

export function generateICalContent(events: EventWithDetails[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BMX Events Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:BMX Events Calendar',
    'X-WR-TIMEZONE:Europe/Brussels',
    'X-WR-CALDESC:BMX events, competitions, and shows',
  ];

  for (const event of events) {
    const uid = `${event.id}@bmx-events.local`;
    const dtstart = formatICalDateStr(event.date);
    const dtend = event.end_date
      ? formatICalDateStrPlusOne(event.end_date)
      : formatICalDateStrPlusOne(event.date);
    const dtstamp = formatICalDate(new Date());

    const summary = escapeICalText(event.title);
    const locationStr = buildLocationString(event);
    const description = escapeICalText([
      event.description || '',
      event.event_type?.name ? `Type: ${event.event_type.name}` : '',
    ].filter(Boolean).join('\\n\\n'));

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : '',
      locationStr ? `LOCATION:${escapeICalText(locationStr)}` : '',
      `STATUS:CONFIRMED`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  return lines.filter(Boolean).join('\r\n');
}

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function formatICalDateStr(dateStr: string): string {
  return dateStr.slice(0, 10).replace(/-/g, '');
}

function formatICalDateStrPlusOne(dateStr: string): string {
  const d = new Date(dateStr.slice(0, 10));
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function downloadICalFile(content: string, filename: string = 'bmx-events.ics'): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

