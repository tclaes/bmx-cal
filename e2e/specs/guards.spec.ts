import { test, expect } from '../fixtures/test';
import type { SessionUser } from '../fixtures/mock-supabase';

const user: SessionUser = { id: 'u1', email: 'user@example.test', role: 'user' };
const admin: SessionUser = { id: 'a1', email: 'admin@example.test', role: 'admin' };
const manager: SessionUser = {
  id: 'm1',
  email: 'manager@example.test',
  role: 'user',
  managedTeams: [{ id: 't1', name: 'Team One' }],
};

// Fallback screens: LoginPage ("Sign in") for most routes, admin Login ("Admin Login") for /admin.
const signInHeading = (page: import('@playwright/test').Page) =>
  page.getByRole('heading', { name: /^(Sign in|Admin Login)$/ });

test.describe('anonymous visitor', () => {
  for (const path of ['/profile', '/team-manager', '/admin']) {
    test(`${path} falls back to a login screen`, async ({ page, backend }) => {
      await backend();
      await page.goto(path);
      await expect(signInHeading(page)).toBeVisible();
    });
  }
});

test.describe('signed-in user without elevated role', () => {
  test('can open /profile', async ({ page, backend }) => {
    await backend({ user });
    await page.goto('/profile');
    await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible();
    await expect(signInHeading(page)).toBeHidden();
  });

  test('is kept out of /admin and /team-manager', async ({ page, backend }) => {
    await backend({ user });
    await page.goto('/admin');
    await expect(signInHeading(page)).toBeVisible();
    await page.goto('/team-manager');
    await expect(signInHeading(page)).toBeVisible();
  });
});

test('team manager can open /team-manager but not /admin', async ({ page, backend }) => {
  await backend({ user: manager });
  await page.goto('/team-manager');
  await expect(page.getByRole('heading', { level: 1, name: 'Team Manager' })).toBeVisible();
  await page.goto('/admin');
  await expect(signInHeading(page)).toBeVisible();
});

test('admin can open /admin', async ({ page, backend }) => {
  await backend({ user: admin });
  await page.goto('/admin');
  await expect(page.getByRole('heading', { level: 1, name: 'Admin Dashboard' })).toBeVisible();
});
