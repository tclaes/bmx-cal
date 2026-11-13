import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';

// The form's fields are not reachable by label, so they are addressed by type / position.
const fillForm = async (page: Page, { name, email, message }: { name: string; email: string; message: string }) => {
  await page.locator('input[type="text"]').first().fill(name);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('textarea').fill(message);
};
const send = (page: Page) => page.getByRole('button', { name: 'Send message' }).click();

test('sends the message to the contact function', async ({ page, backend }) => {
  const mock = await backend();
  await page.goto('/get-in-touch');

  await fillForm(page, { name: 'Sam Rider', email: 'sam@example.test', message: 'We would like team features.' });
  await send(page);

  await expect.poll(() => mock.calls.find((c) => c.path === '/functions/v1/send-contact-email')?.body).toEqual(
    expect.objectContaining({ name: 'Sam Rider', email: 'sam@example.test', message: 'We would like team features.' }),
  );
  await expect(page.getByText('Message sent!')).toBeVisible();
  await expect(page.getByText(/sam@example\.test/)).toBeVisible();
});

const complete = { name: 'Sam Rider', email: 'sam@example.test', message: 'Hello there.' };

for (const [missing, form] of [
  ['name', { ...complete, name: '' }],
  ['email', { ...complete, email: '' }],
  ['message', { ...complete, message: '' }],
  ['message (whitespace only)', { ...complete, message: '   ' }],
] as const) {
  test(`is rejected without a ${missing}`, async ({ page, backend }) => {
    const mock = await backend();
    await page.goto('/get-in-touch');

    // Bypass native `required` validation so the app's own check runs.
    await page.locator('form').evaluate((f) => ((f as HTMLFormElement).noValidate = true));
    await fillForm(page, form);
    await send(page);

    await expect(page.getByText('Please fill in all required fields.')).toBeVisible();
    expect(mock.calls.filter((c) => c.path === '/functions/v1/send-contact-email')).toEqual([]);
  });
}

test('shows an error when the message cannot be sent', async ({ page, backend }) => {
  await backend({ failingFunctions: ['send-contact-email'] });
  await page.goto('/get-in-touch');

  await fillForm(page, { name: 'Sam Rider', email: 'sam@example.test', message: 'Hello there.' });
  await send(page);

  await expect(page.getByText('Something went wrong. Please try again.')).toBeVisible();
});
