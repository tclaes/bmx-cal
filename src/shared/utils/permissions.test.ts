import { describe, it, expect } from 'vitest';
import { canAccessMyCalendar, canEditEvent } from './permissions';
import type { AdminUser, EventWithDetails, Team } from '../../types';

const team1: Team = { id: 'team-1', name: 'Team Alpha', created_at: '2026-01-01T00:00:00Z' };
const team2: Team = { id: 'team-2', name: 'Team Beta', created_at: '2026-01-01T00:00:00Z' };

function makeEvent(overrides: Partial<EventWithDetails> = {}): EventWithDetails {
  return {
    id: 'evt-1',
    title: 'Test Event',
    description: '',
    date: '2026-06-01',
    end_date: null,
    start_time: null,
    end_time: null,
    location: 'Somewhere',
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
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    event_type: null,
    location_details: null,
    ...overrides,
  };
}

function makeUser(overrides: Partial<AdminUser>): AdminUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    role: 'user',
    teams: [],
    managedTeams: [],
    ...overrides,
  };
}

describe('canAccessMyCalendar', () => {
  it('denies anonymous users', () => {
    expect(canAccessMyCalendar(null)).toBe(false);
  });

  it('allows any authenticated user (role: user)', () => {
    expect(canAccessMyCalendar(makeUser({ role: 'user' }))).toBe(true);
  });

  it('allows admin users', () => {
    expect(canAccessMyCalendar(makeUser({ role: 'admin' }))).toBe(true);
  });

  it('allows team managers', () => {
    expect(
      canAccessMyCalendar(makeUser({ role: 'user', managedTeams: [team1] })),
    ).toBe(true);
  });
});

describe('canEditEvent', () => {
  describe('unauthenticated (null user)', () => {
    it('returns false for public events', () => {
      expect(canEditEvent(makeEvent(), null)).toBe(false);
    });

    it('returns false for team events', () => {
      expect(canEditEvent(makeEvent({ team_id: 'team-1' }), null)).toBe(false);
    });
  });

  describe('plain user (no admin, no managed teams)', () => {
    const plainUser = makeUser({ role: 'user', teams: [], managedTeams: [] });

    it('cannot edit public events', () => {
      expect(canEditEvent(makeEvent(), plainUser)).toBe(false);
    });

    it('cannot edit team events even if member of that team', () => {
      const memberUser = makeUser({ role: 'user', teams: [team1], managedTeams: [] });
      expect(canEditEvent(makeEvent({ team_id: team1.id }), memberUser)).toBe(false);
    });

    it('cannot edit events from any team', () => {
      expect(canEditEvent(makeEvent({ team_id: team1.id }), plainUser)).toBe(false);
    });
  });

  describe('team manager (manages specific teams)', () => {
    const teamManager = makeUser({ role: 'user', teams: [team1], managedTeams: [team1] });

    it('can edit events belonging to their managed team', () => {
      expect(canEditEvent(makeEvent({ team_id: team1.id }), teamManager)).toBe(true);
    });

    it('cannot edit events belonging to a different team', () => {
      expect(canEditEvent(makeEvent({ team_id: team2.id }), teamManager)).toBe(false);
    });

    it('cannot edit public events (no team_id)', () => {
      expect(canEditEvent(makeEvent({ team_id: null }), teamManager)).toBe(false);
    });

    it('can edit when managing multiple teams - first team match', () => {
      const multiManager = makeUser({ role: 'user', teams: [team1, team2], managedTeams: [team1, team2] });
      expect(canEditEvent(makeEvent({ team_id: team1.id }), multiManager)).toBe(true);
    });

    it('can edit when managing multiple teams - second team match', () => {
      const multiManager = makeUser({ role: 'user', teams: [team1, team2], managedTeams: [team1, team2] });
      expect(canEditEvent(makeEvent({ team_id: team2.id }), multiManager)).toBe(true);
    });

    it('cannot edit events from a team they only member of (not manage)', () => {
      const memberNotManager = makeUser({ role: 'user', teams: [team1, team2], managedTeams: [team1] });
      expect(canEditEvent(makeEvent({ team_id: team2.id }), memberNotManager)).toBe(false);
    });
  });

  describe('admin user', () => {
    const adminUser = makeUser({ role: 'admin', teams: [], managedTeams: [] });

    it('can edit public events', () => {
      expect(canEditEvent(makeEvent(), adminUser)).toBe(true);
    });

    it('can edit events from any team', () => {
      expect(canEditEvent(makeEvent({ team_id: team1.id }), adminUser)).toBe(true);
    });

    it('can edit events even from teams they are not a member of', () => {
      expect(canEditEvent(makeEvent({ team_id: 'unknown-team' }), adminUser)).toBe(true);
    });
  });
});
