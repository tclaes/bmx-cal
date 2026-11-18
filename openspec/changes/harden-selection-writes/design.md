# Design

## Context

Before this change `selection.store.ts` ran writes concurrently, updated localStorage and the store before the account write, and `selectionService` dropped the `{ error }` Supabase returns, so rejected writes looked successful. Callers outside My Events called `toggleEventSelection` without handling a rejection. See proposal.md for why this matters for undo.

## Goals / Non-Goals

**Goals:**
- A selection write that the account rejects is reported to the caller and leaves this device matching the account.
- Writes cannot overtake each other, and a queued write never runs for another account.
- Every UI entry point shows a translated message for a rejected write.

**Non-Goals:**
- Changing the selection bar or its undo logic (change `extract-selection-bar`).
- Database or RLS changes.

## Decisions

### Ordered, all-or-nothing writes in `selection.store.ts`
The store now:
- runs every write (`toggleEventSelection`, `selectEventsByType`, `deselectEventsByType`, `clearAllSelections`, `replaceSelection`, `adoptLocalSelections`) through one queue, in the order they were started. A write that takes longer than 15 seconds (`WRITE_QUEUE_TIMEOUT_MS`) stops holding up the writes queued after it, so one stuck request can't block selection for the rest of the session;
- runs a queued write only for the account it was started for. If a different user signed in (or the user signed out) in the meantime, the write rejects with `AccountChangedError` and touches nothing;
- makes select, deselect, clear and replace throw when the account rejects them, because `selectionService` now checks the `{ error }` Supabase returns for add, remove and clear. `adoptLocalSelections` is the exception on purpose: after sign-in it waits for every insert, and if any fails it keeps the local selection and resolves, so signing in never fails because of it;
- for select and deselect, updates this device first and then puts back every race whose account write failed (`mutateByType` uses `Promise.allSettled`, `toggleEventSelection` undoes its local toggle). Clear, replace and adoption write the account first and only then change this device, which is why a failed clear or replace leaves this device untouched;
- adds `replaceSelection` for loading a saved calendar: clear the account, add every race, and if any add fails, put the account back as it was (best effort) and keep this device's selection.
Adds use `upsert` with `ignoreDuplicates`, because `(user_id, event_id)` is unique and select-by-type re-adds races that are already saved.
Every caller now catches a rejected write and shows a translated, neutral message (it is shown for selecting and deselecting alike) above the content, so the race list stays visible. Only the latest attempt may set or clear the message, so an older write that finishes late never hides a newer failure, and the message resets when the race or the account changes: the race list and race detail (`calendar.selectionUpdateFailed`, shown above the content so the list stays visible), the type chips and race toggles on My Events (`calendar.selectionUpdateFailed`), loading a saved calendar (`myEvents.loadCalendarFailed`), and clear and undo in the selection bar (whose `error` event now feeds the same message above the list instead of the page's main error, which replaces the list).
*Alternative:* write to the account first for select and deselect too. Rejected because every tap would wait for the network.


## Risks / Trade-offs

- [Selection writes now run one at a time, so a slow account write delays the next select or clear] → A write is one request per race (select and deselect send one per race; `replaceSelection` sends a clear plus one add per race), so a large type selection or saved calendar takes longer to clear the queue. Ordering is what keeps a newer clear from being overtaken. Select and deselect still update this device first, so taps stay responsive; clear and replace wait for the account by design. After 15 seconds a stuck write no longer blocks the queue, at the cost of ordering for that one write.
- [Putting the account back after a failed `replaceSelection` can itself fail] → This device keeps its selection either way, and the next load reads the account again.
- [Surfacing errors changes behaviour for every caller] → Each caller catches and shows `calendar.selectionUpdateFailed` (or `myEvents.loadCalendarFailed`); tests cover the race list, race detail, type chips and saved-calendar load.

## Migration Plan

Frontend only. Merge after `extract-selection-bar` (this PR is stacked on it); ships with the normal bolt.new deploy. Roll back by reverting the merge commit.
