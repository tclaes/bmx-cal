## Why

Hardcoded colors make the palette drift (three different grays, two different greens, four blues), make restyling or theming (e.g. dark mode) a find-and-replace exercise, and hide accessibility problems because contrast can't be reasoned about in one place. We already have the start of a token system; the missing parts are completeness and enforcement.

## What Changes

- Restructure color tokens into two tiers in `src/styles/colors.css`:
  1. **Primitive palette**: raw values only, named by hue and step (`--palette-blue-600`, `--palette-slate-500`, …). Components never reference these.
  2. **Semantic tokens**: role-based names that alias the palette (`--color-primary`, `--color-text-muted`, `--color-danger-bg`, …). Components only reference these.
- Add the semantic tokens the codebase is currently missing, so every existing raw value has a home: `--color-white`/`--color-black` (or `--color-on-primary`, `--color-surface`), `--color-success-text`, `--color-warning-text`, `--color-danger-text`, `--color-info-*`, `--color-overlay`, `--color-focus-ring`, `--color-shadow` (base for `--shadow-*`), and registration-status colors (`--color-status-closed|opens-soon|open|register-now`).
- Migrate all raw colors in `.svelte`/`.css` to tokens. Collapse near-duplicates onto the nearest existing token; only add a new token when a distinct role exists. Any visible shift must be reviewed (see Design).
- Make `registration-status.ts` return a status key / CSS variable reference instead of a hex string.
- Enforce with Stylelint in CI so raw colors cannot be reintroduced.
- Document the rules in `docs/contribute.md`.

## Non-Goals

- Shipping a dark theme (the two-tier structure should make it a follow-up, not part of this change).
- Tokenizing non-color values (spacing is already tokenized; others are out of scope).
- Redesigning the palette. Values stay the same unless collapsing a near-duplicate requires a small shift.

## Impact

- Affected: `src/styles/colors.css`, ~25 components, `registration-status.ts`, `.stylelintrc.json`, `docs/contribute.md`, CI `stylelint` step.
- No API, DB or routing changes. Visual diff should be none or negligible; deliberate shifts are called out in the PR.

Tracking issue: https://github.com/tclaes/bmx-cal/issues/15
