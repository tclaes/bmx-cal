import type { EventType, EventWithDetails } from '../../src/types';

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

export function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

export function makeEventType(overrides: Partial<EventType> = {}): EventType {
  return {
    id: nextId('type'),
    name: 'Race',
    color_code: '#d33',
    team_id: null,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<EventWithDetails> = {}): EventWithDetails {
  return {
    id: nextId('event'),
    title: 'Test Race',
    description: '',
    date: futureDate(7),
    end_date: null,
    start_time: null,
    end_time: null,
    location: 'Genk',
    location_id: null,
    event_type_id: null,
    related_event_type_id: null,
    status: 'upcoming',
    registration_url: null,
    registration_opens: null,
    registration_deadline: null,
    registration_status: null,
    livestream_url: null,
    team_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    event_type: null,
    location_details: null,
    ...overrides,
  };
}
