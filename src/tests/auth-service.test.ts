import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Team } from '../types';

const { mockGetUser, mockSignInWithPassword, mockSignOut, mockOnAuthStateChange, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignOut: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('../data/supabase', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  },
}));

import { AuthService } from '../shared/services/auth.service';

const team1: Team = { id: 'team-1', name: 'Team Alpha', created_at: '2026-01-01T00:00:00Z' };
const team2: Team = { id: 'team-2', name: 'Team Beta', created_at: '2026-01-01T00:00:00Z' };

function makeSelectChain(data: unknown[]) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data, error: null }),
    }),
  };
}

describe('AuthService.getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await AuthService.getCurrentUser();
    expect(result).toBeNull();
  });

  it('returns plain user role when no app_metadata role', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u@test.com', app_metadata: {} } },
    });
    mockFrom.mockReturnValue(makeSelectChain([]));

    const result = await AuthService.getCurrentUser();
    expect(result?.role).toBe('user');
    expect(result?.teams).toEqual([]);
    expect(result?.managedTeams).toEqual([]);
  });

  it('returns admin role from app_metadata', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u@test.com', app_metadata: { role: 'admin' } } },
    });
    mockFrom.mockReturnValue(makeSelectChain([]));

    const result = await AuthService.getCurrentUser();
    expect(result?.role).toBe('admin');
  });

  it('returns managedTeams from team_managers table', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u@test.com', app_metadata: {} } },
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return makeSelectChain([{ team: team1 }]);
      }
      return makeSelectChain([]);
    });

    const result = await AuthService.getCurrentUser();
    expect(result?.managedTeams).toEqual([team1]);
    expect(result?.teams).toEqual([team1]);
  });

  it('deduplicates teams that appear in both manager and member lists', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u@test.com', app_metadata: {} } },
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return makeSelectChain([{ team: team1 }]);
      }
      return makeSelectChain([{ team: team1 }]);
    });

    const result = await AuthService.getCurrentUser();
    expect(result?.teams).toHaveLength(1);
    expect(result?.teams?.[0].id).toBe(team1.id);
  });

  it('includes member teams in teams but not managedTeams', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u@test.com', app_metadata: {} } },
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return makeSelectChain([{ team: team1 }]);
      }
      return makeSelectChain([{ team: team2 }]);
    });

    const result = await AuthService.getCurrentUser();
    expect(result?.managedTeams).toEqual([team1]);
    expect(result?.teams).toHaveLength(2);
    expect(result?.teams?.map(t => t.id)).toContain(team2.id);
  });
});

describe('AuthService.isAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when not logged in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    expect(await AuthService.isAdmin()).toBe(false);
  });

  it('returns false for plain user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u@test.com', app_metadata: {} } },
    });
    mockFrom.mockReturnValue(makeSelectChain([]));
    expect(await AuthService.isAdmin()).toBe(false);
  });

  it('returns true for admin role', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u@test.com', app_metadata: { role: 'admin' } } },
    });
    mockFrom.mockReturnValue(makeSelectChain([]));
    expect(await AuthService.isAdmin()).toBe(true);
  });
});

describe('AuthService.isTeamManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when not logged in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    expect(await AuthService.isTeamManager()).toBe(false);
  });

  it('returns false for plain user with no teams', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u@test.com', app_metadata: {} } },
    });
    mockFrom.mockReturnValue(makeSelectChain([]));
    expect(await AuthService.isTeamManager()).toBe(false);
  });

  it('returns false for team member only (no managed teams)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u@test.com', app_metadata: {} } },
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return makeSelectChain([]);
      }
      return makeSelectChain([{ team: team1 }]);
    });

    expect(await AuthService.isTeamManager()).toBe(false);
  });

  it('returns true when user manages a team', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u@test.com', app_metadata: {} } },
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return makeSelectChain([{ team: team1 }]);
      }
      return makeSelectChain([]);
    });

    expect(await AuthService.isTeamManager()).toBe(true);
  });

  it('returns true for admin even without managed teams', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'u@test.com', app_metadata: { role: 'admin' } } },
    });
    mockFrom.mockReturnValue(makeSelectChain([]));
    expect(await AuthService.isTeamManager()).toBe(true);
  });
});
