# Tasks

## 1. Preparation
- [x] 1.1 Merge the latest `feat/design-system-foundation` and confirm the CI gate (`npm test`, `npm run build`, `npm run sheriff`) is green before starting
- [x] 1.2 Create branch `feat/redesign-calendar-screens` from it; reference images are already in `design/`
- [x] 1.3 Add the i18n keys (nl, fr, en) for hero label, "Daarna", race count, save/saved, type chips, not-found and empty state

## 2. Filtering logic
- [x] 2.1 Extract the filtering from `EventList.svelte` into a util + derived `visibleEvents` next to `event-search.ts`
- [x] 2.2 Pin hero/list semantics: hero is the next upcoming race, with past events on the past races follow the upcoming ones
- [x] 2.3 Make `ExportButton` use `visibleEvents` (fixes the export ignoring filters)
- [x] 2.4 Unit tests for filtering, hero selection and export input

## 3. Shared UI additions
- [x] 3.1 Extend `RaceRow` with a save (star) slot and a livestream link; keep it presentational
- [x] 3.2 Add any missing tokens to `variables.css` (e.g. hero stripe overlay) instead of hardcoded values
- [x] 3.3 Unit tests for the new `RaceRow` slots, including that the star does not trigger the row link

## 4. Calendar screen
- [x] 4.1 Build the next race hero (date, title, location, `TypeLabel`, `StartLight`, INSCHRIJVEN, star, deadline)
- [x] 4.2 Rebuild `EventList` as the timeline of `RaceRow`s with heading and count; remove `EventCard`
- [x] 4.3 Rebuild `EventFilters` as search + type chips (neutral chip for unknown types) + past-events toggle + date range + reset; collapsible on mobile
- [x] 4.4 Desktop layout: sticky filter sidebar with export and account call-to-action; mobile layout per design
- [x] 4.5 Restyle `AccountCTA`, empty, loading and error states on tokens
- [x] 4.6 Wire the star to `toggleEventSelection`
- [x] 4.7 Restyle `Navigation` to design B (underlined active link, segmented locale switcher, outlined sign-in)
- [x] 4.8 Component tests for hero, list, filters and navigation

## 5. Event detail page
- [x] 5.1 Add the `/events/:id` route (prefix, like `/news/:slug`)
- [x] 5.2 Build the page: info, map link, description, registration block, livestream while ongoing, document title
- [x] 5.3 Load from `eventsStore` with fallback to `EventsService.getEventById`; not-found state with link back
- [x] 5.4 Edit action via the existing `EventEditor` for permitted users only
- [x] 5.5 Link hero title and rows to the page; keep list filters when going back
- [x] 5.6 Tests for the route, loading fallback, not-found and edit visibility

## 6. Verification
- [ ] 6.1 `npm test`, `npm run check`, `npm run build`, `npm run sheriff` green; CI green on the branch
- [ ] 6.2 Contrast (AA) and 44px targets on the new screens (row link, star and registration button separately)
- [ ] 6.3 Test with real data: long titles, missing location, unknown types, registration closed/open/soon
- [ ] 6.4 Review mobile and desktop in Bolt on a real phone against the reference images
- [ ] 6.5 Remove unused files (`EventCard.svelte`, old dropdown usage) and update `ARCHITECTURE.md` if it names them
