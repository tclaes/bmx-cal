# Proposal

## Why

`design-system-foundation` delivered the tokens, logo and the `TypeLabel`, `StartLight` and `RaceRow` components, but no screen uses them yet: the calendar still shows plain cards with a free-form filter panel, so the app looks half converted. Design B ("Startlicht") defines the real calendar screens (mobile and desktop); this change builds them on the new foundation.

## What Changes

- Calendar page rebuilt per design B: a **next race hero** (date, title, location, type, start-light, register button, save star, registration deadline) followed by a **timeline list** of `RaceRow`s with a "Daarna" heading and race count.
- **Filters** restyled: location/race search, type chips (ALL + CV, TC, CW, 3NC, EC, WC with the type dot), "show past events" toggle, export to calendar. Desktop shows them in a right sidebar; mobile in a collapsible sheet. Date range filter stays available.
- The tap target of a row becomes a new **event detail page** (`/events/:id`) that carries everything the old card showed (date range, time, location with maps link, description, registration dates and button, livestream while ongoing, edit for permitted users).
- `Navigation` follows design B (underlined active item, `NL FR EN` switcher, sign-in button); mobile bottom/menu behaviour stays as it is unless the design shows otherwise.
- `AccountCTA` and the empty/loading/error states restyled on tokens (fixes the white card with unreadable heading seen on the dark theme).
- Registration status text and the start-light on each row come from `getRegistrationStatus`; strings go through i18n (nl, fr, en).
- Out of scope: `/my-events`, about, guide, legal, news, profile, admin and team-manager screens; light theme; data or API changes.

## Capabilities

### New Capabilities
- `calendar-overview`: the calendar page: next race hero, timeline race list, type chip filters, search, past-events toggle, date range, export, account call-to-action and the responsive layouts.
- `event-detail`: the single-event page at `/events/:id` and the rules for how a race row links to it.

### Modified Capabilities
None. The `design-system` capability from `design-system-foundation` is reused as is.

## Impact

- `src/features/calendar/*` (CalendarView, EventList, EventCard, EventFilters, ExportButton, AccountCTA; new hero and detail components), `src/layout/Navigation.svelte`, `src/router/routes.ts` (new route), `src/i18n/locales/{nl,fr,en}.ts`.
- New tests for the hero, list, filters and detail page; existing `event-search` and `event-grouping` tests must keep passing.
- Depends on `design-system-foundation` (branch `feat/design-system-foundation`); no database or API changes. The event detail page reads events from the existing `eventsStore` and falls back to `EventsService` when opened directly.
- Must pass the CI gate (tests, build, `npm run sheriff`); the calendar feature may only use the modules allowed in `sheriff.config.ts`.
