# Design

## Context

`visible-events.ts` is the single source for which races are visible: `filterEvents` applies the filters (including `showPastEvents`) and sorts by date, and `splitHero` turns that list into `{ hero, rest }`, where `rest` is the remaining upcoming races followed by the past races. A race counts as past when `end_date || date` is before today, so an ongoing multi-day race is still upcoming. `EventList.svelte` is the only consumer of `calendarSplit`; it shows the empty state when there is no hero and `rest` is empty, and its count is `rest.length`. The export uses `visibleEvents`, not the split, so it is not affected.

See proposal.md for the motivation and specs/calendar-overview/spec.md for the required behaviour.

## Goals / Non-Goals

**Goals:**
- Keep the grouping logic pure and in `visible-events.ts`, so it can be unit tested without rendering.
- Reuse the existing `RaceRow` rendering for past races; past rows look and behave like other rows.

**Non-Goals:**
- No new store, no change to `filterEvents` or the filters store.
- No visual "past" styling of rows beyond the section and year headings.

## Decisions

**Split shape: `{ hero, upcoming, pastByYear }`.** `splitHero` returns `upcoming: EventWithDetails[]` (date ascending, hero excluded) and `pastByYear: { year: number; events: EventWithDetails[] }[]`. Year groups are newest first, events within a group most recent first. An array of groups instead of a `Map`/record keeps the order explicit and is trivial to `{#each}` in Svelte. Alternative considered: keep `rest` and let the component group — rejected because it moves logic into the template and is harder to test.

**Year and order key: the race's start `date`.** A race is grouped under the year of its `date`, and sorted on `date` (descending). This matches how the rest of the list sorts and how races are shown (day and month of `date`). A race spanning New Year falls under its start year. Whether a race is past keeps using the existing `isPast` (`end_date || date`).

**Rendering: one row snippet for both lists.** Svelte 4 has no snippets, so the `RaceRow` props block is shared by moving it into a small local component (e.g. `CalendarRaceRow.svelte`) that takes the event and forwards `save`/`click`, or by keeping one `{#each}` per list with the same props. Prefer the small component so the upcoming and past lists cannot drift apart.

**Headings and count.** The upcoming list keeps its `list-head` with `thenHeading` and a count of `upcoming.length`. The previous-races section gets an `h2` ("Previous races") and each year an `h3` with the year and a count using the existing `raceCount` / `raceCountOne` strings, so only one new string (`calendar.previousHeading`) is needed in nl ("Vorige wedstrijden"), fr ("Courses précédentes") and en ("Previous races"). Headings reuse the existing `list-title` / `count` styles and spacing tokens; no new colours.

**Empty state.** The empty state shows only when there is no hero, no upcoming race and no past group.

## Risks / Trade-offs

- [Many past years make the page long] → Out of scope for now (no collapsing or pagination); the section only appears when the user turns the filter on.
- [Count meaning changes from "all listed" to "upcoming"] → Each year heading shows its own count, so every listed race is still counted somewhere; the spec records the new meaning.
- [Heading levels] → The section uses `h2` like the upcoming list heading, years use `h3`, and the race rows in the section use `h4` (`RaceRow` takes a `headingLevel`), keeping the outline valid under the page `h1`.

## Migration Plan

Frontend-only change; deploys with the normal release. Rollback is reverting the commit.
