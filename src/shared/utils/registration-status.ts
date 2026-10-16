import type { EventWithDetails } from '@types';

export interface RegistrationStatus {
  label: string;
  color: string;
}

const STATUS = {
  closed: { label: 'Registration Closed', color: '#6b7280' },
  opensSoon: { label: 'Registration Opens Soon', color: '#b45309' },
  open: { label: 'Registration Open', color: '#047857' },
  registerNow: { label: 'Register Now', color: '#1d4ed8' },
} as const;

function parseLocalDate(dateStr: string): Date {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
  }
  return new Date(dateStr);
}

export function getFridayBefore(dateStr: string): Date {
  const date = parseLocalDate(dateStr);
  const daysSinceFriday = (date.getDay() + 2) % 7;
  const friday = new Date(date);
  friday.setDate(date.getDate() - daysSinceFriday);
  friday.setHours(0, 0, 0, 0);
  return friday;
}

export function getRegistrationStatus(event: Pick<EventWithDetails, 'registration_url' | 'registration_status' | 'registration_deadline' | 'registration_opens' | 'date'>): RegistrationStatus | null {
  if (!event.registration_url) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today >= getFridayBefore(event.date)) return null;

  if (event.registration_deadline) {
    const deadline = parseLocalDate(event.registration_deadline);
    deadline.setHours(0, 0, 0, 0);
    if (deadline < today) return STATUS.closed;
  }

  if (event.registration_opens) {
    const opens = parseLocalDate(event.registration_opens);
    opens.setHours(0, 0, 0, 0);
    if (opens > today) return STATUS.opensSoon;
    return event.registration_status === 'closed' ? STATUS.closed : STATUS.open;
  }

  if (event.registration_status === 'closed') return STATUS.closed;
  if (event.registration_status === 'upcoming') return STATUS.opensSoon;
  if (event.registration_status === 'open') return STATUS.open;

  return STATUS.registerNow;
}
