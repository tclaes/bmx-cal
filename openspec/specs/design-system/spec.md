# design-system Specification

## Purpose
The Startlicht design foundation: colour, type and spacing tokens, race type labels, the registration start-light, the race row and the shared UI components every screen is built from.

## Requirements

### Requirement: Design tokens
The application SHALL define colours, typography, spacing and radii as CSS custom properties in `src/styles/variables.css`, and components SHALL use these tokens instead of hardcoded values.

#### Scenario: Component uses tokens
- **WHEN** a shared component is styled
- **THEN** its colours and font settings reference custom properties and contain no hex literals

### Requirement: Race type colours
The application SHALL provide label, stripe and dot-ring colours for the race types CV, TC, CW, 3NC, EC and WC, and an unknown type SHALL fall back to a neutral style.

#### Scenario: Known type
- **WHEN** a race of type EC is rendered
- **THEN** its label, stripe and dot use the EC token set

#### Scenario: Unknown type
- **WHEN** a race has a type without tokens
- **THEN** a neutral label is shown and nothing breaks

### Requirement: Registration start-light
The application SHALL show registration state with a start-light indicator driven by the existing registration status (open, opens soon, closed).

#### Scenario: Registration open
- **WHEN** a race is open for registration
- **THEN** the indicator is green and an INSCHRIJVEN button is shown

#### Scenario: Registration not yet open
- **WHEN** registration opens in the future
- **THEN** the opening time is shown and no button is shown

### Requirement: Clickable race row
A race row SHALL be fully clickable to its detail target while the registration button remains an independent link with a touch target of at least 44px.

#### Scenario: Tap on row
- **WHEN** the user taps any part of a row outside the registration button
- **THEN** the race detail is opened

#### Scenario: Tap on registration button
- **WHEN** the user taps INSCHRIJVEN
- **THEN** the external registration page opens and the row link is not triggered

### Requirement: Logo and app icons
The application SHALL use logo B1 (gear ring with calendar page, orange header and dot) in the header, favicon and PWA icons, and `theme-color` SHALL match the dark background.

#### Scenario: Header
- **WHEN** the app loads
- **THEN** the header shows logo B1 with the wordmark

### Requirement: Spacing uses design tokens
All `margin`, `padding`, `gap`, `row-gap` and `column-gap` declarations (including the legacy `grid-*gap` aliases) in application styles SHALL use the `--spacing-*` tokens defined in `src/styles/variables.css`.

#### Scenario: Component styles use tokens
- **WHEN** a `.svelte` `<style>` block or a `.css` file under `src/` declares margin, padding or gap
- **THEN** every non-zero length is `var(--spacing-*)` or a `calc()` expression with no hard-coded lengths, which may combine spacing tokens with other design tokens (for example `calc(var(--touch-target-min) + var(--spacing-sm))`)

#### Scenario: Permitted literals
- **WHEN** a spacing declaration uses `0`, `auto`, `inherit`, `initial`, `unset` or a percentage
- **THEN** it is allowed without a token

#### Scenario: Changing a token
- **WHEN** the value of `--spacing-md` is changed in `variables.css`
- **THEN** every margin, padding and gap that used 16px reflects the new value without further edits

### Requirement: Spacing regression prevention
The lint step that runs in CI SHALL fail when a spacing declaration introduces a hard-coded `px`, `rem` or `em` length, in any letter case.

#### Scenario: Hard-coded value added
- **WHEN** a contributor adds `padding: 10px` or `padding: var(--spacing-sm) 0.75rem` to a component
- **THEN** `npm run stylelint` fails and reports the file and line

#### Scenario: Documented exception
- **WHEN** a declaration needs a literal for a technical reason, such as the visually-hidden `margin: -1px`
- **THEN** it carries a `stylelint-disable-next-line` comment that states the reason
