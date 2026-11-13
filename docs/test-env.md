## Local test environment

A disposable local Supabase (real Auth, Postgres, RLS) with seeded users, so an agent or developer can run the app **already logged in** without touching production. For the short version, see the [README quick start](../README.md#run-it-locally).

### Prerequisites

Docker running. Everything else is installed by `npm ci` (Supabase CLI, Playwright, tsx).

### Commands

| Command | What it does |
|---------|--------------|
| `npm run test-env:start` | Starts the local stack, applies migrations + seed, creates the test users, writes `.env.e2e.local` |
| `npm run test-env:reset` | Resets the database to the seeded state and re-creates the users |
| `npm run test-env:stop` | Stops the stack and discards its data |
| `npm run test-env:login [-- role]` | Writes a fresh signed-in session per role to `e2e/.auth/<role>.json` (optionally prints a `localStorage` snippet for `role`) |
| `npm run dev:e2e` | Runs the app (port 5173) against the local stack |
| `npm run test:e2e` | Runs the Playwright smoke suite (starts the app itself, refreshes sessions first) |

### Test users

Password for all: `Test-password-123`.

| Role | Email | Notes |
|------|-------|-------|
| `user` | `user@test.local` | Regular user, member of "Test Team" |
| `manager` | `manager@test.local` | Manager of "Test Team" |
| `admin` | `admin@test.local` | `app_metadata.role = "admin"` |

### Getting a logged-in browser (agents)

1. `npm run test-env:start`, then `npm run dev:e2e`.
2. `npm run test-env:login -- admin`.
3. Playwright: use `storageState: 'e2e/.auth/admin.json'`. Any other browser tool: open `http://localhost:5173`, run the printed `localStorage.setItem(...)` line, reload.

Sessions expire after about an hour; re-run `test-env:login` to refresh.

### How it works

- `supabase/migrations` are copied into a throwaway project dir `.test-env/` (gitignored). Production history is never edited.
- `supabase/test-env/reference-data.sql` is injected there as an extra migration just before the first migration that references hand-created production rows (event types and locations, snapshot taken 2026-11-12, no personal data). Refresh it from production when those tables change.
- `supabase/test-env/seed.sql` adds a team and events with dates relative to today.
- Users are created via the Auth admin API (`scripts/test-env/seed-users.ts`). All scripts refuse any Supabase URL that is not localhost.
- No test back door exists in `src/`; login goes through the normal Supabase flow.

### Not available

- Edge functions (account deletion, push, bug reports, contact mail) are not served locally, so those flows fail.
- Password-reset mails land in Mailpit at `http://127.0.0.1:54324`.

### CI

`.github/workflows/e2e.yml` runs the same commands on pull requests and uploads the Playwright report on failure. It uses no repository secrets.
