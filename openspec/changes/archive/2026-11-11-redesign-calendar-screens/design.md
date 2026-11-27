# Design

## Context

Design B (mobile 390x844 and desktop 1440) is in `design/`. The foundation change provides tokens, `Logo`, `TypeLabel`, `StartLight` and `RaceRow` in `src/libs/ui`, and `getRegistrationStatus` in `src/features/calendar` now returns a `state` (open / soon / closed / register).

Observed in the current code (not assumptions):
- Filtering lives inline in `EventList.svelte`; `ExportButton.svelte` has its own copy that reads fields the filter store no longer has (`search`, `eventType`, `status`), so export ignores the real filters.
- There is no single-event route. Routes with params exist (`/news/:slug`, read via `routeParams`), and `EventsService.getEventById` exists.
- `EventCard.svelte` (408 lines) mixes card layout, registration, livestream and editing.
- `toggleEventSelection` already works for signed-out users (local) and signed-in users (synced).
- `sheriff.config.ts`: `calendar` may use `ui`, `shared`, `services`, `stores`, `data`, `types`, `i18n`, `router`; `ui` may not import features.

## Goals / Non-Goals

**Goals:** one filtering source for hero, list, count and export; calendar screens built from the foundation components; a shareable detail page; mobile first.
**Non-Goals:** other screens, light theme, new database columns, changing registration or selection logic, a map view.

## Decisions

- **Single filtered-events store.** Extract the filtering from `EventList` into a derived store/util next to `event-search.ts` (e.g. `filterEvents(events, filters, today)` plus a derived `visibleEvents`). Hero, list, count and export all read it. This also fixes the export bug. Alternative (keep per-component filtering) rejected: it already diverged once.
- **Hero = first upcoming item of `visibleEvents`; list = the rest.** With "past events" on, the hero stays the next upcoming race and past races follow after the upcoming ones in date order. Tasks pin this with a unit test.
- **Hero is a new calendar component, not a `RaceRow` variant.** It shares `TypeLabel`, `StartLight` and the registration button style but has its own layout (large date, stripes background).
- **`RaceRow` gets a save slot and a livestream slot, no data fetching.** The calendar passes translated strings and callbacks; `RaceRow` stays presentational and in `libs/ui`. The star sits in the existing `z-index: 1` action area so it does not trigger the stretched link.
- **Detail page `/events/:id`.** New route with `prefix: true` like `/news/:slug`. The page reads the event from `eventsStore` and falls back to `EventsService.getEventById`. It reuses `getRegistrationStatus`, `TypeLabel`, `StartLight` and the existing `EventEditor` modal. Alternative (inline expand) rejected by the user.
- **Filters as chips.** Type chips are driven by `eventsStore.eventTypes` mapped through `getRaceTypeKey`; unknown types (e.g. Dare2Race, Training) get the neutral chip, so nothing in the database is hidden. The old `Dropdown` is removed from this page. Mobile: the filter block collapses behind a toggle (reuse the existing `filtersExpanded` idea); desktop: sticky sidebar column of 360px (design) replacing the current 300px account sidebar, which moves below the filters.
- **Timeline styling from tokens only.** Rail and dots use `--color-border` and `--race-*-ring`; new tokens only if the design needs a value that does not exist (e.g. hero stripe overlay), added to `variables.css`.
- **i18n.** New keys under `calendar` and `filters` in nl, fr and en (hero label, "Daarna", race count, saved/save, chips label, not-found); month and weekday names come from `Intl` via the locale.
- **Navigation.** Restyle to the design: wordmark logo, underlined active link, locale switcher as a segmented control, sign-in as outlined button. No new links.
- **Sheriff.** New code stays inside `calendar` (+ `ui` for shared presentational parts); the router imports the new detail page like the other pages.

## Risks / Trade-offs

- **Past events + hero semantics** can surprise users; covered by a unit test and the spec scenario.
- **Row link vs. star vs. registration button** on touch: three targets in one row. Mitigation: min 44px, `z-index` layering test, check on a real phone through Bolt.
- **Detail page deep links** need the SPA fallback (`public/_redirects` already has it); verify on the preview.
- **Large Svelte files** (`EventCard`, `EventFilters`) are replaced rather than edited in place, which makes the diff big; review commit by commit (tasks are ordered so each commit builds and passes).
- Design shows sample data ("voorbeeld"); real data may lack a location or have long titles. Rows must truncate/wrap gracefully.
