# Proposal

## Why

The admin dashboard groups races per year with `groupEventsByYear` (`src/features/admin/event-grouping.ts`), which reads the year with `new Date(evt.date).getFullYear()` (GitHub issue #53). A `YYYY-MM-DD` string is parsed as midnight UTC, so for an admin in a time zone behind UTC, a race on 1 January is shown under the previous year: with `TZ=America/New_York`, `2026-01-01` gives 2025. The calendar's previous-races section (`groupPastByYear` in `src/features/calendar/visible-events.ts`) already reads the year from the string, so the two screens can disagree about the same race.

## What Changes

- New helper `yearOf(date: string): number` in `src/shared/utils/date-format.ts`, exported from `@shared/utils`. It reads the year from the `YYYY-MM-DD` string, so it doesn't depend on the viewer's time zone.
- `groupEventsByYear` (admin) uses it, which fixes the bug.
- `groupPastByYear` (calendar) uses it too, so both screens share one rule. Its behaviour doesn't change.
- Regression tests pin a time zone behind UTC, and one ahead of it.

Out of scope: other `new Date('YYYY-MM-DD')` uses for day, month or weekday formatting; the admin group order; which years open by default.

## Capabilities

### New Capabilities
- `admin-event-list`: how admins see all races in the admin dashboard, grouped per year.

### Modified Capabilities

(none; `calendar-overview` already groups past races by the year in the date, and keeps doing so)

## Impact

- `src/shared/utils/date-format.ts`, `src/shared/utils/index.ts`
- `src/features/admin/event-grouping.ts`, `src/features/calendar/visible-events.ts`
- `src/tests/event-grouping.test.ts`, plus `yearOf` tests in a date-format test file
- No API, data or dependency changes
