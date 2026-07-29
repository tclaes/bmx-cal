import { describe, it, expect } from 'vitest';
import { searchEvents } from '@shared/utils/event-search';
import type { EventWithDetails } from '@types';

const createMockEvent = (overrides?: Partial<EventWithDetails>): EventWithDetails => ({
  id: '1',
  title: 'Test Event',
  date: '2026-04-01',
  end_date: null,
  location: 'Test Track',
  description: 'Test description',
  start_time: null,
  end_time: null,
  registration_url: null,
  registration_deadline: null,
  registration_status: null,
  registration_opens: null,
  livestream_url: null,
  event_type_id: '1',
  location_id: '1',
  team_id: null,
  related_event_type_id: null,
  created_by: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  event_type: null,
  location_details: null,
  ...overrides,
});

describe('searchEvents', () => {
  it('should return all events when query is empty', () => {
    const events = [createMockEvent(), createMockEvent({ id: '2' })];
    const result = searchEvents(events, '');
    expect(result).toHaveLength(2);
  });

  it('should return all events when query is whitespace', () => {
    const events = [createMockEvent(), createMockEvent({ id: '2' })];
    const result = searchEvents(events, '   ');
    expect(result).toHaveLength(2);
  });

  it('should search by event title', () => {
    const events = [
      createMockEvent({ id: '1', title: 'Belgian Championship' }),
      createMockEvent({ id: '2', title: 'World Cup' }),
    ];
    const result = searchEvents(events, 'Belgian');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should search by location name', () => {
    const events = [
      createMockEvent({ id: '1', location: 'Track Zolder' }),
      createMockEvent({ id: '2', location: 'Track Dessel' }),
    ];
    const result = searchEvents(events, 'Zolder');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should search by description', () => {
    const events = [
      createMockEvent({ id: '1', description: 'Championship race for all ages' }),
      createMockEvent({ id: '2', description: 'International competition' }),
    ];
    const result = searchEvents(events, 'championship');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should search by city', () => {
    const events = [
      createMockEvent({
        id: '1',
        location: 'BMX Track',
        location_details: {
          id: '1',
          name: 'BMX Track',
          address: 'Street 1',
          city: 'Antwerp',
          postal_code: '2000',
          country: 'Belgium',
          maps_url: null,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      }),
      createMockEvent({
        id: '2',
        location: 'BMX Track',
        location_details: {
          id: '2',
          name: 'BMX Track',
          address: 'Street 2',
          city: 'Brussels',
          postal_code: '1000',
          country: 'Belgium',
          maps_url: null,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      }),
    ];
    const result = searchEvents(events, 'Antwerp');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should search by country', () => {
    const events = [
      createMockEvent({
        id: '1',
        location: 'BMX Track',
        location_details: {
          id: '1',
          name: 'BMX Track',
          address: 'Street 1',
          city: 'Paris',
          postal_code: '75001',
          country: 'France',
          maps_url: null,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      }),
      createMockEvent({
        id: '2',
        location: 'BMX Track',
        location_details: {
          id: '2',
          name: 'BMX Track',
          address: 'Street 2',
          city: 'Brussels',
          postal_code: '1000',
          country: 'Belgium',
          maps_url: null,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      }),
    ];
    const result = searchEvents(events, 'France');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should be case-insensitive', () => {
    const events = [
      createMockEvent({
        id: '1',
        location_details: {
          id: '1',
          name: 'BMX Track',
          address: 'Street 1',
          city: 'Antwerp',
          postal_code: '2000',
          country: 'Belgium',
          maps_url: null,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      }),
    ];
    const result = searchEvents(events, 'ANTWERP');
    expect(result).toHaveLength(1);
  });

  it('should handle partial matches', () => {
    const events = [
      createMockEvent({
        id: '1',
        location_details: {
          id: '1',
          name: 'BMX Track',
          address: 'Street 1',
          city: 'Antwerp',
          postal_code: '2000',
          country: 'Belgium',
          maps_url: null,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      }),
    ];
    const result = searchEvents(events, 'Ant');
    expect(result).toHaveLength(1);
  });

  it('should return empty array when no matches found', () => {
    const events = [
      createMockEvent({
        id: '1',
        title: 'Test Event',
        location: 'Test Location',
      }),
    ];
    const result = searchEvents(events, 'nonexistent');
    expect(result).toHaveLength(0);
  });

  it('should handle events without location details', () => {
    const events = [
      createMockEvent({
        id: '1',
        location: 'Test Track',
        location_details: null,
      }),
    ];
    const result = searchEvents(events, 'Test Track');
    expect(result).toHaveLength(1);
  });

  it('should handle multiple matches across different fields', () => {
    const events = [
      createMockEvent({
        id: '1',
        title: 'Belgium Championship',
        location: 'Track A',
      }),
      createMockEvent({
        id: '2',
        title: 'World Cup',
        location: 'Track Belgium',
      }),
      createMockEvent({
        id: '3',
        title: 'European Cup',
        location_details: {
          id: '3',
          name: 'Track C',
          address: 'Street 3',
          city: 'Brussels',
          postal_code: '1000',
          country: 'Belgium',
          maps_url: null,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      }),
    ];
    const result = searchEvents(events, 'Belgium');
    expect(result).toHaveLength(3);
  });
});
