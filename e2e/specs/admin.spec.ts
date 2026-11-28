import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { makeEvent, makeEventType, futureDate } from '../fixtures/factories';
import type { Account, SessionUser } from '../fixtures/mock-supabase';

const race = makeEventType({ name: 'Race' });
const genkLocation = { id: 'loc-genk', name: 'Genk', city: 'Genk', address: null, country: 'BE', postal_code: null, maps_url: null };

const genk = makeEvent({ title: 'Genk Cup', location: 'Genk', date: futureDate(5), event_type: race, event_type_id: race.id });
const zolder = makeEvent({ title: 'Zolder Open', location: 'Zolder', date: futureDate(12), event_type: race, event_type_id: race.id });

const admin: SessionUser = { id: 'a1', email: 'admin@example.test', role: 'admin' };

const eventItem = (page: Page, title: string) => page.locator('.event-item').filter({ hasText: title });

test.describe('dashboard', () => {
  test('lists upcoming events grouped by year', async ({ page, backend }) => {
    // Fixed far-future dates so the two groups are two distinct years on any run date.
    const events = [
      makeEvent({ title: 'Early Cup', date: '2090-03-01', event_type: race, event_type_id: race.id }),
      makeEvent({ title: 'Spring Open', date: '2090-05-10', event_type: race, event_type_id: race.id }),
      makeEvent({ title: 'Next Year Finale', date: '2091-02-14', event_type: race, event_type_id: race.id }),
    ];
    await backend({ user: admin, tables: { events, event_types: [race] } });
    await page.goto('/admin');

    await expect(page.getByText(`Logged in as ${admin.email}`)).toBeVisible();
    const group = (year: string) => page.locator('.year-group').filter({ has: page.getByText(year, { exact: true }) });
    await expect(page.locator('.year-group')).toHaveCount(2);
    await expect(group('2090')).toContainText('2 events');
    await expect(group('2090').locator('.event-item')).toHaveCount(2);
    await expect(group('2091')).toContainText('1 event');
    await expect(group('2091').getByText('Next Year Finale')).toBeVisible();
    await expect(group('2090').getByText('Next Year Finale')).toHaveCount(0);
  });

  test('shows an empty state without events', async ({ page, backend }) => {
    await backend({ user: admin });
    await page.goto('/admin');

    await expect(page.getByText('No upcoming events found.')).toBeVisible();
  });
});

test.describe('deleting an event', () => {
  test('asks for confirmation, then deletes it', async ({ page, backend }) => {
    const mock = await backend({ user: admin, tables: { events: [genk, zolder], event_types: [race] } });
    await page.goto('/admin');

    await eventItem(page, 'Genk Cup').getByRole('button', { name: 'Delete' }).click();
    // Nothing is deleted before the confirmation.
    expect(mock.writes).toEqual([]);
    await eventItem(page, 'Genk Cup').getByRole('button', { name: 'Confirm?' }).click();

    await expect(page.getByText('Event "Genk Cup" has been deleted successfully.')).toBeVisible();
    await expect(eventItem(page, 'Genk Cup')).toHaveCount(0);
    await expect(eventItem(page, 'Zolder Open')).toBeVisible();
    expect(mock.writes).toContainEqual(
      expect.objectContaining({ method: 'DELETE', table: 'events', query: `?id=eq.${genk.id}` }),
    );
  });

  test('cancelling keeps the event', async ({ page, backend }) => {
    const mock = await backend({ user: admin, tables: { events: [genk], event_types: [race] } });
    await page.goto('/admin');

    await eventItem(page, 'Genk Cup').getByRole('button', { name: 'Delete' }).click();
    await eventItem(page, 'Genk Cup').getByRole('button', { name: 'Cancel' }).click();

    await expect(eventItem(page, 'Genk Cup').getByRole('button', { name: 'Delete' })).toBeVisible();
    expect(mock.writes).toEqual([]);
  });
});

test.describe('importing events from a file', () => {
  const csv = (rows: string[]) => ['title,date,location,event_type', ...rows].join('\n');

  async function uploadCsv(page: Page, content: string) {
    await page.getByText('Import Events from File').click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'events.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(content),
    });
  }

  test('imports a CSV through the edit and confirm steps', async ({ page, backend }) => {
    const date = futureDate(30);
    const mock = await backend({
      user: admin,
      tables: { events: [], event_types: [race], locations: [genkLocation] },
    });
    await page.goto('/admin');

    await uploadCsv(page, csv([`New Cup,${date},Genk,Race`]));
    await expect(page.getByText('Event 1 of 1')).toBeVisible();

    await page.getByRole('button', { name: 'Review & Confirm' }).click();
    await expect(page.getByRole('heading', { name: 'Confirm Import' })).toBeVisible();
    await page.getByRole('button', { name: 'Import Events' }).click();

    await expect(page.getByText('Successfully imported 1 events!')).toBeVisible();
    const insert = mock.writes.find((w) => w.table === 'events' && w.method === 'POST');
    expect(insert?.body).toEqual([
      expect.objectContaining({ title: 'New Cup', date, location_id: genkLocation.id, event_type_id: race.id }),
    ]);
    expect(mock.writes.some((w) => w.table === 'import_logs')).toBe(true);
  });

  test('walks through every event of a multi-row file', async ({ page, backend }) => {
    await backend({ user: admin, tables: { events: [], event_types: [race], locations: [genkLocation] } });
    await page.goto('/admin');

    await uploadCsv(page, csv([`First Cup,${futureDate(30)},Genk,Race`, `Second Cup,${futureDate(31)},Genk,Race`]));
    await expect(page.getByText('Event 1 of 2')).toBeVisible();

    await page.getByRole('button', { name: 'Next Event' }).click();
    await expect(page.getByText('Event 2 of 2')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Review & Confirm' })).toBeVisible();
  });

  test('the Confirm Import rows are readable and list details under the title', async ({ page, backend }) => {
    await backend({ user: admin, tables: { events: [], event_types: [race], locations: [genkLocation] } });
    await page.goto('/admin');

    await uploadCsv(page, csv([`First Cup,${futureDate(30)},Genk,Race`, `Second Cup,${futureDate(31)},Genk,Race`]));
    await page.getByRole('button', { name: 'Next Event' }).click();
    await page.getByRole('button', { name: 'Review & Confirm' }).click();
    await expect(page.getByRole('heading', { name: 'Confirm Import' })).toBeVisible();

    const rows = page.locator('.confirm-event-row');
    await expect(rows).toHaveCount(2);

    // Every text node in a row must reach WCAG AA (4.5:1) against the row background.
    const lowest = await rows.evaluateAll((els) => {
      const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const lum = ([r, g, b]: number[]) =>
        [r, g, b]
          .map((v) => v / 255)
          .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
          .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      const ratio = (a: string, b: string) => {
        const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p);
        return (x + 0.05) / (y + 0.05);
      };
      const results: { text: string; ratio: number }[] = [];
      for (const row of els) {
        const bg = getComputedStyle(row).backgroundColor;
        const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent?.trim();
          if (text) results.push({ text, ratio: ratio(getComputedStyle(node.parentElement!).color, bg) });
        }
      }
      return results.sort((a, b) => a.ratio - b.ratio)[0];
    });
    expect(lowest.ratio, `lowest contrast: "${lowest.text}"`).toBeGreaterThanOrEqual(4.5);

    // Title first, then the date, then one type/location line; Edit at the right edge.
    const first = rows.first();
    const box = async (text: string | RegExp) => (await first.getByText(text).first().boundingBox())!;
    const [row, title, date, details, edit] = await Promise.all([
      first.boundingBox().then((b) => b!),
      box('First Cup'),
      box(futureDate(30)),
      box(/Type:.*Location:/),
      box('Edit'),
    ]);
    expect(date.y).toBeGreaterThanOrEqual(title.y + title.height - 1);
    expect(details.y).toBeGreaterThanOrEqual(date.y + date.height - 1);
    expect(row.x + row.width - (edit.x + edit.width)).toBeLessThanOrEqual(32);
    await expect(first.getByText(/Type:.*Location:/)).toContainText('Genk');

    await rows.nth(1).click();
    await expect(page.getByText('Event 2 of 2')).toBeVisible();
  });

  test('a file without events is rejected', async ({ page, backend }) => {
    const mock = await backend({ user: admin, tables: { event_types: [race] } });
    await page.goto('/admin');

    await uploadCsv(page, csv([]));

    await expect(page.getByText('No events found in the file.')).toBeVisible();
    expect(mock.writes).toEqual([]);
  });

  test('cancelling discards the parsed file', async ({ page, backend }) => {
    const mock = await backend({ user: admin, tables: { events: [], event_types: [race], locations: [genkLocation] } });
    await page.goto('/admin');
    await uploadCsv(page, csv([`New Cup,${futureDate(30)},Genk,Race`]));
    await expect(page.getByText('Event 1 of 1')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText('Event 1 of 1')).toHaveCount(0);
    await expect(page.locator('input[type="file"]')).toBeAttached();
    expect(mock.writes).toEqual([]);
  });
});

test.describe('admin login', () => {
  const adminAccount: Account = { ...admin, password: 'admin-pass-1' };
  const rider: Account = { id: 'u1', email: 'rider@example.test', password: 'rider-pass-1', role: 'user' };

  async function signIn(page: Page, who: Account) {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(who.email);
    await page.getByLabel('Password').fill(who.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
  }

  test('a non-admin is denied and signed out again', async ({ page, backend }) => {
    const mock = await backend({ accounts: [adminAccount, rider] });

    await signIn(page, rider);

    await expect(page.getByText('Access denied. Admin privileges required.')).toBeVisible();
    expect(mock.calls.map((c) => c.path)).toContain('/auth/v1/logout');
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();
  });

  test('an admin gets access to the dashboard', async ({ page, backend }) => {
    await backend({ accounts: [adminAccount, rider] });

    await signIn(page, adminAccount);
    await expect(page.getByText('Access denied. Admin privileges required.')).toHaveCount(0);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Admin Dashboard' })).toBeVisible();
  });
});
