# Tasks

## 1. Tokens

- [x] 1.1 Add `--header-height: 87px` (fallback, with a comment that `Navigation.svelte` overwrites it with the measured bar height) and `--z-index-header: 100` to `src/styles/variables.css` next to the other z-index tokens. Verify `npm run stylelint` passes.

## 2. Pin the header

- [x] 2.1 In `src/layout/AppLayout.svelte`, give `header` `position: sticky; top: 0; z-index: var(--z-index-header)` with no media query. Verify in the browser at 1280px and 375px that the bar stays at the top while scrolling the calendar overview.
- [x] 2.2 In `src/layout/Navigation.svelte`, remove `position`, `top` and `z-index` from `.navigation`, keeping its background, border and shadow. Verify the pinned bar is still opaque and content scrolls underneath it, not over it.
- [x] 2.3 Add `e2e/specs/site-navigation.spec.ts` (desktop project): scroll the calendar overview and assert the `banner` landmark is in the viewport with its top edge at 0. Verify with `npm run test:e2e:mock -- site-navigation`.

## 3. Measure the bar height

- [x] 3.1 In `Navigation.svelte`, observe `.nav-container` with a `ResizeObserver` and write its border-box height plus the nav's 1px bottom border to `document.documentElement.style` as `--header-height`. Disconnect on destroy, and skip it when `ResizeObserver` is not available. Verify in devtools that the value is about 87px at 1280px and 375px, that it grows when the desktop links wrap (signed in as admin at 1024–1100px), and that it does not change when the mobile menu opens.
- [x] 3.2 Confirm `npm test` still passes in jsdom, where `ResizeObserver` may be missing, so the guard is exercised.

## 4. Keep targets and sticky elements clear of the bar

- [x] 4.1 Add `scroll-padding-top: calc(var(--header-height) + var(--spacing-sm))` to the `html` rule in `src/styles/reset.css`. Verify that a table-of-contents link on the guide page and the skip link at desktop width bring their target to rest below the bar.
- [x] 4.2 In `src/features/calendar/CalendarView.svelte`, change the desktop sidebar's `top` to `calc(var(--header-height) + var(--spacing-lg))`. Verify at 1280px that the sidebar stays fully below the bar while scrolling.
- [x] 4.3 Extend `e2e/specs/site-navigation.spec.ts`: assert the calendar sidebar's top edge is at or below the banner's bottom edge after scrolling. Follow a guide table-of-contents link and assert the section heading's top edge is below the banner's bottom edge. Verify with `npm run test:e2e:mock -- site-navigation`.

## 5. Mobile menu fits the viewport

- [x] 5.1 In `Navigation.svelte`, give `.mobile-menu` `max-height: 100vh` followed by `max-height: calc(100dvh - var(--header-height))`, plus `overflow-y: auto` and `overscroll-behavior: contain`. Verify at 375x500 (signed in, so all items show) that the menu scrolls internally and the page behind it does not.
- [x] 5.2 Add `e2e/specs/site-navigation.mobile.spec.ts` (mobile project). First, scroll a long page and assert the banner and the menu toggle stay in view. Second, set a short viewport (e.g. 375x480), scroll down, open the menu, scroll the last language button into view and click it, then assert the locale changed. Verify with `npm run test:e2e:mock -- site-navigation`.

## 6. Layering and final checks

- [x] 6.1 While scrolled, open a dropdown (calendar filters), a modal and a toast, and check that the cookie banner shows. Verify each renders above the bar. Confirm the existing `e2e/specs/a11y.spec.ts` axe checks still pass.
- [x] 6.2 Run `npm run check`, `npm run sheriff`, `npm run stylelint`, `npm test`, `npm run build` and `npm run test:e2e:mock`. Verify all pass.
- [x] 6.3 Check en, nl and fr at 375px, 1023px, 1024px and 1280px, with the mobile menu open and closed. Verify the behaviour matches every scenario in `specs/site-navigation/spec.md`.

## Workflow follow-up

- Reference GitHub issue #54 in the PR so merging it closes the issue.
- Delete the superseded branch `claude/sticky-navbar-desktop-0fb87f` once this change is merged.
- Archive the change after merge.
