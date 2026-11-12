export type Role = 'user' | 'manager' | 'admin';

export const TEST_PASSWORD = 'Test-password-123';
export const TEST_TEAM_ID = '00000000-0000-4000-8000-0000000000a1';

export interface TestUser {
  role: Role;
  email: string;
  appRole?: 'admin';
  managesTeam?: boolean;
}

export const TEST_USERS: TestUser[] = [
  { role: 'user', email: 'user@test.local' },
  { role: 'manager', email: 'manager@test.local', managesTeam: true },
  { role: 'admin', email: 'admin@test.local', appRole: 'admin' },
];
