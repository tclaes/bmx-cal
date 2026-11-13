import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures/test';
import { PUBLIC_PAGES } from '../fixtures/pages';
import { makeEvent, makeEventType, futureDate } from '../fixtures/factories';

const race = makeEventType({ name: 'European Cup' });
const events = [
  makeEvent({ title: 'Genk Euro Race', date: futureDate(5), event_type: race, event_type_id: race.id }),
  makeEvent({ title: 'Zolder Worlds', date: futureDate(20), event_type: race, event_type_id: race.id }),
];

const PAGES = [{ path: '/', heading: 'BMX Events Calendar' }, { path: '/login', heading: 'Sign in' }, { path: '/register', heading: 'Create an account' }, ...PUBLIC_PAGES];

for (const { path, heading } of PAGES) {
  test(`${path} has no axe violations`, async ({ page, backend }) => {
    await backend({ tables: { events, event_types: [race] } });
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading }).first()).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(
      violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
    ).toEqual([]);
  });
}
