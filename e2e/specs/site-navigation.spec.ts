import { test, expect } from '../fixtures/test';
import { makeEvent, makeEventType, futureDate } from '../fixtures/factories';

// Desktop: the header stays pinned while scrolling and nothing hides under it.

const race = makeEventType({ name: 'Race' });
// Enough races to make the calendar taller than the viewport.
const events = Array.from({ length: 40 }, (_, i) =>
  makeEvent({ title: `Race ${i + 1}`, date: futureDate(i + 1), event_type: race, event_type_id: race.id }),
);

test('the header stays pinned while scrolling the calendar', async ({ page, backend }) => {
  await backend({ tables: { events, event_types: [race] } });
  await page.goto('/');
  await expect(page.getByText('Race 40')).toBeVisible();

  await page.mouse.wheel(0, 2000);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

  const banner = page.getByRole('banner');
  await expect(banner).toBeInViewport();
  const box = await banner.boundingBox();
  expect(box?.y).toBe(0);
});

test('the calendar sidebar stays below the header', async ({ page, backend }) => {
  await backend({ tables: { events, event_types: [race] } });
  await page.goto('/');
  await expect(page.getByText('Race 40')).toBeVisible();

  await page.mouse.wheel(0, 2000);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

  const banner = await page.getByRole('banner').boundingBox();
  const sidebar = await page.getByRole('complementary', { name: 'Sidebar' }).boundingBox();
  expect(sidebar!.y).toBeGreaterThanOrEqual(banner!.y + banner!.height);
});

test('an in-page link brings its section to rest below the header', async ({ page, backend }) => {
  await backend();
  await page.goto('/guide');

  await page.getByRole('link', { name: 'Useful links' }).click();
  const heading = page.getByRole('heading', { level: 2, name: 'Useful links' });
  await expect(heading).toBeInViewport();

  const banner = await page.getByRole('banner').boundingBox();
  await expect
    .poll(async () => (await heading.boundingBox())!.y)
    .toBeGreaterThanOrEqual(banner!.y + banner!.height);
});
