# Proposal

## Why

On wide screens the selection bar on "My calendar" has uneven padding. The card only has right padding. When the two action buttons wrap to a second row, they sit flush against the card's left and bottom edges ("Kalender opslaan" touches the border). The bar's markup, styles and clear/undo logic are also inline in a 600-line `MyEventsPage.svelte`, so layout fixes are hard to make and test on their own.

## What Changes

- Extract the selection bar into its own component in `src/features/my-events/`. It covers the count, the "clear selection" control, the signed-in actions (save calendar, export) and the signed-out account prompt.
- Move the clear-with-undo message and its 6-second timer into the same component. The page keeps data loading, export and the save-calendar modal.
- Fix the layout. On every width the bar is one card with the same padding on all sides. The count and clear control form the top row, and the actions sit in a second row inside the padding. On wide screens the two signed-in actions sit side by side with equal width ("save calendar" first, export second). On narrow screens they stack at full width.
- Keep the visible behaviour otherwise the same: text, touch targets, undo semantics and keyboard focus on undo.
- Harden clear and undo (from review): translated error messages for a failed clear or restore, undo offered again when restoring fails, focus back on the clear control after undo, and only a successful newer clear cancels an undo that is still running.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `my-calendar`: the "Selection bar and actions" requirement now states the card layout: even inner padding, a count row on top and the actions below inside the card on all widths.

## Impact

- `src/features/my-events/MyEventsPage.svelte`: selection markup, styles and clear/undo state removed. It renders the new component.
- New `src/features/my-events/SelectionBar.svelte` (name settled in design).
- `src/tests/my-events-page.test.ts`: the selection-bar and undo tests keep passing. New component-level tests are added for the bar.
- `src/i18n/types.ts` and the nl, fr and en locales: two new keys, `myEvents.clearFailed` and `myEvents.restoreFailed`.
- No changes to stores, services, the database or edge functions. Making selection writes report failures and run in order is a separate change, `harden-selection-writes`.
