# design-system Specification

## Purpose
TBD - created by archiving change design-system-foundation. Update Purpose after archive.

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
