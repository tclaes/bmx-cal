# Proposal

## Why

`npm run dev` reads `.env`, i.e. the real Supabase project, while the disposable local stack (seeded users, real Auth and RLS) is only reachable through `npm run dev:e2e`. Developers and agents reach for `npm run dev` first, so they either get a blank app (no `.env`) or work against production data. The local stack should be the default way to run the app.

## What Changes

- `npm run dev` always runs the app against the local test stack (Vite mode `e2e`, port 5173), instead of `.env`.
- `npm run dev` checks first that the stack env file `.env.e2e.local` exists and points at localhost, and otherwise stops with a message to run `npm run test-env:start`. It never falls back to the production values in `.env`.
- New `npm run dev:remote` keeps the old behaviour (plain `vite`, values from `.env`) for the rare case of running against the real project.
- `dev:e2e` stays as an alias so existing docs, scripts and Playwright config keep working.
- `playwright.mock.config.ts` switches from `npm run dev` to `npm run dev:remote`, because it injects dummy Supabase env and has no local stack.
- README, `docs/test-env.md` and `.env.example` comments describe the new meaning of `dev`.
- **BREAKING**: `npm run dev` no longer talks to the Supabase project in `.env`; use `npm run dev:remote`.

## Capabilities

### New Capabilities
- `local-dev-environment`: how the app is run for development, which backend each dev command targets, and the guard against silently hitting production.

### Modified Capabilities

## Impact

- `package.json` scripts, a new small guard script under `scripts/test-env/`, `playwright.mock.config.ts`.
- `README.md`, `docs/test-env.md`, `.env.example`.
- No change to `src/`, the database, edge functions or CI workflow files (the e2e workflow calls `dev:e2e` via Playwright, which keeps working).
- Out of scope: serving edge functions locally, changing the test users or seed data.
