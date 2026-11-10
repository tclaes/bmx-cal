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
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Brussels',
    'BEGIN:STANDARD',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
  ];

  for (const event of events) {
    const uid = `${event.id}@bmx-events.local`;
    const dtstamp = formatICalDate(new Date());
    const summary = escapeICalText(event.title);
    const locationStr = buildLocationString(event);
    const description = escapeICalText([
      event.description || '',
      event.event_type?.name ? `Type: ${event.event_type.name}` : '',
    ].filter(Boolean).join('\\n\\n'));

    let dtStartLine: string;
    let dtEndLine: string;

    if (event.start_time) {
      const endDate = event.end_date || event.date;
      const endTime = event.end_time || event.start_time;
      dtStartLine = `DTSTART;TZID=Europe/Brussels:${formatICalDateTime(event.date, event.start_time)}`;
      dtEndLine = `DTEND;TZID=Europe/Brussels:${formatICalDateTime(endDate, endTime)}`;
    } else {
      const dtstart = formatICalDateStr(event.date);
      const dtend = event.end_date
        ? formatICalDateStrPlusOne(event.end_date)
        : formatICalDateStrPlusOne(event.date);
      dtStartLine = `DTSTART;VALUE=DATE:${dtstart}`;
      dtEndLine = `DTEND;VALUE=DATE:${dtend}`;
    }

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      dtStartLine,
      dtEndLine,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : '',
      locationStr ? `LOCATION:${escapeICalText(locationStr)}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  return lines.filter(Boolean).join('\r\n');
}

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function formatICalDateTime(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.slice(0, 10).split('-');
  const [hour, minute] = timeStr.slice(0, 5).split(':');
  return `${year}${month}${day}T${hour}${minute}00`;
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

