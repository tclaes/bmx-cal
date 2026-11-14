## Why

Colors are only partly tokenized. Components reference `--color-*` variables widely, but raw hex, `rgb()` and named colors keep leaking into components, TypeScript and inline SVG, and nothing stops new ones. Several components also used `var(--token, #fallback)` with tokens that were never defined, so the fallback silently won. Restyling (the dark "Startlicht" redesign) showed how easy it is to miss these.

## What Changes

- Move every color token into `src/styles/colors.css`, the single file allowed to hold raw color values. `variables.css` keeps spacing, typography, radii, shadows, transitions and z-index; shadows derive from `--color-shadow`.
- Add the tokens the leftover raw values needed (`--color-white`, `--color-shadow`, `--color-overlay`, `--color-focus-ring`, `--badge-*`, `--color-status-*`).
- Replace every raw color in `.svelte` files and `registration-status.ts` with tokens; drop `var(--x, #fallback)` fallbacks now that the tokens exist.
- Enforce with Stylelint (already a CI step): `color-no-hex`, a color-function ban (`color-mix()` allowed), and a named-color ban, with `colors.css` as the only exemption. A Vitest guard test covers `.ts` files.
- Document the rule in `docs/contribute.md` and `docs/coding-styles.md`.

## Non-Goals

- A separate `--palette-*` primitive tier. The redesigned tokens are already role-based; revisit if a second theme appears.
- Changing the redesigned palette values.

## Impact

- Affected: `src/styles/colors.css` (new), `variables.css`, `app.css`, a handful of components, `registration-status.ts`, `.stylelintrc.json`, docs.
- No API, DB or routing changes. Rendering is unchanged except the form focus ring, which now follows the primary color.

Tracking issue: https://github.com/tclaes/bmx-cal/issues/15
