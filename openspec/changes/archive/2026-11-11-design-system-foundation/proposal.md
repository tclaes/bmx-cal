## Why

The current UI is functional but plain. Design proposal B ("Startlicht") gives BMX Kalender a racing feel (dark theme, cyan/anthracite gear logo, orange accent, start-light registration indicator) while staying quick to scan. Before rebuilding screens we need a shared foundation, so the screens can be converted one by one without duplicating colours, type styles or logic.

## What Changes

- Replace the values in `src/styles/variables.css` with the design B tokens: surfaces, text, cyan, orange, start-light green, type scale (Barlow Condensed italic for dates and titles, Barlow for body), spacing, radii, 44px touch target.
- Add race type tokens (label background, label text, stripe, dot ring) for CV, TC, CW, 3NC, EC and WC.
- Add logo B1 as a reusable component plus favicon, PWA icons and `theme-color`.
- Restyle `Button`, `Badge` and `Navigation` on the new tokens.
- Add new components: `TypeLabel`, `StartLight`, `RaceRow` (whole row is a link, the registration button stays separately clickable).
- `StartLight` and `RaceRow` take their state from the existing `registration-status.ts` (open / opens soon / closed); no second implementation of that logic.

## Capabilities

### New Capabilities
- `design-system`: tokens, race type colours, logo and the shared UI components used by all screens.

### Modified Capabilities
None. Screen layouts (calendar list, hero, filters, desktop) are out of scope and follow in `redesign-calendar-screens`.

## Impact

- `src/styles/*.css`, `src/shared/components/*`, `index.html`, `public/` icons.
- New unit tests for `TypeLabel`, `StartLight`, `RaceRow`.
- Must pass the existing CI gate (test, check, build) plus stylelint and sheriff boundaries.
- Visual change only; no data or API changes.
