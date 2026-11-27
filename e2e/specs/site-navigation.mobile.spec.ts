import { test, expect } from '../fixtures/test';
import { makeEvent, makeEventType, futureDate } from '../fixtures/factories';
import type { SessionUser } from '../fixtures/mock-supabase';

// Runs in the 375px "mobile" project only (see playwright.mock.config.ts).

const race = makeEventType({ name: 'Race' });
const events = Array.from({ length: 40 }, (_, i) =>
  makeEvent({ title: `Race ${i + 1}`, date: futureDate(i + 1), event_type: race, event_type_id: race.id }),
);
// Signed in as admin so the menu has every item and overflows a short screen.
const admin: SessionUser = { id: 'a1', email: 'admin@example.test', role: 'admin' };

test('the header and menu toggle stay pinned while scrolling', async ({ page, backend }) => {
  await backend({ tables: { events, event_types: [race] } });
  await page.goto('/');
  await expect(page.getByText('Race 40')).toBeAttached();

  await page.evaluate(() => window.scrollTo(0, 2000));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

  await expect(page.getByRole('banner')).toBeInViewport();
  expect((await page.getByRole('banner').boundingBox())?.y).toBe(0);
  await expect(page.getByRole('button', { name: 'Toggle menu' })).toBeInViewport();
});

test('the open menu scrolls on a short screen so its last item is reachable', async ({ page, backend }) => {
  await page.setViewportSize({ width: 375, height: 480 });
  await backend({ user: admin, tables: { events, event_types: [race] } });
  await page.goto('/');
  await expect(page.getByText('Race 40')).toBeAttached();
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

  await page.getByRole('button', { name: 'Toggle menu' }).click();
  const menu = page.locator('#mobile-menu');
  await expect(menu).toBeVisible();

  // The menu is capped to the viewport, so it overflows and scrolls on its own.
  const { scrollHeight, clientHeight, bottom } = await menu.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    bottom: el.getBoundingClientRect().bottom,
  }));
  expect(scrollHeight).toBeGreaterThan(clientHeight);
  expect(bottom).toBeLessThanOrEqual(480);

  const french = menu.getByRole('button', { name: 'FR' });
  await french.scrollIntoViewIfNeeded();
  await expect(french).toBeInViewport();
  await french.click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});
