## Why

Colors are only partly tokenized. Components reference `--color-*` variables widely, but raw hex, `rgb()` and named colors keep leaking into components, TypeScript and inline SVG, and nothing stops new ones. Several components also used `var(--token, #fallback)` with tokens that were never defined, so the fallback silently won. Restyling (the dark "Startlicht" redesign) showed how easy it is to miss these.

## What Changes

- Introduce a color palette in `src/styles/palette.css`: `--palette-*` primitives, each raw value defined once. It is the only file allowed to hold raw color values.
- Move every role-based color token into `src/styles/colors.css`, built only from palette primitives (`var(--palette-*)`, `color-mix()` for alpha variants). `variables.css` keeps spacing, typography, radii, shadows, transitions and z-index; shadows derive from `--color-shadow`.
- Add the tokens the leftover raw values needed (`--color-white`, `--color-shadow`, `--color-overlay`, `--color-focus-ring`, `--badge-*`, `--color-status-*`).
- Replace every raw color in `.svelte` files and `registration-status.ts` with tokens; drop `var(--x, #fallback)` fallbacks now that the tokens exist.
- Enforce with Stylelint (already a CI step): `color-no-hex`, a color-function ban (`color-mix()` allowed), and a named-color ban, with `palette.css` as the only exemption. Vitest guard tests cover `.ts` files, keep `palette.css` to hex primitives and keep `--palette-*` references inside `colors.css`.
- Document the rule in `docs/contribute.md` and `docs/coding-styles.md`.

## Non-Goals

- Changing the redesigned palette values.

## Impact

- Affected: `src/styles/palette.css` and `src/styles/colors.css` (new), `variables.css`, `app.css`, a handful of components, `registration-status.ts`, `.stylelintrc.json`, docs.
- No API, DB or routing changes. Rendering is unchanged except the form focus ring, which now follows the primary color.

Tracking issue: https://github.com/tclaes/bmx-cal/issues/15
