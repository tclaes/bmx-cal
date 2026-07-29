import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { eventsStore } from '../shared/stores/events.store';
import type { EventType, Location } from '../types';

const eventType1: EventType = { id: 'et-1', name: 'Team Race', team_id: 'team-1' } as EventType;
const eventType2: EventType = { id: 'et-2', name: 'Public Race', team_id: null } as EventType;
const location1: Location = { id: 'loc-1', name: 'Track A', address: '123 Main St', maps_url: null } as Location;

describe('eventsStore', () => {
  beforeEach(() => {
    eventsStore.reset();
  });

  it('starts with empty eventTypes', () => {
    expect(get(eventsStore).eventTypes).toEqual([]);
  });

  it('starts with empty locations', () => {
    expect(get(eventsStore).locations).toEqual([]);
  });

  it('setEventTypes updates eventTypes', () => {
    eventsStore.setEventTypes([eventType1, eventType2]);
    expect(get(eventsStore).eventTypes).toEqual([eventType1, eventType2]);
  });

  it('setLocations updates locations', () => {
    eventsStore.setLocations([location1]);
    expect(get(eventsStore).locations).toEqual([location1]);
  });

  it('reset clears eventTypes after they were set', () => {
    eventsStore.setEventTypes([eventType1, eventType2]);
    expect(get(eventsStore).eventTypes).toHaveLength(2);

    eventsStore.reset();
    expect(get(eventsStore).eventTypes).toEqual([]);
  });

  it('reset clears locations after they were set', () => {
    eventsStore.setLocations([location1]);
    expect(get(eventsStore).locations).toHaveLength(1);

    eventsStore.reset();
    expect(get(eventsStore).locations).toEqual([]);
  });

  it('setEventTypes on logout (empty array) removes team event types from the store', () => {
    eventsStore.setEventTypes([eventType1, eventType2]);
    expect(get(eventsStore).eventTypes).toHaveLength(2);

    eventsStore.setEventTypes([eventType2]);
    const types = get(eventsStore).eventTypes;
    expect(types).toHaveLength(1);
    expect(types[0].id).toBe('et-2');
    expect(types.find(t => t.id === 'et-1')).toBeUndefined();
  });

  it('setEventTypes replaces all event types atomically', () => {
    eventsStore.setEventTypes([eventType1, eventType2]);
    eventsStore.setEventTypes([eventType2]);
    expect(get(eventsStore).eventTypes).not.toContainEqual(eventType1);
    expect(get(eventsStore).eventTypes).toContainEqual(eventType2);
  });
});
