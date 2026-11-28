# Tasks

## 1. Report failures from the account

- [x] 1.1 Make `selectionService` add, remove and clear throw on the Supabase `{ error }`; use `upsert` with `ignoreDuplicates` for adds. Verify with `src/tests/selection-writes.test.ts` ("re-adding a race that is already saved").
- [x] 1.2 Make `clearAllSelections` clear the account first, then this device. Verify with `src/tests/selection-clear.test.ts`, which fails against the old store.
- [x] 1.3 Put this device back for races the account rejected (`mutateByType` with `allSettled`, toggle undoes its local toggle). Verify with the rejected add, remove and toggle tests in `selection-writes.test.ts`.

## 2. Ordered writes

- [x] 2.1 Run every selection write through one queue; let a write stuck for 15 s stop blocking the queue; reject a queued write after an account switch. Verify with the ordering, timeout and account-switch tests in `selection-writes.test.ts`.
- [x] 2.2 Make `adoptLocalSelections` wait for every insert before releasing the queue. Verify with the "merging signed-out picks" test.

## 3. Callers

- [x] 3.1 Add `replaceSelection` and use it to load a saved calendar all-or-nothing with `myEvents.loadCalendarFailed`. Verify with the `replaceSelection` store tests and the "loading a saved calendar" page tests.
- [x] 3.2 Catch rejected writes in the race list, race detail, My Events toggles and type chips with `calendar.selectionUpdateFailed` (nl, fr, en). Verify with `calendar-screens.test.ts`, `event-detail.test.ts` and `my-events-page.test.ts`.

- [x] 3.3 Bind each write to its account (check before every account write, pass the user id to the service), start the queue timeout when a write starts, restore the account snapshot after a failed replace, and make local clearing non-throwing. Verify with the account, timeout and replace tests in `selection-writes.test.ts`.
- [x] 3.4 Show each failure until that same change succeeds, ignore late results on the race detail page, and report a failed read of a saved calendar. Verify with the page tests in `calendar-screens`, `event-detail` and `my-events-page`.

## 4. Integration checks

- [x] 4.1 Run `npm test`, `npm run check`, `npm run sheriff`, `npm run stylelint` and the full mocked e2e suite, and verify all pass.

## Workflow follow-up

- Merge after `extract-selection-bar`; then sync the deltas and archive both changes.
