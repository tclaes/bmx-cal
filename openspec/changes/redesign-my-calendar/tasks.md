# Tasks

## 1. Preparation

- [x] 1.1 Create branch `feat/redesign-my-calendar` from `feat/redesign-calendar-screens` and confirm `npm test`, `npm run build`, `npm run sheriff` are green before starting

## 2. Shared type chip

- [x] 2.1 Add `src/libs/ui/TypeChip.svelte` (dot or label, code, optional count, states: off / on / partial) and export it from `@ui`; unit test renders each state and `aria-pressed` values
- [x] 2.2 Use `TypeChip` in `EventFilters.svelte`; existing calendar tests still pass

## 3. Signed-in page

- [x] 3.1 Replace the type buttons with `TypeChip`s (count, fully / partly selected, `aria-pressed="mixed"`); test select-all, partial and deselect-all
- [x] 3.2 Replace the row buttons with `RaceRow`s: star toggles selection, title opens `/events/:id`; test that the star changes the selection and does not navigate
- [x] 3.3 Restyle header, counter, actions, notification block and error state on tokens; remove every `white` and `color-mix(... white)`; `grep -nE "#[0-9a-fA-F]{3,8}|white" src/features/my-events` has no hits
- [x] 3.4 Stop reading `event_type.color_code` on the page; test that a type with a stored colour renders its token label (EC is blue) and an unknown type renders the neutral label

## 4. Signed-out demo

- [ ] 4.1 Rebuild the preview list with the `RaceRow` anatomy (date column, `TypeLabel`, title, meta) from the existing sample data
- [ ] 4.2 Move the CTA card and buttons to tokens (`--hero-bg`, `--color-accent`, `--color-text-on-accent`); remove the gradient; test button contrast classes and 44px targets
- [ ] 4.3 Component test: preview renders type labels and both actions

## 5. Saved calendars and modal

- [ ] 5.1 Remove hex fallbacks in `SavedCalendarsList.svelte` and restyle on tokens with 44px targets
- [ ] 5.2 Restyle `SaveCalendarModal.svelte` on tokens; existing behaviour unchanged

## 6. Verification

- [ ] 6.1 `npm test`, `npm run check`, `npm run build`, `npm run sheriff` green; CI green on the branch
- [ ] 6.2 With real data: the same race has the same label on `/` and `/my-events` for every type, including Dare2Race and Training
- [ ] 6.3 Review `/my-events` signed in and signed out on a real phone through Bolt, next to the calendar screens
