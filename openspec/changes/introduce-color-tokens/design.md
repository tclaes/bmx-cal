## Context

The first iteration of this change targeted the old light theme and proposed a two-tier palette. After the dark redesign landed on `master`, the tokens are already role-based, so the design is simplified to one token file.

## Decisions

- **Single token file:** `src/styles/colors.css` holds all color values, including `--race-*`, `--hero-*`, `--badge-*` and `--color-status-*` groups. It is the only lint exemption.
- **No fallbacks:** `var(--token, #hex)` is replaced by `var(--token)`; the redesign defines the legacy aliases (`--color-error`, `--color-primary-dark`, …).
- **Alpha variants:** use `color-mix(in srgb, var(--token) N%, transparent)`, or a dedicated token (`--color-overlay`, `--color-focus-ring`). Shadows use `--color-shadow`.
- **Badge and status colors:** kept as their original solid colors (white text) via `--badge-*` and `--color-status-*`, so contrast is unchanged. Badge still accepts a data-driven `color` prop (event types).
- **Inline SVG:** `fill`/`stroke` set through `style="fill: var(--color-…)"`, since presentation attributes cannot use `var()`.

## Enforcement

`.stylelintrc.json` (run by `npm run stylelint` in CI): `color-no-hex`, `function-disallowed-list` (rgb/rgba/hsl/hsla/hwb/lab/lch/oklab/oklch/color), and a named-color rule in `declaration-property-value-disallowed-list` for color-bearing properties. Override turns the first two off for `src/styles/colors.css`. `src/tests/no-color-literals.test.ts` scans non-test `.ts` files.

## Risks

- Focus ring on the contact form changes from blue to the cyan primary.
- Pre-existing contrast gaps (default badge white on `#3b82f6`) are unchanged.
