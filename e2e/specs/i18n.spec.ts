import { test, expect } from '../fixtures/test';

test('selected locale persists across reloads', async ({ page, backend }) => {
  await backend();
  await page.goto('/');
  const title = page.getByRole('heading', { level: 1 });
  await expect(title).toHaveText('BMX Events Calendar');

  await page.getByRole('combobox', { name: 'Language' }).selectOption('nl');
  await expect(title).toHaveText('BMX Evenementenkalender');

  await page.reload();
  await expect(title).toHaveText('BMX Evenementenkalender');
});
