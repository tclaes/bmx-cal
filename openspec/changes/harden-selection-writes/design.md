# Design

## Context

Before this change `selection.store.ts` ran writes concurrently, updated localStorage and the store before the account write, and `selectionService` dropped the `{ error }` Supabase returns, so rejected writes looked successful. Callers outside My Events called `toggleEventSelection` without handling a rejection. See proposal.md for why this matters for undo.

## Goals / Non-Goals

**Goals:**
- A selection write that the account rejects is reported to the caller and leaves this device matching the account.
- Writes cannot overtake each other, except a write that has been running longer than `WRITE_QUEUE_TIMEOUT_MS` (15 s), which stops holding up the queue. A write never runs, or keeps writing, for another account.
- Every UI entry point shows a translated message for a rejected write.

**Non-Goals:**
- Changing the selection bar or its undo logic (change `extract-selection-bar`).
- Database or RLS changes.

## Decisions

### Ordered, all-or-nothing writes in `selection.store.ts`
The store now:
- runs every write (`toggleEventSelection`, `selectEventsByType`, `deselectEventsByType`, `clearAllSelections`, `replaceSelection`, `adoptLocalSelections`) through one queue, in the order they were started. A write that has been running for 15 seconds (`WRITE_QUEUE_TIMEOUT_MS`, counted from when it starts, not from when it was queued) stops holding up the writes queued after it, so one stuck request can't block selection for the rest of the session;
- treats a failed account lookup as a failed write when the app knows a user is signed in: the write throws instead of quietly staying on this device;
- binds each write to the account it was started for. The write checks that account when it starts and again before every account write (`WriteAccount.check()`), and rejects with `AccountChangedError` if another user signed in or the user signed out. It checks again after its account write and before changing this device; once the account changed, it neither commits nor rolls back this device, which then belongs to the new account. `selectionService` add, remove and clear take the user id from the caller instead of looking it up, and remove/clear filter on it, so a write can never touch another account's rows; a signed-out write stays on this device;
- makes select, deselect, clear and replace throw when the account rejects them, because `selectionService` now checks the `{ error }` Supabase returns for add, remove and clear. `adoptLocalSelections` is the exception on purpose: after sign-in it waits for every insert, and if any fails it keeps the local selection and resolves, so signing in never fails because of it;
- once a write starts (after earlier queued writes and the account lookup), select and deselect by type update this device first and then put back every race whose account write failed (`mutateByType` uses `Promise.allSettled`). A single-race toggle saves its local copy first but updates the shown selection (`selectedEventIds`) only after the account accepts it, as before this change; on failure it undoes its local toggle. Keeping the shown state behind the account is what lets an account switch leave the new account's device untouched. Clear, replace and adoption write the account first and only then change this device, which is why a failed clear or replace leaves this device untouched;
- adds `replaceSelection` for loading a saved calendar: read what the account holds, clear it, add every race, and if any add fails, put that account snapshot back (it can hold races this device doesn't) and keep this device's selection. Putting it back is best effort: if that also fails, the account can be left partly replaced until the next load;
- never fails while clearing this device: `clearLocalSelections` ignores a storage error (for example in private mode), so a successful account clear always clears this device too.
A failure that arrives after the queue timeout only rolls back races that no newer write changed since, so it never undoes a newer toggle. Saved calendars apply in click order: a slow read that finishes after a newer load started is dropped.
Adds use `upsert` with `ignoreDuplicates`, because `(user_id, event_id)` is unique and select-by-type re-adds races that are already saved.
Every caller now catches a rejected write and shows a translated, neutral message (it is shown for selecting and deselecting alike) above the content, so the race list stays visible. The message belongs to the change that failed: only a later success of that same change (the same race, type, saved-calendar load, or selection-bar action) clears it, so another change succeeding never hides a failure that still stands. Each race or change also remembers its latest run, so an older run of the same change that finishes late (possible after the queue timeout) never overrides a newer one. Each caller also ignores a result that arrives after the account changed (and the race detail page one that arrives after another race opened), and the message resets when the race or the account changes, so a failure from one account is never shown to the next. Callers: the race list and race detail (`calendar.selectionUpdateFailed`), the type chips and race toggles on My Events (`calendar.selectionUpdateFailed`), loading a saved calendar including a failed read of the saved calendar (`myEvents.loadCalendarFailed`), and clear and undo in the selection bar (whose `error` event feeds the same message instead of the page's main error, which replaces the list).
*Alternative:* write to the account first for select and deselect too. Rejected because every tap would wait for the network.


## Risks / Trade-offs

- [Selection writes now run one at a time, so a slow account write delays the next select or clear] → A write is one request per race (select and deselect send one per race; `replaceSelection` sends a clear plus one add per race), so a large type selection or saved calendar takes longer to clear the queue. Ordering is what keeps a newer clear from being overtaken. A tap waits for the writes queued before it and for the account lookup before anything changes on screen, and a single-race toggle shows its new state only once the account accepts it; with an empty queue that is one round trip. After 15 seconds a stuck write no longer blocks the queue, at the cost of ordering for that one write.
- [Putting the account back after a failed `replaceSelection` can itself fail] → This device keeps its selection either way, and the next load reads the account again.
- [Surfacing errors changes behaviour for every caller] → Each caller catches and shows `calendar.selectionUpdateFailed` (or `myEvents.loadCalendarFailed`); tests cover the race list, race detail, type chips and saved-calendar load.

## Migration Plan

Frontend only. Merge after `extract-selection-bar` (this PR is stacked on it); ships with the normal bolt.new deploy. Roll back by reverting the merge commit.
