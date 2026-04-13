import type { EventWithDetails } from '@types';

export interface RegistrationStatus {
  label: string;
  color: string;
}

export function getFridayBefore(dateStr: string): Date {
  const date = new Date(dateStr);
  const day = date.getDay();
  const daysUntilFriday = (day + 2) % 7;
  const friday = new Date(date);
  friday.setDate(date.getDate() - daysUntilFriday);
  friday.setHours(0, 0, 0, 0);
  return friday;
}

export function getRegistrationStatus(event: Pick<EventWithDetails, 'registration_url' | 'registration_status' | 'registration_deadline' | 'date'>): RegistrationStatus | null {
  if (!event.registration_url) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fridayBefore = getFridayBefore(event.date);
  if (today >= fridayBefore) {
    return null;
  }

  if (event.registration_deadline) {
    const deadline = new Date(event.registration_deadline);
    deadline.setHours(0, 0, 0, 0);
    if (deadline < today) {
      return { label: 'Registration Closed', color: '#6b7280' };
    }
  }

  if (event.registration_status === 'closed') {
    return { label: 'Registration Closed', color: '#6b7280' };
  } else if (event.registration_status === 'upcoming') {
    return { label: 'Registration Opens Soon', color: '#b45309' };
  } else if (event.registration_status === 'open') {
    return { label: 'Registration Open', color: '#047857' };
  }

  return { label: 'Register Now', color: '#1d4ed8' };
}
