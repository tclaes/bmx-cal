# my-calendar Specification

## Purpose
The personal calendar pages where a visitor picks races, previews or saves a personal calendar and exports it, presented in the same visual language as the public calendar.

## Requirements

### Requirement: Race type presentation
Every race type shown on the personal calendar pages SHALL be presented with the Startlicht race type label or its token colour, so that a type looks the same here as on the public calendar. The colour stored with the event type in the database SHALL NOT be used for display. Types without a design token SHALL use the neutral style.

#### Scenario: Same type, same look
- **WHEN** a European Cup race appears on the public calendar and on the personal calendar
- **THEN** both show the same blue EC label with the white stripe

#### Scenario: Unknown type
- **WHEN** a race has a type without a design token (for example Training)
- **THEN** it is shown with the neutral label and remains selectable

### Requirement: Signed-in selection list
A signed-in user SHALL see all races as rows with date, type label, title and location, each with a save control that adds or removes the race from the personal selection, and the number of selected races SHALL be shown.

#### Scenario: Select a race
- **WHEN** the user taps the save control on a row
- **THEN** the race is selected, the control shows as saved and the selected count increases

#### Scenario: Open details
- **WHEN** the user taps the title of a row
- **THEN** the race detail page opens and the selection does not change

### Requirement: Select by type
The page SHALL offer one chip per race type with the number of races of that type. A chip SHALL show whether all, some or none of its races are selected, and tapping it SHALL select all races of that type, or deselect them when all are already selected.

#### Scenario: Select all of a type
- **WHEN** the user taps the CV chip while no CV race is selected
- **THEN** all CV races become selected and the chip shows as fully selected

#### Scenario: Partly selected
- **WHEN** some but not all CV races are selected
- **THEN** the CV chip shows a partly selected state

#### Scenario: Deselect all of a type
- **WHEN** the user taps the CV chip while all CV races are selected
- **THEN** all CV races are deselected

### Requirement: Signed-out preview
A signed-out visitor on the personal calendar route SHALL see a preview that uses the same row anatomy as the signed-in list, with sample races, the benefits of an account and actions to create an account or sign in. All text and controls SHALL be readable on the dark theme.

#### Scenario: Preview matches the real page
- **WHEN** a signed-out visitor opens the personal calendar route
- **THEN** the preview rows show a date column, type label, title and location like the signed-in rows

#### Scenario: Readable actions
- **WHEN** the create-account button is shown
- **THEN** its text meets AA contrast against its background and its touch target is at least 44px

### Requirement: Saved calendars and export
The page SHALL let a signed-in user export the selection to an iCal file and save it as a named calendar, and SHALL list saved calendars. The save dialog and the saved calendars list SHALL follow the dark theme tokens and have touch targets of at least 44px.

#### Scenario: Export
- **WHEN** the user exports with at least one race selected
- **THEN** an iCal file with the selected races is downloaded

#### Scenario: Export without selection
- **WHEN** the user exports with no race selected
- **THEN** an error asks to select at least one race and no file is downloaded
