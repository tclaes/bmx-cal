import { test, expect } from '../fixtures/test';
import { PUBLIC_PAGES } from '../fixtures/pages';
import { makeEvent, makeEventType, futureDate } from '../fixtures/factories';

// Runs in the 375px "mobile" project only (see playwright.mock.config.ts).

const race = makeEventType({ name: 'European Cup' });
const events = [
  makeEvent({ title: 'Genk Euro Race', date: futureDate(5), event_type: race, event_type_id: race.id }),
  makeEvent({ title: 'Zolder Worlds', date: futureDate(20), event_type: race, event_type_id: race.id }),
];

test('the calendar lists races and keeps filters behind a toggle', async ({ page, backend }) => {
  await backend({ tables: { events, event_types: [race] } });
  await page.goto('/');

  await expect(page.getByText('Genk Euro Race')).toBeVisible();
  const search = page.getByLabel('Search', { exact: true });
  await expect(search).toBeHidden();

  await page.getByRole('button', { name: 'Show filters' }).click();
  await expect(search).toBeVisible();
  await search.fill('zolder');
  await expect(page.getByText('Genk Euro Race')).toHaveCount(0);
  await expect(page.getByText('Zolder Worlds')).toBeVisible();
});

test('the hamburger menu opens, navigates and closes', async ({ page, backend }) => {
  await backend();
  await page.goto('/');

  const toggle = page.getByRole('button', { name: 'Toggle menu' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  await page.locator('#mobile-menu').getByRole('link', { name: 'News' }).click();

  await expect(page).toHaveURL(/\/news$/);
  await expect(page.getByRole('heading', { level: 1, name: 'News & Updates' })).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('Escape closes the menu', async ({ page, backend }) => {
  await backend();
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle menu' });
  await toggle.click();

  await page.keyboard.press('Escape');

  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

for (const { path, heading } of [{ path: '/', heading: 'BMX Events Calendar' }, { path: '/login', heading: 'Sign in' }, ...PUBLIC_PAGES]) {
  test(`${path} does not scroll sideways`, async ({ page, backend }) => {
    await backend({ tables: { events, event_types: [race] } });
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading }).first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

    expect(overflow).toBeLessThanOrEqual(0);
  });
}
