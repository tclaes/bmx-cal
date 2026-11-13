# Tasks

## 1. Decision and inventory

- [x] 1.1 Decide scale approach (snap, no new tokens) and record it in `design.md`.
- [x] 1.2 Inventory literals with `grep -rnE "(margin|padding|gap)[a-z-]*:.*[0-9]+(px|rem|em)" src` (30 declarations in 17 files) and map each to a token in `design.md`.

## 2. Migration

- [x] 2.1 Migrate `src/layout/Navigation.svelte`.
- [x] 2.2 Migrate `src/features/calendar/*` (AccountCTA, EventDetailPage, EventEditor).
- [x] 2.3 Migrate `src/features/guide/*`, `about`, `legal`, `auth`, `bug-report`.
- [x] 2.4 Migrate `src/features/team-manager/*`.
- [x] 2.5 Migrate `src/shared/*` and `src/libs/ui/*` (LoadingSpinner keeps the `.sr-only` hack with a lint exception).

## 3. Enforcement and docs

- [x] 3.1 Widen the stylelint rule to all spacing properties and to `px`/`rem`/`em` anywhere in the value. Verify that `padding: var(--spacing-sm) 10px` fails.
- [x] 3.2 Document the rule in `docs/contribute.md`.

## 4. Verification

- [x] 4.1 Re-run the inventory grep: only the documented exception is left.
- [x] 4.2 Run `npm run stylelint`, `npm run check`, `npm test` and `npm run build`.
- [x] 4.3 Spot-check the affected pages at 375px and 1280px.
