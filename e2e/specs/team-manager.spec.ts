import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { makeEvent, makeEventType, futureDate } from '../fixtures/factories';
import type { SessionUser } from '../fixtures/mock-supabase';

const team = { id: 't1', name: 'Team One', created_at: '2025-01-01T00:00:00Z' };
const manager: SessionUser = { id: 'm1', email: 'manager@example.test', role: 'user', managedTeams: [team] };

const race = makeEventType({ name: 'Race' });
const teamType = makeEventType({ name: 'Team One Training', team_id: team.id });
const genk = { id: 'loc-genk', name: 'Genk', city: 'Genk', address: null, country: 'BE', postal_code: null, maps_url: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' };

const ownEvent = makeEvent({
  title: 'Team One Training',
  date: futureDate(7),
  location: 'Genk',
  location_id: genk.id,
  team_id: team.id,
  event_type: teamType,
  event_type_id: teamType.id,
});
const otherTeamEvent = makeEvent({ title: 'Other Team Day', date: futureDate(9), team_id: 't2' });
const publicEvent = makeEvent({ title: 'Public Cup', date: futureDate(11), team_id: null });

const tables = {
  events: [ownEvent, otherTeamEvent, publicEvent],
  event_types: [race, teamType],
  locations: [genk],
};

const eventRow = (page: Page, title: string) => page.locator('.event-row').filter({ hasText: title });

// The form's <Input label> fields have no id, so their labels are not associated with the
// inputs: address them by placeholder / type instead of by label.
const titleInput = (page: Page) => page.getByPlaceholder('Event title');
const dateInput = (page: Page) => page.locator('input[type="date"]').first();

async function openTeam(page: Page) {
  await page.goto('/team-manager');
  await page.locator('.team-summary').filter({ hasText: team.name }).click();
}

test('shows the manager their own team and its events only', async ({ page, backend }) => {
  await backend({ user: manager, tables });
  await openTeam(page);

  await expect(page.getByText('1 event', { exact: true })).toBeVisible();
  await expect(eventRow(page, 'Team One Training')).toBeVisible();
  await expect(page.getByText('Other Team Day')).toHaveCount(0);
  await expect(page.getByText('Public Cup')).toHaveCount(0);
});

test('creates an event for the team', async ({ page, backend }) => {
  const mock = await backend({ user: manager, tables });
  await page.goto('/team-manager');

  await page.getByRole('button', { name: '+ Add Event' }).click();
  await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();
  const date = futureDate(21);
  await titleInput(page).fill('Spring Training');
  await dateInput(page).fill(date);
  await page.getByLabel('Location').selectOption(genk.id);
  await page.getByRole('button', { name: 'Create Event' }).click();

  await expect(page.getByText('Event created successfully')).toBeVisible();
  const insert = mock.writes.find((w) => w.table === 'events' && w.method === 'POST');
  expect(insert?.body).toEqual(
    expect.objectContaining({
      title: 'Spring Training',
      date,
      team_id: team.id,
      event_type_id: teamType.id,
      location_id: genk.id,
      status: 'upcoming',
    }),
  );
});

test('a location is required', async ({ page, backend }) => {
  const mock = await backend({ user: manager, tables });
  await page.goto('/team-manager');

  await page.getByRole('button', { name: '+ Add Event' }).click();
  await titleInput(page).fill('No Location Day');
  await dateInput(page).fill(futureDate(21));
  await page.getByRole('button', { name: 'Create Event' }).click();

  // The browser's `required` validation blocks the submit.
  await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();
  expect(mock.writes.filter((w) => w.table === 'events')).toEqual([]);
});

test('edits an existing event', async ({ page, backend }) => {
  const mock = await backend({ user: manager, tables });
  await openTeam(page);

  await eventRow(page, 'Team One Training').getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible();
  await expect(titleInput(page)).toHaveValue('Team One Training');
  await titleInput(page).fill('Team One Race Prep');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await expect(page.getByText('Event updated successfully')).toBeVisible();
  await page.locator('.team-summary').filter({ hasText: team.name }).click();
  await expect(eventRow(page, 'Team One Race Prep')).toBeVisible();
  await expect(eventRow(page, 'Team One Training')).toHaveCount(0);
  expect(mock.writes).toContainEqual(
    expect.objectContaining({
      method: 'PATCH',
      table: 'events',
      query: expect.stringContaining(`id=eq.${ownEvent.id}`),
      body: expect.objectContaining({ title: 'Team One Race Prep', team_id: team.id }),
    }),
  );
});

test('deletes an event after confirmation', async ({ page, backend }) => {
  const mock = await backend({ user: manager, tables });
  await openTeam(page);

  await eventRow(page, 'Team One Training').getByRole('button', { name: 'Delete' }).click();
  expect(mock.writes).toEqual([]);
  await eventRow(page, 'Team One Training').getByRole('button', { name: 'Confirm?' }).click();

  await expect(page.getByText('"Team One Training" deleted')).toBeVisible();
  await expect(eventRow(page, 'Team One Training')).toHaveCount(0);
  expect(mock.writes).toContainEqual(
    expect.objectContaining({ method: 'DELETE', table: 'events', query: `?id=eq.${ownEvent.id}` }),
  );
});
