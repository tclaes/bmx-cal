# Proposal

## Why

Spacing tokens (`--spacing-xxs` … `--spacing-3xl`) already exist in `src/styles/variables.css` and most components use them. About 30 `margin`, `padding` and `gap` declarations still use literal values such as `2px`, `0.5rem 0.75rem`, `0.15rem` or `0.6rem`. These literals drift from the scale, can't be changed from one place, and the current stylelint rule only catches single `px` values on `margin`/`padding`, so new ones keep getting in.

## What Changes

- Every `margin*`, `padding*`, `gap`, `row-gap` and `column-gap` declaration (and the legacy `grid-*gap` aliases) under `src/` uses `var(--spacing-*)` or a `calc()` of design tokens instead of literal `px`/`rem`/`em` lengths.
- Off-scale values snap to the nearest existing token. No new tokens are added.
- The stylelint rule is widened to all spacing properties and to `px`, `rem` and `em` (in any letter case) in any position of a shorthand. It already runs in CI, so CI fails on a regression.
- `docs/contribute.md` documents the rule.

Out of scope: `border-width`, `outline`, `inset`/`top`/`left`, `width`/`height`, `font-size`, `border-radius`, `box-shadow`, inline `style=` attributes, renaming tokens, and visual redesign. The `.sr-only` `margin: -1px` clip hack stays as is, with a documented lint exception. Stylelint also checks inline `style=` attributes, so `margin: -1px` is dropped from the spinner's inline copy of its `.sr-only` rule. The scoped class still applies it in the browser, and the inline copy stays because the jsdom unit test reads it.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `design-system`: adds requirements that spacing uses tokens and that the lint step enforces it.

## Impact

- 17 `.svelte` files across `features/{about,auth,bug-report,calendar,guide,legal,team-manager}`, `layout/Navigation`, `shared/{DocumentUpload,LocationPicker}` and `libs/ui/LoadingSpinner`.
- `.stylelintrc.json`, `docs/contribute.md`.
- Visual: every shift is 2px or less, except one deliberate `10rem` reservation that is now written as an exact `calc()` of tokens (no change).
