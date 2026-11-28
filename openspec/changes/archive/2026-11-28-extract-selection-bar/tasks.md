# Tasks

## 1. Extract the selection bar component

- [x] 1.1 Create `src/features/my-events/SelectionBar.svelte` with props `isLoggedIn` and `exporting`, events `export`, `save` and `error`, and the count, clear, signed-in and signed-out markup moved from `MyEventsPage.svelte`. Verify `npm run check` passes.
- [x] 1.2 Move the clear/undo state (`UNDO_MS`, `clearedIds`, `undoVisible`, `undoButton`, `undoTimer`, `handleClearAll`, `handleUndo`, `hideUndo`, the `onDestroy` cleanup) and the undo message markup into the component. Verify focus still moves to the undo button after `tick()`.
- [x] 1.3 Replace the inline bar and undo blocks in `MyEventsPage.svelte` with `<SelectionBar>`. Wire `on:export` to `exportToCalendar`, `on:save` to `handleSaveCalendar` and `on:error` to set `error`. Remove the now-unused imports, state and `.selection`, `.top`, `.count`, `.clear`, `.signin`, `.actions`, `.reason` and `.undo*` styles. Verify the existing `src/tests/my-events-page.test.ts` "selection bar" and "clear with undo" suites pass unchanged with `npx vitest run src/tests/my-events-page.test.ts`.
- [x] 1.4 Add `src/tests/selection-bar.test.ts` that renders the component directly. Cover: hidden when the count is 0; the signed-in variant emits `export` and `save`; the signed-out variant navigates to `/register` and `/login`; clear then undo restores the selection; the message disappears after 6s. Verify with `npx vitest run src/tests/selection-bar.test.ts`.

## 2. Fix the card layout

- [x] 2.1 In `SelectionBar.svelte`, make `.selection` the card on all widths (`--color-bg-secondary`, `--border-radius-md`, `padding: var(--spacing-md)`, column flex with `gap: var(--spacing-md)`). Drop `.top`'s own background, padding and extra min-height, and remove the `row wrap` desktop override. Verify `npm run stylelint` passes and no hardcoded colours or spacing are added.
- [x] 2.2 Keep `.actions` as one column below 768px and two equal `max-content` columns from 768px with "save calendar" first. Keep `1fr auto auto` for the signed-out variant. The save-first order on wide screens is visual only (CSS `order`); the DOM keeps export first for mobile, accepted for focus order (see design.md, Layout). In the Browser pane at 1280px and 375px, signed in and signed out, verify the count row is on top, the actions are below it, and the gap to the left and bottom card edges matches the top padding (right gap at least that padding; desktop signed-in buttons stay content-width). Take screenshots as proof.
- [x] 2.3 Verify every control in the bar still measures at least 44px tall (computed `block-size` via the Browser pane's JavaScript tool) at both widths.

## 3. Review follow-ups

- [x] 3.1 Translate the clear and restore failure messages (`myEvents.clearFailed`, `myEvents.restoreFailed` in nl, fr and en) and emit them instead of raw or English error text. Verify with the error-path tests in `src/tests/selection-bar.test.ts`.
- [x] 3.2 When restoring fails, show the same undo again for 6 seconds with focus on it, and let a newer clear cancel an undo that is still running. Verify with the "restoring fails", "retry" and "clears again while undo is still running" tests.

- [x] 3.3 Let only a successful newer clear cancel a running undo, also when more clears start while it waits. Verify with the "newer clear fails" and "second newer clear" tests in `selection-bar.test.ts`.

## 4. Integration checks

- [x] 4.1 Run `npm test`, `npm run check`, `npm run sheriff` and `npm run stylelint`, and verify all pass.
- [x] 4.2 Run `npm run test:e2e:mock -- e2e/specs/my-events.spec.ts e2e/specs/a11y.spec.ts` and verify the export, account prompt, clear/undo, save-calendar and axe checks pass without selector changes.

## Workflow follow-up

- Sync the `my-calendar` delta into `openspec/specs/my-calendar/spec.md` and archive the change after review and merge to master.
