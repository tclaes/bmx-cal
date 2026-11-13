import { defineConfig, devices } from '@playwright/test';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './e2e/fixtures/env';

const PORT = 4173;

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Never attach to an existing server: it would not have the dummy Supabase env.
    reuseExistingServer: false,
    timeout: 60_000,
    // Dummy values: the app needs them to boot, and every request to this origin is mocked.
    env: {
      VITE_SUPABASE_URL: SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
      VITE_GA_MEASUREMENT_ID: '',
    },
  },
});
