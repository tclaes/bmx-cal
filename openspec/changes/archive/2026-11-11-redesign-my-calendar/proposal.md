# Proposal

## Why

The "Create my calendar" page (`/my-events`, signed in and the signed-out demo) still looks like the old light theme next to the redesigned calendar. Race types use the database `color_code` (old Tailwind colours) instead of the Startlicht type labels, so the same race is blue (EC) on the calendar and red on "my calendar", and CW and EC are swapped. The demo page also keeps a light gradient card and white-on-cyan buttons that fail contrast.

## What Changes

- **Race type identity comes from the design tokens only.** Everywhere on these pages the type is shown with `TypeLabel` (code + stripe) or the token-coloured dot; `event_type.color_code` is no longer read for display. Unknown types get the neutral style.
- **Signed-in page** (`MyEventsPage`): rows become `RaceRow`s with the star as the selection control (same control as on the calendar), the "select all by type" buttons become type chips with count and fully / partly selected states, header actions and notification block restyled on tokens. Removes all `white` / `color-mix(... white)` remnants.
- **Signed-out demo** (`MyEventsDemoPage`): the preview list uses the same row anatomy (date column, `TypeLabel`, title, meta) so it previews what the real page looks like; the CTA card and buttons move to tokens (`--color-text-on-accent`, dark surface instead of the blue gradient).
- **`SaveCalendarModal` and `SavedCalendarsList`**: tokens only, no hex fallbacks; touch targets at least 44px.
- Type chip is extracted once (`TypeChip` in `src/libs/ui`) and reused by the calendar filters and this page.
- Out of scope: `color_code` column and admin/team-manager screens that still edit it, database migration, light theme, push-notification behaviour, selection logic.

## Capabilities

### New Capabilities
- `my-calendar`: the personal calendar pages: signed-out preview, signed-in event selection with select-by-type, saved calendars, export, and how race types are presented on them.

### Modified Capabilities
None. `design-system` (from `design-system-foundation`, not archived yet) is reused as is.

## Impact

- `src/features/my-events/*` (MyEventsPage, MyEventsDemoPage, SaveCalendarModal, SavedCalendarsList), new `src/libs/ui/TypeChip.svelte` (+ export), `src/features/calendar/EventFilters.svelte` (use `TypeChip`), `src/i18n/locales/{nl,fr,en}.ts` (only if labels are added).
- Tests: new tests for `TypeChip` and the page type presentation; existing tests must keep passing.
- Depends on `redesign-calendar-screens` (uses `RaceRow` save slot, `race-view` helpers, `/events/:id`); branch `feat/redesign-my-calendar` is based on it.
- No database, API or edge-function changes. Must pass the CI gate (tests, build, `npm run sheriff`).
