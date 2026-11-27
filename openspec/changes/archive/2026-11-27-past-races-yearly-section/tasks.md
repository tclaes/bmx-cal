# Tasks

## 1. Split upcoming and past races per year

- [x] 1.1 Change `splitHero` in `src/features/calendar/visible-events.ts` to return `{ hero, upcoming, pastByYear }`: upcoming in date order without the hero, past races grouped by the year of `date`, years newest first and races within a year most recent first; verify with `npm test -- visible-events`
- [x] 1.2 Update `src/tests/visible-events.test.ts` for the new shape and add cases for several years (group and race order), past hidden (no groups), only past races (no hero, empty upcoming) and an ongoing race staying upcoming; verify the tests pass

## 2. Render the previous-races section

- [x] 2.1 Add `calendar.previousHeading` to `src/i18n/types.ts` and to nl ("Vorige wedstrijden"), fr ("Courses précédentes") and en ("Previous races"); verify `npm run check` passes
- [x] 2.2 Move the shared `RaceRow` props for a calendar race into a small component in `src/features/calendar/` so upcoming and past rows render the same way; verify the existing calendar screen tests still pass
- [x] 2.3 In `EventList.svelte`, render the upcoming list with a count of upcoming races only, then the previous-races section (`h2`) with a heading (`h3`) per year showing the year and its count via `raceCount`/`raceCountOne`, using existing heading styles and spacing tokens; show the empty state only when there is no hero, no upcoming race and no past group; verify `npm run stylelint` and `npm run sheriff` pass
- [x] 2.4 Extend `src/tests/calendar-screens.test.ts`: enabling "show past events" shows "Vorige wedstrijden" below the upcoming list with year headings newest first, the "Daarna" count excludes past races, and only-past matches show the section instead of the empty state; verify `npm test` passes

## 3. Integration check

- [x] 3.1 Run `npm run check`, `npm run sheriff`, `npm run stylelint` and `npm test`, and check in the running app (mobile and desktop width) that toggling "show past events" shows the yearly section at the bottom

## Workflow follow-up

- Link the PR to issue #51.
- Archive the change after the PR is merged.
