# Proposal

## Why

Turning on "show past events" in the calendar seems to do nothing (issue #51). The filter works, but since def5661 `splitHero` appends past races after every upcoming race, with no heading, so with a full season ahead they only show up far down the list and look like upcoming races. Riders who want to look back at last season's races cannot find them.

## What Changes

- When "show past events" is on, past races appear in their own section below the upcoming races, under a "Previous races" heading.
- Past races are grouped per calendar year, each with a year heading and that year's race count. Years go newest first; within a year races go most recent first.
- The count next to the upcoming list ("Next up" / "Daarna") counts upcoming races only.
- When the filters match only past races, the page shows the previous-races section instead of the empty state.
- One new user-facing string, the section heading, is added in nl, fr and en; the year counts reuse the existing `raceCount` / `raceCountOne` strings.
- Out of scope: the export (it keeps exporting all visible races), collapsible years or pagination, and how events are fetched.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `calendar-overview`: the "Show past events" scenario and the "No upcoming race" / "No results" behaviour change, the race count of the timeline list covers upcoming races only, and a new requirement describes the previous-races section grouped per year.

## Impact

- `src/features/calendar/visible-events.ts`: `splitHero` / `calendarSplit` return upcoming races and past races grouped per year instead of one combined `rest` list.
- `src/features/calendar/EventList.svelte`: renders the previous-races section, year headings and per-year counts; empty-state condition changes.
- `src/i18n/locales/{nl,fr,en}.ts`, `src/i18n/types.ts`: new strings.
- `src/tests/visible-events.test.ts`, `src/tests/calendar-screens.test.ts`: updated and new tests.
- No API, database or data changes.
