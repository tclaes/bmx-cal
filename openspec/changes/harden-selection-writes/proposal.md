# Proposal

## Why

The selection store hides failures and lets writes overlap. `selectionService` ignores the `{ error }` Supabase returns for add, remove and clear, so a write the database rejects looks like a success. `clearAllSelections` empties this device before the account delete. Writes run concurrently, so a clear can be overtaken by an older select that is still writing. Undo in the selection bar (change `extract-selection-bar`) can only promise an exact restore if the store reports failures and keeps writes in order.

## What Changes

- Selection writes (toggle, select by type, deselect by type, clear, replace, adopt after sign-in) run one at a time through a queue, in the order they were started. A write that has been running for 15 seconds stops holding up the writes after it.
- A write is bound to the account it was started for: it checks the account before every account write, passes that user id to the service, and rejects without touching anything after an account switch.
- Add, remove and clear throw when Supabase rejects them. Adds use `upsert` with `ignoreDuplicates`, because `(user_id, event_id)` is unique.
- Select and deselect put this device back for every race the account did not accept. Clear and replace write the account first, so a failure leaves this device untouched. Adopting signed-out picks after sign-in waits for every insert and keeps the local selection on failure.
- New `replaceSelection` loads a saved calendar as one write: on failure this device keeps its selection and the account is put back to what it held. Putting the account back is best effort; if it also fails, the account can be left partly replaced until the next load.
- Every caller catches a rejected write and shows a translated message above the content, which stays visible: race list, race detail, My Events race toggles and type chips, and loading a saved calendar (also when reading it fails).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `my-calendar`: clearing fails without changing this device or the account; rejected changes are shown; loading a saved calendar is all-or-nothing.
- `calendar-overview`: a rejected save from the hero or a row shows a translated error and keeps the list.
- `event-detail`: a rejected save on the detail page shows a translated error.

## Impact

- `src/libs/core/stores/selection.store.ts`, `src/libs/core/stores/index.ts` (exports `replaceSelection`), `src/libs/core/services/selection.service.ts`.
- `src/features/calendar/EventList.svelte`, `src/features/calendar/EventDetailPage.svelte`, `src/features/my-events/MyEventsPage.svelte`.
- i18n: `calendar.selectionUpdateFailed` and `myEvents.loadCalendarFailed` in nl, fr and en.
- Tests: new `selection-writes.test.ts` and `selection-clear.test.ts`; additions to `calendar-screens.test.ts`, `event-detail.test.ts` and `my-events-page.test.ts`.
- Depends on `extract-selection-bar` (stacked PR). No database or edge function changes.
