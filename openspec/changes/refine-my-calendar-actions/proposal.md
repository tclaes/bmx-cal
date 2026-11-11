# Proposal

## Why

The action block at the top of the signed-in personal calendar has uneven spacing (a full-width counter above buttons of different widths that wrap unpredictably), "Clear all" looks like an ordinary action next to "Save", and two buttons compete for attention. The notification block below it does not work at the moment, so it must not be visible until its own spec exists.

## What Changes

- **Selection bar:** the count ("23 selected") with a star and a quiet "Clear selection" text button on the same bar; clearing the selection belongs to the count, not to the actions.
- **Two actions of equal size below:** "Export (.ics)" as the single accent button, "Save calendar" outlined (signed-in only). Stacked full width on mobile, side by side on the right of the bar on desktop. Signed-out visitors see only the export button.
- **Clear with undo:** clearing shows a toast "23 events cleared" with "Undo" for 6 seconds instead of a confirmation dialog.
- **Notifications behind a feature flag:** a new `src/config/features.ts` exposes `notifications`, read from `VITE_FEATURE_NOTIFICATIONS` and off by default. When off, the block and its push handlers are not rendered or run. Translations and the edge function stay for the separate notifications spec.
- Out of scope: the notification feature itself, a sticky mobile action bar, a database-backed flag.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `my-calendar`: adds requirements for the selection bar and actions, clearing with undo, and the feature-flagged notification settings.

## Impact

- `src/features/my-events/MyEventsPage.svelte`, new `src/config/features.ts`, `src/i18n/locales/{nl,fr,en}.ts` and `types.ts` (new labels), `.env.example` / `docs/env.md` (flag documented).
- Tests for the bar, undo and the flag; existing `my-events-page` tests must keep passing.
- No database, API or edge function changes. Must pass the CI gate (tests, build, `npm run sheriff`); `config` may not depend on other modules (already enforced in `sheriff.config.ts`).
