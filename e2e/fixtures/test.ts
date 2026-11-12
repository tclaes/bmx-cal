import { test as base, expect } from '@playwright/test';
import { mockSupabase, type MockData, type SupabaseMock } from './mock-supabase';

interface Fixtures {
  /** Install the Supabase mock. Call before page.goto(). Unmocked requests fail the test. */
  backend: (data?: MockData) => Promise<SupabaseMock>;
}

export const test = base.extend<Fixtures>({
  backend: async ({ page }, use) => {
    let mock: SupabaseMock | undefined;
    await use(async (data) => (mock = await mockSupabase(page, data)));
    expect(mock?.unmocked ?? [], 'requests to Supabase with no mock').toEqual([]);
  },
});

export { expect };
