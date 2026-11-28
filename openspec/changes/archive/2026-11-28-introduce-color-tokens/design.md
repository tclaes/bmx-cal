## Context

The first iteration of this change targeted the old light theme and proposed a two-tier palette. After the dark redesign landed on `master` the tokens were already role-based, but their raw values were repeated across roles (`#35d07f` for success, start light and race stripes). The design therefore keeps two tiers: a palette and role-based tokens.

## Decisions

- **Palette:** `src/styles/palette.css` defines `--palette-*` primitives named after the color (`--palette-cyan-500`, `--palette-ink-900`), each raw hex value once. It is the only lint exemption.
- **Role tokens:** `src/styles/colors.css` holds all role-based tokens, including `--race-*`, `--hero-*`, `--badge-*` and `--color-status-*` groups, and builds them only from palette primitives. Components use these tokens, never `--palette-*` directly, so a palette change or a second theme only touches the token layer.
- **No fallbacks:** `var(--token, #hex)` is replaced by `var(--token)`; the redesign defines the legacy aliases (`--color-error`, `--color-primary-dark`, …).
- **Alpha variants:** use `color-mix(in srgb, var(--token) N%, transparent)` (in `colors.css`: `var(--palette-*)`), or a dedicated token (`--color-overlay`, `--color-focus-ring`). Shadows use `--color-shadow`.
- **Badge and status colors:** kept as their original solid colors (white text) via `--badge-*` and `--color-status-*`, so contrast is unchanged. Badge still accepts a data-driven `color` prop (event types).
- **Inline SVG:** `fill`/`stroke` set through `style="fill: var(--color-…)"`, since presentation attributes cannot use `var()`.

## Enforcement

`.stylelintrc.json` (run by `npm run stylelint` in CI): `color-no-hex`, `function-disallowed-list` (rgb/rgba/hsl/hsla/hwb/lab/lch/oklab/oklch/color), and a named-color rule in `declaration-property-value-disallowed-list` for color-bearing properties. Override turns the first two off for `src/styles/palette.css` only, so `colors.css` is linted like any other stylesheet. `src/tests/no-color-literals.test.ts` scans non-test `.ts` files, checks that `palette.css` only declares `--palette-*` hex values, that every palette reference in `colors.css` exists, and that no other file references `--palette-*`.

## Risks

- Focus ring on the contact form changes from blue to the cyan primary.
- Pre-existing contrast gaps (default badge white on `#3b82f6`) are unchanged.
