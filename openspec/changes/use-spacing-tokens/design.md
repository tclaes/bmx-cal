# Design

## Decision: snap to the existing scale

The 9-step scale stays as it is. Off-scale literals snap to the nearest token, so pixels shift by 2px at most. Adding in-between tokens (`--spacing-2xs`, `--spacing-md-minus`, …) to keep exact pixels was rejected: it would turn one-off values into permanent scale steps, which defeats the point of a scale. Renaming `--spacing-sm-plus` to a numeric scheme is a separate change.

## Scale

| Token | Value |
|---|---|
| `--spacing-xxs` | 2px |
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-sm-plus` | 12px |
| `--spacing-md` | 16px |
| `--spacing-lg` | 24px |
| `--spacing-xl` | 32px |
| `--spacing-2xl` | 48px |
| `--spacing-3xl` | 64px |

## Mapping (1rem = 16px)

| Literal | Token |
|---|---|
| `0.1rem`, `2px`, `0.125rem`, `0.15rem` | `--spacing-xxs` |
| `0.2rem`, `0.25rem`, `0.25em` | `--spacing-xs` |
| `6px`, `0.4rem`, `0.45rem`, `0.5rem`, `0.6rem` | `--spacing-sm` |
| `0.625rem`, `0.75rem` | `--spacing-sm-plus` |
| `1rem` | `--spacing-md` |
| `10rem` | `calc(var(--spacing-3xl) * 2.5)` (exact, reserves room for the absolute team action button) |

Shorthands map per value, for example `0.5rem 0.75rem` becomes `var(--spacing-sm) var(--spacing-sm-plus)`. When a value sits exactly between two tokens (`6px`, `10px`), the mapping table from issue #14 decides.

## Enforcement

`declaration-property-value-disallowed-list` in `.stylelintrc.json` matches the properties `margin*`, `padding*`, `gap`, `row-gap` and `column-gap`, and rejects any value containing a number followed by `px`, `rem` or `em`. Token names like `--spacing-2xl` don't match because the digit is followed by `xl`. `0`, `auto`, `%`, `inherit` and `calc()` of tokens pass. Stylelint already runs in CI (`npm run stylelint`), so no new CI step is needed.

The `.sr-only` utility in `LoadingSpinner.svelte` keeps `margin: -1px` (the standard visually-hidden pattern) behind a `stylelint-disable-next-line` comment that gives the reason.

## Risks

Small shifts on dense chips and badges (team-manager badges, document status pills, register hint). They are 2px or less and were checked visually on the affected pages.
