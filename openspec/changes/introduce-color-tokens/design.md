## Context

Audit and rationale are in tracking issue #15. Existing `--color-*` names are kept; only their values become aliases of `--palette-*` primitives.

## Token structure

```css
:root {
  /* Tier 1: primitives, only referenced from this file */
  --palette-blue-600: #2563eb;
  --palette-blue-700: #1d4ed8;
  --palette-red-600: #dc2626;
  /* … */

  /* Tier 2: semantic, referenced by components */
  --color-primary: var(--palette-blue-600);
  --color-primary-hover: var(--palette-blue-700);
  --color-danger-hover: var(--palette-red-600);
}
```

Existing `--color-*` names are kept so current usages keep working untouched. Only their values become aliases.

## Where raw values are allowed

Only `src/styles/colors.css`. That file is the single exemption in the lint config (via `overrides`).

## Enforcement (Stylelint, in `.stylelintrc.json`)

- `color-no-hex: true`
- `function-disallowed-list: ["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color"]`. `color-mix()` stays allowed when its inputs are `var()` tokens, which covers alpha variants (e.g. focus rings).
- `declaration-property-value-disallowed-list` for color-bearing properties (`color`, `background(-color)`, `border*`, `outline*`, `fill`, `stroke`, `box-shadow`, `text-shadow`, `caret-color`, …) disallowing named colors (`white`, `black`, `red`, …) while still allowing `transparent`, `currentColor`, `inherit`, `none`.
- `overrides` entry that turns these rules off for `src/styles/colors.css`.
- The existing `npm run stylelint` script is already run in CI. Confirm it is a required check on `master`.

## TypeScript

Stylelint does not cover `.ts`. Remove color literals from `registration-status.ts` (return a token name / `var(--color-status-*)`), and add a small guard test (Vitest) that scans `src/**/*.ts` for `#rrggbb` / `rgb(` literals outside test files, so the rule has no blind spot.

## Collapsing near-duplicates

| Found | Map to |
| --- | --- |
| `#1d4ed8` (×15) | `--color-primary-hover` |
| `#dc2626` (×5) | `--color-danger-hover` |
| `#ffffff`, `white` | `--color-bg-primary` or `--color-white` depending on role (surface vs. on-color text) |
| `#f1f5f9` | `--color-bg-tertiary` / `--color-secondary-light` |
| `#6b7280`, `#e5e7eb`, `#f8f9fa` | nearest slate token (`--color-text-secondary`, `--color-border`, `--color-bg-secondary`) |
| `#fef2f2`, `#fecaca`, `#fee`, `#ff0000` | `--color-danger-light` (+ new `--color-danger-border` if needed) |
| `#dcfce7`, `#a7f3d0`, `#16a34a` | `--color-success-light` / new `--color-success-border` / `--color-success-text` |
| `#f0f7ff`, `#e8f2ff`, `#3b82f6` | `--color-primary-light` / new `--color-info-*` |

The migration PR should list every mapping that changes the rendered color by more than a trivial amount, with before/after screenshots.

## Risks

- Accidental visual changes from collapsing near-duplicates. Mitigation: per-feature commits, before/after screenshots for the touched pages, and calling out intentional shifts.
- Status colors currently chosen for contrast (`#b45309`, `#047857`) must keep WCAG AA contrast on their backgrounds when tokenized.
