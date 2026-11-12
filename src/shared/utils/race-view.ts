import type { EventWithDetails } from '@types';
import { interpolate } from '../../i18n';
import type { Translations } from '../../i18n';
import {
  formatDayNumber,
  formatMonthShort,
  formatMonthLong,
  formatWeekday,
  formatDayMonth,
} from './date-format';
import type { RegistrationState } from './registration-state';
import { getRegistrationStatus } from './registration-status';

const LABEL_KEYS = {
  'Registration Open': 'open',
  'Registration Closed': 'closed',
  'Registration Opens Soon': 'opensSoon',
  'Register Now': 'registerNow',
} as const;

export interface RaceView {
  day: string;
  month: string;
  monthLong: string;
  weekday: string;
  /** "Zondag · Dessel" (parts that exist). */
  meta: string;
  locationLabel: string;
  status: { state: RegistrationState; label: string } | null;
  /** "Opent 20 mrt" while registration is not open yet, otherwise ''. */
  opensLabel: string;
  /** "Deadline 12 mrt" when a deadline exists, otherwise ''. */
  deadlineLabel: string;
  ongoing: boolean;
  href: string;
}

export function formatLocation(event: Pick<EventWithDetails, 'location' | 'location_details'>): string {
  const city = event.location_details?.city;
  if (city && !event.location.includes(city)) {
    return event.location ? `${event.location}, ${city}` : city;
  }
  return event.location ?? '';
}

export function isOngoing(event: Pick<EventWithDetails, 'date' | 'end_date'>, now: Date = new Date()): boolean {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = new Date(event.date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(event.end_date || event.date);
  end.setHours(23, 59, 59, 999);
  return today >= start && today <= end;
}

export function getRaceView(event: EventWithDetails, tr: Translations): RaceView {
  const raw = getRegistrationStatus(event);
  const status = raw
    ? { state: raw.state, label: tr.registration[LABEL_KEYS[raw.label as keyof typeof LABEL_KEYS] ?? 'registerNow'] }
    : null;

  const locationLabel = formatLocation(event);
  const weekday = formatWeekday(event.date);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return {
    day: formatDayNumber(event.date),
    month: formatMonthShort(event.date),
    monthLong: formatMonthLong(event.date),
    weekday,
    meta: [cap(weekday), locationLabel].filter(Boolean).join(' · '),
    locationLabel,
    status,
    opensLabel:
      raw?.state === 'soon' && event.registration_opens
        ? interpolate(tr.calendar.registrationOpensOn, { date: formatDayMonth(event.registration_opens) })
        : '',
    deadlineLabel: event.registration_deadline
      ? interpolate(tr.calendar.deadlineShort, { date: formatDayMonth(event.registration_deadline) })
      : '',
    ongoing: isOngoing(event),
    href: `/events/${event.id}`,
  };
}
