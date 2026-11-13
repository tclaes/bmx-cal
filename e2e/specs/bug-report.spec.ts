import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import type { SessionUser } from '../fixtures/mock-supabase';

const rider: SessionUser = { id: 'u1', email: 'rider@example.test', role: 'user' };

const describeBug = (page: Page, text: string) => page.getByLabel('Description').fill(text);
const submit = (page: Page) => page.getByRole('button', { name: /submit/i }).click();

test.describe('signed out', () => {
  test('submits a report with an email address', async ({ page, backend }) => {
    const mock = await backend();
    await page.goto('/report-bug');

    await describeBug(page, 'The calendar shows the wrong date on mobile.');
    await page.getByLabel('Your email').fill('visitor@example.test');
    await submit(page);

    await expect(page.getByRole('heading', { name: 'Report submitted' })).toBeVisible();
    expect(mock.writes).toContainEqual(
      expect.objectContaining({
        method: 'POST',
        table: 'bug_reports',
        body: expect.objectContaining({
          description: 'The calendar shows the wrong date on mobile.',
          reporter_email: 'visitor@example.test',
          user_id: null,
          screenshot_url: null,
        }),
      }),
    );
    // Anonymous reports have no session, so no GitHub issue is created.
    expect(mock.calls.filter((c) => c.path === '/functions/v1/create-github-issue')).toEqual([]);
  });

  test('requires a description', async ({ page, backend }) => {
    const mock = await backend();
    await page.goto('/report-bug');

    await page.getByLabel('Your email').fill('visitor@example.test');
    await submit(page);

    await expect(page.getByText('Please describe the bug before submitting.')).toBeVisible();
    expect(mock.writes).toEqual([]);
  });

  test('requires an email address', async ({ page, backend }) => {
    const mock = await backend();
    await page.goto('/report-bug');

    await describeBug(page, 'Something is broken.');
    await submit(page);

    await expect(page.getByText('Please provide your email so we can follow up if needed.')).toBeVisible();
    expect(mock.writes).toEqual([]);
  });

  test('rejects a screenshot that is not an image', async ({ page, backend }) => {
    const mock = await backend();
    await page.goto('/report-bug');

    await page.getByLabel('Screenshot').setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    });

    await expect(page.getByText('Only image files are allowed for screenshots.')).toBeVisible();
    expect(mock.writes).toEqual([]);
  });

  test('submitting another report resets the form', async ({ page, backend }) => {
    await backend();
    await page.goto('/report-bug');
    await describeBug(page, 'First problem.');
    await page.getByLabel('Your email').fill('visitor@example.test');
    await submit(page);

    await page.getByRole('button', { name: 'Submit another report' }).click();

    await expect(page.getByLabel('Description')).toHaveValue('');
    await expect(page.getByLabel('Your email')).toHaveValue('');
  });
});

test.describe('signed in', () => {
  test('uses the account email and files a GitHub issue', async ({ page, backend }) => {
    const mock = await backend({ user: rider });
    await page.goto('/report-bug');

    await expect(page.getByLabel('Your email')).toHaveCount(0);
    await describeBug(page, 'Export button does nothing.');
    await submit(page);

    await expect(page.getByRole('heading', { name: 'Report submitted' })).toBeVisible();
    expect(mock.writes).toContainEqual(
      expect.objectContaining({
        method: 'POST',
        table: 'bug_reports',
        body: expect.objectContaining({ reporter_email: rider.email, user_id: rider.id }),
      }),
    );
    expect(mock.calls).toContainEqual(expect.objectContaining({ method: 'POST', path: '/functions/v1/create-github-issue' }));
    // The issue link is stored back on the report.
    await expect.poll(() => mock.writes.find((w) => w.method === 'PATCH' && w.table === 'bug_reports')?.body).toEqual({
      github_issue_url: 'https://github.com/example/repo/issues/1',
    });
  });

  test('still succeeds when the GitHub issue cannot be created', async ({ page, backend }) => {
    await backend({ user: rider, failingFunctions: ['create-github-issue'] });
    await page.goto('/report-bug');

    await describeBug(page, 'Export button does nothing.');
    await submit(page);

    await expect(page.getByRole('heading', { name: 'Report submitted' })).toBeVisible();
  });
});
