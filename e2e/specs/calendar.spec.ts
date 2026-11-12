import { test, expect } from '../fixtures/test';
import { makeEvent, makeEventType, futureDate } from '../fixtures/factories';

const race = makeEventType({ name: 'Race' });

test('home page lists upcoming events from the backend', async ({ page, backend }) => {
  await backend({
    tables: {
      events: [
        makeEvent({ title: 'Genk Cup', date: futureDate(5), event_type: race, event_type_id: race.id }),
        makeEvent({ title: 'Zolder Open', date: futureDate(12), event_type: race, event_type_id: race.id }),
      ],
      event_types: [race],
    },
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'BMX Events Calendar' })).toBeVisible();
  await expect(page.getByText('Genk Cup')).toBeVisible();
  await expect(page.getByText('Zolder Open')).toBeVisible();
});

test('shows the empty state when there are no events', async ({ page, backend }) => {
  await backend();
  await page.goto('/');
  await expect(page.getByText('No events found')).toBeVisible();
});
