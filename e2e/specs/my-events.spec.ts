import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { makeEvent, makeEventType, futureDate } from '../fixtures/factories';
import type { SessionUser } from '../fixtures/mock-supabase';

const europeanCup = makeEventType({ name: 'European Cup' });
const worldCup = makeEventType({ name: 'World Cup' });

const genk = makeEvent({ title: 'Genk Euro Race', date: futureDate(5), event_type: europeanCup, event_type_id: europeanCup.id });
const zolder = makeEvent({ title: 'Zolder Worlds', date: futureDate(20), event_type: worldCup, event_type_id: worldCup.id });
const heusden = makeEvent({ title: 'Heusden Euro Finale', date: futureDate(40), event_type: europeanCup, event_type_id: europeanCup.id });

const tables = { events: [genk, zolder, heusden], event_types: [europeanCup, worldCup] };
const rider: SessionUser = { id: 'u1', email: 'rider@example.test', role: 'user' };

const row = (page: Page, title: string) => page.getByRole('article').filter({ hasText: title });
const toggleSave = (page: Page, title: string) =>
  row(page, title).getByRole('button', { name: /^(Save race|Saved)$/ }).click();

test.describe('signed out', () => {
  test('selecting races keeps them across a reload and asks for an account to export', async ({ page, backend }) => {
    await backend({ tables });
    await page.goto('/my-events');

    await toggleSave(page, 'Genk Euro Race');
    await toggleSave(page, 'Zolder Worlds');

    await expect(page.getByText('2 selected')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create an account to export' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export to Calendar (.ics)' })).toHaveCount(0);

    await page.reload();
    await expect(page.getByText('2 selected')).toBeVisible();
  });
});

test.describe('signed in', () => {
  test('selecting a race stores it for the account', async ({ page, backend }) => {
    const mock = await backend({ tables, user: rider });
    await page.goto('/my-events');

    await toggleSave(page, 'Genk Euro Race');

    await expect(page.getByText('1 selected')).toBeVisible();
    expect(mock.writes).toContainEqual(
      expect.objectContaining({ method: 'POST', table: 'user_event_selections', body: { user_id: rider.id, event_id: genk.id } }),
    );
  });

  test('export downloads an .ics with exactly the selected races', async ({ page, backend }) => {
    await backend({ tables, user: rider });
    await page.goto('/my-events');
    await toggleSave(page, 'Genk Euro Race');
    await toggleSave(page, 'Heusden Euro Finale');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export to Calendar (.ics)' }).click();
    const file = await download;

    expect(file.suggestedFilename()).toBe('bmx-events.ics');
    const ics = await readFile((await file.path())!, 'utf8');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:Genk Euro Race');
    expect(ics).toContain('SUMMARY:Heusden Euro Finale');
    expect(ics).not.toContain('Zolder Worlds');
  });

  test('a type chip selects every race of that type', async ({ page, backend }) => {
    await backend({ tables, user: rider });
    await page.goto('/my-events');

    await page.getByTitle('Select European Cup (2)').click();

    await expect(page.getByText('2 selected')).toBeVisible();
    await expect(row(page, 'Genk Euro Race').getByRole('button', { name: 'Saved' })).toBeVisible();
    await expect(row(page, 'Zolder Worlds').getByRole('button', { name: 'Save race' })).toBeVisible();
  });

  test('clearing the selection can be undone', async ({ page, backend }) => {
    await backend({ tables, user: rider });
    await page.goto('/my-events');
    await toggleSave(page, 'Genk Euro Race');
    await toggleSave(page, 'Zolder Worlds');

    await page.getByRole('button', { name: 'Clear selection' }).click();
    await expect(page.getByText('2 events cleared')).toBeVisible();
    await expect(page.getByText('2 selected')).toHaveCount(0);

    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText('2 selected')).toBeVisible();
  });

  test('saving a calendar writes the calendar and its races', async ({ page, backend }) => {
    const mock = await backend({ tables, user: rider });
    await page.goto('/my-events');
    await toggleSave(page, 'Genk Euro Race');
    await toggleSave(page, 'Zolder Worlds');

    await page.getByRole('button', { name: 'Save calendar' }).click();
    await page.getByLabel('Calendar name').fill('My 2026 season');
    await page.getByRole('dialog').getByRole('button', { name: 'Save calendar' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(mock.writes).toContainEqual(
      expect.objectContaining({ table: 'user_calendars', body: { user_id: rider.id, name: 'My 2026 season' } }),
    );
    const calendarEvents = mock.writes.find((w) => w.table === 'user_calendar_events');
    expect((calendarEvents?.body as { event_id: string }[]).map((r) => r.event_id).sort()).toEqual(
      [genk.id, zolder.id].sort(),
    );
  });

  test('saving without a name is rejected', async ({ page, backend }) => {
    const mock = await backend({ tables, user: rider });
    await page.goto('/my-events');
    await toggleSave(page, 'Genk Euro Race');

    await page.getByRole('button', { name: 'Save calendar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Save calendar' }).click();

    // The browser's `required` validation blocks the submit; the modal stays open.
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Calendar name')).toHaveJSProperty('validity.valueMissing', true);
    expect(mock.writes.filter((w) => w.table === 'user_calendars')).toEqual([]);
  });
});
