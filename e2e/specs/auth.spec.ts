import { test, expect } from '../fixtures/test';
import type { Page } from '@playwright/test';
import { AUTH_STORAGE_KEY, type Account } from '../fixtures/mock-supabase';

const account: Account = {
  id: 'u1',
  email: 'rider@example.test',
  password: 'correct-horse',
  role: 'user',
};

test.describe('login', () => {
  test('valid credentials land on My Events', async ({ page, backend }) => {
    const mock = await backend({ accounts: [account] });
    await page.goto('/login');

    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password').fill(account.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/my-events$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Create my calendar' })).toBeVisible();
    expect(mock.calls).toContainEqual(
      expect.objectContaining({ path: '/auth/v1/token', body: expect.objectContaining({ email: account.email, password: account.password }) }),
    );
  });

  test('wrong password shows an error and stays on /login', async ({ page, backend }) => {
    await backend({ accounts: [account] });
    await page.goto('/login');

    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Incorrect email address or password.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('empty form is rejected without calling the backend', async ({ page, backend }) => {
    const mock = await backend({ accounts: [account] });
    await page.goto('/login');

    // Bypass native `required` validation so the app's own check runs.
    await page.locator('form').evaluate((f) => ((f as HTMLFormElement).noValidate = true));
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Please fill in all fields')).toBeVisible();
    expect(mock.calls.filter((c) => c.path === '/auth/v1/token')).toEqual([]);
  });
});

test.describe('register', () => {
  const fill = async (page: Page, email: string, pw: string, confirm: string) => {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(pw);
    await page.getByLabel('Confirm password').fill(confirm);
    await page.getByRole('button', { name: 'Create account' }).click();
  };

  test('new account is created and signed in', async ({ page, backend }) => {
    const mock = await backend();
    await page.goto('/register');

    await fill(page, 'new@example.test', 'long-enough-1', 'long-enough-1');

    await expect(page).toHaveURL(/\/my-events$/);
    expect(mock.calls.map((c) => c.path)).toEqual(
      expect.arrayContaining(['/auth/v1/signup', '/auth/v1/token']),
    );
  });

  test('mismatched passwords are rejected client-side', async ({ page, backend }) => {
    const mock = await backend();
    await page.goto('/register');

    await fill(page, 'new@example.test', 'long-enough-1', 'something-else');

    await expect(page.getByText('Passwords do not match')).toBeVisible();
    expect(mock.calls).toEqual([]);
  });

  test('short passwords are rejected client-side', async ({ page, backend }) => {
    const mock = await backend();
    await page.goto('/register');

    await fill(page, 'new@example.test', 'short', 'short');

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
    expect(mock.calls).toEqual([]);
  });

  test('an already registered email shows a failure', async ({ page, backend }) => {
    await backend({ accounts: [account] });
    await page.goto('/register');

    await fill(page, account.email, 'long-enough-1', 'long-enough-1');

    await expect(page.getByText('Registration failed')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });
});

test('signing out returns the visitor to signed-out navigation', async ({ page, backend }) => {
  const mock = await backend({ user: { id: 'u1', email: account.email, role: 'user' } });
  await page.goto('/');

  await page.getByRole('link', { name: 'Sign out' }).first().click();

  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
  expect(mock.calls.map((c) => c.path)).toContain('/auth/v1/logout');

  // The session must not come back after a reload: check the persisted session itself,
  // not just first paint, which shows signed-out navigation before any session is restored.
  await page.reload();
  expect(await page.evaluate((key) => localStorage.getItem(key), AUTH_STORAGE_KEY)).toBeNull();
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign out' })).toHaveCount(0);
});

test.describe('forgot password', () => {
  test('sends a reset request and confirms', async ({ page, backend }) => {
    const mock = await backend();
    await page.goto('/forgot-password');

    await page.getByLabel('Email').fill(account.email);
    await page.getByRole('button', { name: 'Send reset link' }).click();

    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
    expect(mock.calls).toContainEqual(
      expect.objectContaining({ path: '/functions/v1/send-password-reset', body: { email: account.email } }),
    );
  });
});

test.describe('reset password', () => {
  test('a valid recovery link allows setting a new password', async ({ page, backend }) => {
    const mock = await backend({ accounts: [account] });
    await page.goto('/reset-password?token_hash=valid-token&type=recovery');

    await page.getByLabel('New password', { exact: true }).fill('brand-new-pass');
    await page.getByLabel('Confirm new password').fill('brand-new-pass');
    await page.getByRole('button', { name: 'Update password' }).click();

    await expect(page.getByRole('heading', { name: 'Password updated!' })).toBeVisible();
    expect(mock.calls).toContainEqual(
      expect.objectContaining({ method: 'PUT', path: '/auth/v1/user', body: expect.objectContaining({ password: 'brand-new-pass' }) }),
    );
    expect(mock.calls.map((c) => c.path)).toContain('/auth/v1/logout');
  });

  test('an expired recovery link offers a new one', async ({ page, backend }) => {
    await backend();
    await page.goto('/reset-password?token_hash=old-token&type=recovery');

    await expect(page.getByText('This reset link has expired. Please request a new one.')).toBeVisible();
    await page.getByRole('button', { name: 'Request new link' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });

  test('a link without a token is invalid', async ({ page, backend }) => {
    await backend();
    await page.goto('/reset-password');

    await expect(page.getByText('Invalid or expired reset link.')).toBeVisible();
  });
});
