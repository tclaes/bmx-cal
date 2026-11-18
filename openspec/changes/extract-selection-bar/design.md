# Design

## Context

`src/features/my-events/MyEventsPage.svelte` (about 620 lines) renders the selection bar inline. It holds the count, the clear control, the signed-in or signed-out actions and the undo message, plus the clear/undo state (`clearedIds`, `undoVisible`, `undoTimer`, `UNDO_MS`). It reads `selectedCount` and `selectedEventIds` from `@core/stores`.

Why the padding is off: below 768px, `.top` is its own card and `.actions` sit outside it with no card around them. At 768px and up, `.selection` becomes the card, but it only has `padding-inline-end: var(--spacing-sm)` and no block padding. `.top` adds `padding-inline-start` only to itself. The `flex-flow: row wrap` layout puts `.actions` on a second line whenever they don't fit next to `.top`, and then the actions touch the card's left and bottom edges.

Existing coverage: `src/tests/my-events-page.test.ts` has the "selection bar" and "clear with undo" suites. `e2e/specs/my-events.spec.ts` covers export, the account prompt, clear/undo and save calendar. Both query by role and accessible name, not by class.

## Goals / Non-Goals

**Goals:**
- One self-contained `SelectionBar.svelte` that owns the bar's markup, styles and clear/undo flow.
- One card layout on all widths (see `specs/my-calendar/spec.md`): the same inner padding on all sides, count row on top, actions below.
- The existing unit and e2e tests keep passing without changes to their selectors.

**Non-Goals:**
- Changing copy, i18n keys, colours or button variants.
- Moving export (`generateICalContent`), the save-calendar modal or the notification block out of the page.
- Making the bar sticky or changing its position on the page.

## Decisions

### Component location and name
`src/features/my-events/SelectionBar.svelte`. It is only used by My Events, so it stays inside the `my-events` Sheriff module rather than `src/ui`. `SaveCalendarModal` and `SavedCalendarsList` follow the same pattern.
*Alternative:* `src/ui/SelectionBar.svelte`. Rejected because it knows about selection stores and the account flow, so it is not a generic UI primitive.

### Component API
- Props: `isLoggedIn: boolean`, `exporting: boolean`.
- Events: `export` and `save` (the page keeps `exportToCalendar` and `handleSaveCalendar`), plus `error`. Its detail is a translated message string the page shows in its existing error container, or `''` after a successful clear or undo, which clears an earlier error. The page sets its `error` to whatever the event carries.
- The component reads `selectedCount` and `selectedEventIds` itself and calls `clearAllSelections`, `selectEventsByType` and `deselectEventsByType` for clear and undo, as the page does today. The "create account" button and the "sign in" link call `navigate` directly.

*Alternative:* pass the count and callbacks in as props and keep the stores in the page. Rejected because undo needs the live selection at undo time to compute the diff, and passing that through adds wiring without making testing easier, since the store is already mocked in tests.

### Undo message lives in the component
The component renders the bar when `$selectedCount > 0` and the undo message when it is visible, both at the same spot in the flow. Focus moves to the undo button after `tick()`, and back to the clear control after undo, so keyboard users never lose focus. Undo runs the add step even when the remove step fails, so a failed remove still brings the cleared races back. It skips the add step only when a newer clear happened meanwhile (see below). If either step fails, the component emits the translated `myEvents.restoreFailed` message and shows the same undo again for 6 seconds, so the user can retry without losing races. A failed clear emits `myEvents.clearFailed`. For that to mean "nothing changed", `clearAllSelections` in `selection.store.ts` now clears the account first and only then this device, and `selectionService.clearRemoteSelections` throws when Supabase returns an error instead of ignoring it. The component counts clears started and clears that succeeded. An undo that is still writing waits until every newer clear has settled, including clears started while it waits; only a successful newer clear cancels it, so a failed newer clear (which changes nothing) does not throw away the undo. The timer is cleared in `onDestroy`. This keeps the "clear → undo" behaviour in one place (user decision).

### Layout
- `.selection` is the card on every width: `background-color: var(--color-bg-secondary)`, `border-radius: var(--border-radius-md)`, `padding: var(--spacing-md)`, `display: flex; flex-direction: column; gap: var(--spacing-md)`.
- `.top` loses its own background, padding and the extra min-height. It is a flex row with `justify-content: space-between`. The clear button keeps its 44px touch target.
- `.actions` is a one-column grid below 768px. From 768px it has two equal columns with `inline-size: max-content; max-inline-size: 100%`, left-aligned, and "save calendar" comes first via `order: -1` as it does today. The DOM keeps export first, so on wide screens the visual order differs from the tab and reading order. This is accepted on purpose: on mobile (the priority) the DOM order is the visual order with the primary export action first, and the existing page used the same reorder. The signed-out variant keeps `1fr auto auto` from 768px.
- `.selection` no longer has a desktop override that switches to `row wrap`. This removes the wrap that caused the bug. It was a two-row layout by user choice.
- Only existing spacing and colour tokens from `src/styles/variables.css` are used.

### Selection store: ordered, all-or-nothing writes
Undo can only promise an exact restore if the store reports failures honestly and writes can't overtake each other. So `selection.store.ts` now:
- runs every write (`toggleEventSelection`, `selectEventsByType`, `deselectEventsByType`, `clearAllSelections`, `replaceSelection`, `adoptLocalSelections`) through one queue, in the order they were started. A write that takes longer than 15 seconds (`WRITE_QUEUE_TIMEOUT_MS`) stops holding up the writes queued after it, so one stuck request can't block selection for the rest of the session;
- runs a queued write only for the account it was started for. If a different user signed in (or the user signed out) in the meantime, the write rejects with `AccountChangedError` and touches nothing;
- makes select, deselect, clear and replace throw when the account rejects them, because `selectionService` now checks the `{ error }` Supabase returns for add, remove and clear. `adoptLocalSelections` is the exception on purpose: after sign-in it waits for every insert, and if any fails it keeps the local selection and resolves, so signing in never fails because of it;
- for select and deselect, updates this device first and then puts back every race whose account write failed (`mutateByType` uses `Promise.allSettled`, `toggleEventSelection` undoes its local toggle). Clear, replace and adoption write the account first and only then change this device, which is why a failed clear or replace leaves this device untouched;
- adds `replaceSelection` for loading a saved calendar: clear the account, add every race, and if any add fails, put the account back as it was (best effort) and keep this device's selection.
Adds use `upsert` with `ignoreDuplicates`, because `(user_id, event_id)` is unique and select-by-type re-adds races that are already saved.
Every caller now catches a rejected write and shows a translated message: the race list and race detail (`calendar.saveFailed`, shown above the content so the list stays visible), the type chips and race toggles on My Events (`calendar.saveFailed`), loading a saved calendar (`myEvents.loadCalendarFailed`), and clear and undo in the selection bar.
*Alternative:* write to the account first for select and deselect too. Rejected because every tap would wait for the network.

## Risks / Trade-offs

- [The card now also wraps the actions on mobile, which looks slightly different from today's mobile view, where the buttons sit outside the card] → This is intended, because the spec now requires one card on all widths. Check it in the Browser pane at 375px.
- [Moving undo state into the component could break the page's "clear with undo" unit tests if they depend on page internals] → The tests interact through roles and fake timers only, so they still apply when rendered through the page. Run them unchanged.
- [`error` handling splits between the page and the component] → One `error` event and the existing page container. No second error UI.

- [Selection writes now run one at a time, so a slow account write delays the next select or clear] → Each write is a single small request, and ordering is what keeps a newer clear from being overtaken. Select and deselect still update this device first, so taps stay responsive; clear and replace wait for the account by design. After 15 seconds a stuck write no longer blocks the queue, at the cost of ordering for that one write.
- [Putting the account back after a failed `replaceSelection` can itself fail] → This device keeps its selection either way, and the next load reads the account again.

## Migration Plan

Frontend only. It ships with the normal bolt.new deploy after merge to master. Roll back by reverting the commit.
