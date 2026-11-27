# Proposal

## Why

The top navigation is meant to stay visible while scrolling, but it scrolls away on every page and at every width (GitHub issue #54). On long pages such as the calendar overview, users must scroll back to the top to switch section, change language or sign in. `Navigation.svelte` already declares `position: sticky`, but it has no effect: the `<nav>` sits inside a `<header>` in `AppLayout.svelte` that is exactly as tall as the nav, so there is no room for it to stick.

## What Changes

- The site header stays pinned to the top of the viewport while the page scrolls, at every viewport width (desktop bar and mobile hamburger bar alike).
- The mobile menu, which opens inside the pinned header, is capped to the space below the bar and scrolls on its own, so its last items (sign in/out, language switcher) stay reachable on short screens.
- In-page anchor targets (the guide and race-day tables of contents) and the skip-link target are no longer hidden under the pinned bar.
- The calendar's sticky filter sidebar on desktop sits below the pinned bar instead of being covered by it.
- The pinned bar renders above page content and below dropdowns, modals, toasts and the cookie and install banners.
- The dead `position: sticky` on the inner `<nav>` is removed, leaving one source of truth for the header's position.
- Supersedes the earlier desktop-only proposal on `claude/sticky-navbar-desktop-0fb87f` (768px breakpoint), which was never merged.

Out of scope: hide-on-scroll or shrink-on-scroll behaviour, switching to `position: fixed`, and any redesign of the bar's contents.

## Capabilities

### New Capabilities
- `site-navigation`: Behaviour of the global header and navigation bar shown on every page: how it behaves while scrolling, how its mobile menu fits the viewport, and how it layers with other content.

### Modified Capabilities

(none)

## Impact

- `src/layout/AppLayout.svelte`: the `<header>` becomes the sticky element.
- `src/layout/Navigation.svelte`: remove the redundant sticky rule; cap the mobile menu height; expose the bar's height.
- `src/styles/variables.css`: new `--header-height` and `--z-index-header` tokens.
- `src/styles/` global rules: `scroll-padding-top` on the document.
- `src/features/calendar/CalendarView.svelte`: sidebar sticky offset derived from the header height instead of a fixed 88px.
- `e2e/specs/`: new desktop and mobile E2E specs for the pinned bar.
- No API, database or dependency changes.
