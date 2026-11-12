import { test, expect } from '@playwright/test';
import { TEST_PASSWORD, TEST_USERS } from '../scripts/test-env/users';

const auth = (role: string) => `e2e/.auth/${role}.json`;

test.describe('regular user session', () => {
  test.use({ storageState: auth('user') });

  test('is logged in on the profile page', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('user@test.local').first()).toBeVisible();
  });

  test('cannot open the admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toHaveCount(0);
  });

  test('cannot open the team manager dashboard', async ({ page }) => {
    await page.goto('/team-manager');
    await expect(page.getByRole('heading', { name: 'Team Manager' })).toHaveCount(0);
  });
});

test.describe('team manager session', () => {
  test.use({ storageState: auth('manager') });

  test('reaches the team manager dashboard', async ({ page }) => {
    await page.goto('/team-manager');
    await expect(page.getByRole('heading', { name: 'Team Manager' })).toBeVisible();
  });
});

test.describe('admin session', () => {
  test.use({ storageState: auth('admin') });

  test('reaches the admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
  });
});

test.describe('login form', () => {
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:5173', localStorage: [{ name: 'bmx-locale', value: 'en' }] }] } });

  test('regular user can sign in with the seeded credentials', async ({ page }) => {
    const user = TEST_USERS.find((u) => u.role === 'user')!;
    await page.goto('/login');
    await page.locator('#email').fill(user.email);
    await page.locator('#password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/my-events/);
  });
});
