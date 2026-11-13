# Proposal

## Why

The action block at the top of the personal calendar has uneven spacing (a full-width counter above buttons of different widths that wrap unpredictably), "Clear all" looks like an ordinary action next to "Save", and two buttons compete for attention. Signed-out visitors never see the real list or their own selection on `/my-events`, only a demo page, although they can already select races on the calendar. The notification block does not work at the moment and must be switchable by an admin until its own spec exists.

## What Changes

- **Selection bar:** count with a star and a quiet "Clear selection" text button on one bar; two actions of equal size below (accent "Export (.ics)", outlined "Save calendar"), stacked on mobile and side by side on desktop.
- **Clear with undo:** a toast "23 events cleared" with "Undo" for 6 seconds instead of a confirmation dialog.
- **`/my-events` opens for signed-out visitors:** they see the real list and their local selection with the selection bar (count and clear). Export and save are not available to them: an accent "Create an account to export" action (and a sign-in link) takes their place.
- **BREAKING (UI): the signed-out demo page is removed** (`MyEventsDemoPage`, its sample data and the `myEventsDemo` texts). Its sign-up message moves into the account action. The route keeps its title and description.
- **Feature flags in the database, editable by admins:** a `feature_flags` table (public read, admin write), a `FeatureFlagService` and store that fail closed, and a "Feature flags" section on the admin dashboard with a toggle per flag. First flag: `notifications`, off by default. While off, the notification block is not shown and no push calls are made from the page.
- Out of scope: the notification feature itself (its own spec), a sticky mobile action bar, per-user or percentage rollouts.

## Capabilities

### New Capabilities
- `feature-flags`: named on/off switches stored in the database, readable by everyone, changeable by admins, off when missing or unreadable.

### Modified Capabilities
- `my-calendar`: selection bar and actions, clear with undo, open to signed-out visitors with export and save requiring an account, notification block behind the `notifications` flag; the signed-out preview requirement is removed.

## Impact

- `src/features/my-events/*` (MyEventsPage; MyEventsDemoPage and `my-events-demo.test.ts` removed), `src/router/routes.ts` (no access rule, no fallback), `src/features/admin/AdminDashboard.svelte` (flags section), new `src/libs/core/services/feature-flag.service.ts` and `src/libs/core/stores/feature-flags.store.ts`, new migrations `supabase/migrations/20261113120000_create_feature_flags.sql` and `20261113120100_harden_feature_flags_grants.sql` (the second revokes `TRUNCATE`, `REFERENCES` and `TRIGGER` that Supabase's default grants give `authenticated`; `TRUNCATE` bypasses RLS), `docs/db.md`, `docs/features.md`, `src/i18n/locales/{nl,fr,en}.ts` and `types.ts`.
- Database: one new table with RLS and a follow-up grants migration; applied through the Supabase MCP `apply_migration` tool as documented in `docs/db.md`.
- Tests for the bar, undo, signed-out actions, the flag store (fail closed) and the admin toggle; `my-events-demo.test.ts` is deleted. Must pass the CI gate (tests, build, `npm run sheriff`).
