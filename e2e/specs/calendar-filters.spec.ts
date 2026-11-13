import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { makeEvent, makeEventType, futureDate } from '../fixtures/factories';

const europeanCup = makeEventType({ name: 'European Cup' });
const worldCup = makeEventType({ name: 'World Cup' });

const events = [
  makeEvent({ title: 'Genk Euro Race', location: 'Genk', date: futureDate(5), event_type: europeanCup, event_type_id: europeanCup.id }),
  makeEvent({ title: 'Zolder Worlds', location: 'Zolder', date: futureDate(20), event_type: worldCup, event_type_id: worldCup.id }),
  makeEvent({ title: 'Heusden Euro Finale', location: 'Heusden', date: futureDate(40), event_type: europeanCup, event_type_id: europeanCup.id }),
  makeEvent({ title: 'Last Season Classic', location: 'Lommel', date: futureDate(-15), event_type: worldCup, event_type_id: worldCup.id }),
];

const filters = (page: Page) => page.getByRole('region', { name: 'Filters' });

async function openCalendar(page: Page, backend: (d?: object) => Promise<unknown>) {
  await backend({ tables: { events, event_types: [europeanCup, worldCup] } });
  await page.goto('/');
  // Filters are collapsed behind a toggle on narrow viewports and always open on desktop.
  const toggle = filters(page).getByRole('button', { name: 'Show filters' });
  if (await toggle.isVisible()) await toggle.click();
}

const visible = (page: Page, title: string) => page.getByText(title, { exact: true });

test('shows upcoming events and hides past ones by default', async ({ page, backend }) => {
  await openCalendar(page, backend);

  await expect(visible(page, 'Genk Euro Race')).toBeVisible();
  await expect(visible(page, 'Zolder Worlds')).toBeVisible();
  await expect(visible(page, 'Last Season Classic')).toHaveCount(0);
});

test('"Show past events" reveals past races', async ({ page, backend }) => {
  await openCalendar(page, backend);

  await filters(page).getByLabel('Show Past Events').check();

  await expect(visible(page, 'Last Season Classic')).toBeVisible();
});

test('filtering by race type narrows the list, ALL restores it', async ({ page, backend }) => {
  await openCalendar(page, backend);

  await filters(page).getByTitle('World Cup', { exact: true }).click();
  await expect(visible(page, 'Zolder Worlds')).toBeVisible();
  await expect(visible(page, 'Genk Euro Race')).toHaveCount(0);
  await expect(visible(page, 'Heusden Euro Finale')).toHaveCount(0);

  await filters(page).getByRole('button', { name: 'ALL' }).click();
  await expect(visible(page, 'Genk Euro Race')).toBeVisible();
  await expect(visible(page, 'Heusden Euro Finale')).toBeVisible();
});

test('search matches title and location', async ({ page, backend }) => {
  await openCalendar(page, backend);

  await filters(page).getByLabel('Search', { exact: true }).fill('zolder');

  await expect(visible(page, 'Zolder Worlds')).toBeVisible();
  await expect(visible(page, 'Genk Euro Race')).toHaveCount(0);
});

test('date range keeps only races inside it', async ({ page, backend }) => {
  await openCalendar(page, backend);

  await filters(page).getByLabel('Start Date').fill(futureDate(10));
  await filters(page).getByLabel('End Date').fill(futureDate(30));

  await expect(visible(page, 'Zolder Worlds')).toBeVisible();
  await expect(visible(page, 'Genk Euro Race')).toHaveCount(0);
  await expect(visible(page, 'Heusden Euro Finale')).toHaveCount(0);
});

test('reset filters clears every active filter', async ({ page, backend }) => {
  await openCalendar(page, backend);
  await filters(page).getByLabel('Search', { exact: true }).fill('zolder');
  await filters(page).getByTitle('World Cup', { exact: true }).click();

  await filters(page).getByRole('button', { name: 'Reset Filters' }).click();

  await expect(visible(page, 'Genk Euro Race')).toBeVisible();
  await expect(visible(page, 'Zolder Worlds')).toBeVisible();
  await expect(filters(page).getByLabel('Search', { exact: true })).toHaveValue('');
});

test('a search with no matches shows the empty state', async ({ page, backend }) => {
  await openCalendar(page, backend);

  await filters(page).getByLabel('Search', { exact: true }).fill('nowhere-at-all');

  await expect(page.getByText('No events found')).toBeVisible();
});
