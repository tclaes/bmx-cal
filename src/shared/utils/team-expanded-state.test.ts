import { describe, it, expect } from 'vitest';
import { getInitialTeamExpandedState } from './permissions';
import { team1, team2, teams, makeUser } from '../../tests/fixtures';

describe('getInitialTeamExpandedState', () => {
  it('returns empty object for empty teams list', () => {
    const user = makeUser({ role: 'team_manager', managedTeams: [team1] });
    expect(getInitialTeamExpandedState([], user)).toEqual({});
  });

  it('returns all false for admin user', () => {
    const admin = makeUser({ role: 'admin', managedTeams: [] });
    expect(getInitialTeamExpandedState(teams, admin)).toEqual({
      'team-1': false,
      'team-2': false,
    });
  });

  it('returns all false for admin who also manages teams', () => {
    const adminManager = makeUser({ role: 'admin', managedTeams: [team1] });
    expect(getInitialTeamExpandedState(teams, adminManager)).toEqual({
      'team-1': false,
      'team-2': false,
    });
  });

  it('returns all true for team manager without admin role', () => {
    const manager = makeUser({ role: 'user', managedTeams: [team1] });
    expect(getInitialTeamExpandedState(teams, manager)).toEqual({
      'team-1': true,
      'team-2': true,
    });
  });

  it('returns all true for team manager managing multiple teams', () => {
    const manager = makeUser({ role: 'user', managedTeams: [team1, team2] });
    expect(getInitialTeamExpandedState(teams, manager)).toEqual({
      'team-1': true,
      'team-2': true,
    });
  });

  it('returns all false for plain user with no managed teams', () => {
    const plainUser = makeUser({ role: 'user', managedTeams: [] });
    expect(getInitialTeamExpandedState(teams, plainUser)).toEqual({
      'team-1': false,
      'team-2': false,
    });
  });

  it('returns all false for null user', () => {
    expect(getInitialTeamExpandedState(teams, null)).toEqual({
      'team-1': false,
      'team-2': false,
    });
  });
});
