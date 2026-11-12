import { test, expect } from '../fixtures/test';

test('selected locale persists across reloads', async ({ page, backend }) => {
  await backend();
  await page.addInitScript(() => localStorage.setItem('bmx-locale', 'nl'));
  await page.goto('/');
  const nlTitle = await page.getByRole('heading', { level: 1 }).textContent();
  expect(nlTitle).not.toBe('BMX Events Calendar');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(nlTitle!);
});
