# Design

## Context

`AppLayout.svelte` renders `<header><Navigation /></header>` as a child of `.app`, a column flex container with `min-height: 100vh`. Inside `Navigation.svelte`, `<nav class="navigation">` has `position: sticky; top: 0; z-index: 100`. Sticky positioning only works within the parent's box, and `<header>` is exactly as tall as the nav, so nothing sticks. No ancestor of the header sets `overflow` to anything other than `visible`, so moving the sticky rule up one level is enough.

The nav has two parts:
- `.nav-container`: the bar row (logo, desktop links or hamburger). It measures 87px tall at both widths (16px top padding, the logo with its padding, and a 1px bottom border). The desktop links can wrap at widths just above 1024px when admin and team-manager links are present, which makes it taller.
- `.mobile-menu`: rendered below the bar when the hamburger is open (under 1024px), part of the normal page flow inside the nav. Its last items are sign in/out and the language switcher.

Other values involved:
- `CalendarView.svelte` pins the desktop filter sidebar at `top: calc(var(--spacing-xl) * 2 + 24px)`, which is 88px. That was chosen by hand and only just clears the bar.
- `GuidePage` and `RaceDayPage` have tables of contents with `#section` links. The skip link targets `#main-content`.
- Z-index tokens exist for dropdown (1000), modal (2000) and toast (3000). The cookie banner (9999), install prompt and skip link (10000) use raw values. The update dialog uses the top layer.

## Goals / Non-Goals

**Goals:**
- One source of truth for the bar's height, used by every offset that has to clear it.
- CSS-only pinning. The only JavaScript is measuring the bar's height.

**Non-Goals:**
- Tokenising the cookie banner, install prompt and skip-link z-indexes. They already sit above the header and are unrelated to this change.
- Locking page scroll while the mobile menu is open.

## Decisions

### Make `<header>` sticky, not `<nav>`
Move `position: sticky; top: 0` and the z-index to `header` in `AppLayout.svelte`, and remove them from `.navigation`. `.navigation` keeps its background, border and shadow, so the pinned bar is opaque.
- *Alternative: drop the `<header>` wrapper and keep the sticky rule on `<nav>`.* Rejected: it loses the `banner` landmark that screen readers and the E2E page objects rely on.
- *Alternative: `position: fixed` plus top padding on the body.* Rejected: it needs a hardcoded height and breaks when the bar wraps or the font scales.

### Pin at every width
There is no media query on the sticky rule. This follows the issue and the explicit decision to pin on mobile too, where long pages make scrolling back up the most painful.

### `--header-height`: measured, with a static fallback
Add `--header-height: 87px` to `src/styles/variables.css` as the fallback. In `Navigation.svelte`, a `ResizeObserver` on `.nav-container` writes the measured border-box height (observed with `box: 'border-box'` so padding changes are caught too) (plus the nav's 1px border) to `document.documentElement.style` as `--header-height`, and disconnects on destroy.
- Measure the **bar row only**, not the whole header. Opening the mobile menu makes the header taller. If that changed `--header-height`, the menu's own `max-height` would depend on itself, and the anchor offsets would jump while the menu is open.
- *Alternative: a static token derived from the spacing tokens and the logo size.* Rejected as the only source: it goes wrong when the desktop links wrap, the user zooms text, or the locale makes labels longer. It is kept as the value used before the first measurement and in tests without `ResizeObserver`.

### Consumers of `--header-height`
- `html { scroll-padding-top: calc(var(--header-height) + var(--spacing-sm)); }` in the global styles. This covers in-page anchors and the `#main-content` skip-link target in one rule, with no `scroll-margin` on each heading.
- The `CalendarView` sidebar: `top: calc(var(--header-height) + var(--spacing-lg))`. This keeps roughly the current gap below the bar instead of the magic 88px.
- `.mobile-menu`: `max-height: calc(100dvh - var(--header-height)); overflow-y: auto; overscroll-behavior: contain;`. `dvh` follows the mobile browser's collapsing address bar. `overscroll-behavior` stops scrolling the menu from also scrolling the page behind it.

### `--z-index-header: 100`
Add it to `variables.css` next to the other z-index tokens and use it on `header`. 100 keeps the bar above in-page stacking (race rows use `z-index: 1`) and below every overlay layer, so the existing layer order is unchanged.

### E2E coverage in the existing projects
- `e2e/specs/site-navigation.spec.ts` runs in the desktop `chromium` project. It scrolls the calendar overview and asserts the banner is in the viewport at `top: 0`. It asserts the filter sidebar's top edge is below the banner's bottom edge. It follows a guide table-of-contents link and asserts the heading's top edge is below the banner.
- `e2e/specs/site-navigation.mobile.spec.ts` runs in the `mobile` project (375x812). It scrolls the page and asserts the banner is in view. Then, with the viewport made shorter, it opens the menu, scrolls the last language button into view inside the menu, and activates it.

## Risks / Trade-offs

- [The pinned bar permanently uses about 87px of a phone screen] → Accepted by decision. Hide-on-scroll is a possible follow-up, not part of this change.
- [The open mobile menu can cover most of a short screen] → It closes on Escape, on an outside click and on navigation, as it does today. It now scrolls internally instead of running off the screen.
- [`ResizeObserver` callback timing causes a one-frame mismatch before the first measurement] → The static 87px fallback matches the common case, so nothing visibly jumps.
- [`--header-height` is written as an inline style on `<html>`] → It is the only inline variable there. It lives in the component that owns the bar, so it is easy to find.
- [Older browsers without `dvh`] → Add a `100vh` declaration before the `dvh` one as a fallback. `vh` may slightly over-allocate under a mobile address bar, but the menu still scrolls.

## Migration Plan

CSS and a small layout effect only. Ships with the normal frontend deploy. Rollback is a revert of the change. Nothing to migrate.
