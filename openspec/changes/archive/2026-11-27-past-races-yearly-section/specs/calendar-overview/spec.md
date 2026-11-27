# Spec Delta

## MODIFIED Requirements

### Requirement: Next race hero
The calendar page SHALL open with a hero for the next upcoming race that shows its day and month, title, location, race type, registration state as a start-light, and a registration button when registration is open.

#### Scenario: Next race with open registration
- **WHEN** the next upcoming race has open registration
- **THEN** the hero shows its date, title, location, type label and a green start-light
- **AND** an INSCHRIJVEN button linking to the external registration page and the registration deadline are shown

#### Scenario: Next race not yet open
- **WHEN** registration for the next race opens in the future
- **THEN** the hero shows the opening date and no registration button

#### Scenario: No upcoming race
- **WHEN** there is no upcoming race that matches the active filters
- **THEN** no hero is shown
- **AND** the previous-races section is shown when past races are shown and match the filters, otherwise the empty state is shown

### Requirement: Race timeline list
Below the hero the page SHALL list the remaining upcoming races in date order as a timeline of race rows, with a heading and the number of upcoming races shown. Past races SHALL NOT appear in this list.

#### Scenario: Rows in date order
- **WHEN** several upcoming races exist
- **THEN** each race appears once as a row with its day and month, type label, title, location line and registration state
- **AND** the first race is not repeated outside the hero

#### Scenario: Row actions
- **WHEN** a row has open registration
- **THEN** it shows a registration button that is a separate link from the row link

#### Scenario: Ongoing race with livestream
- **WHEN** a race is ongoing and has a livestream url
- **THEN** its row offers a livestream link

#### Scenario: Count covers upcoming races only
- **WHEN** past races are shown
- **THEN** the number next to the list heading counts only the upcoming races in the list

### Requirement: Filtering
The page SHALL let users filter races by free-text search on city, country or race name, by race type (single or several chips, with an ALL chip that clears the type filter), by date range, and by showing past races. The race count and the hero SHALL reflect the active filters.

#### Scenario: Type chip
- **WHEN** the user selects the CV chip
- **THEN** only CV races are listed and the CV chip is marked as selected

#### Scenario: Show past events
- **WHEN** the user enables "show past events"
- **THEN** the hero is the next upcoming race and the upcoming races are listed in date order
- **AND** past races that match the other filters are listed in the previous-races section below the upcoming races

#### Scenario: Reset
- **WHEN** the user resets the filters
- **THEN** search, types, dates and the past-events toggle return to their defaults

#### Scenario: No results
- **WHEN** no race matches the filters
- **THEN** an empty state with a reset action is shown

## ADDED Requirements

### Requirement: Previous races section
When past races are shown, the page SHALL list them in a separate section below the upcoming races, under a "Previous races" heading, grouped per calendar year of the race date. Each year SHALL have a heading with the year and its number of races. Years SHALL be ordered newest first, and races within a year most recent first.

#### Scenario: Section below upcoming races
- **WHEN** "show past events" is on and both upcoming and past races match the filters
- **THEN** the previous-races section with its heading appears after the last upcoming race

#### Scenario: Grouped per year, newest first
- **WHEN** the shown past races fall in 2024 and 2025
- **THEN** the 2025 group comes before the 2024 group
- **AND** each group's heading shows the year and the number of races in that group
- **AND** within each group the most recent race comes first

#### Scenario: Past events hidden
- **WHEN** "show past events" is off
- **THEN** no previous-races section and no year headings are shown

#### Scenario: Only past races match
- **WHEN** "show past events" is on and the filters match only past races
- **THEN** no hero, upcoming list or empty state is shown
- **AND** the previous-races section is shown with its year groups

#### Scenario: Localised headings
- **WHEN** the user switches the language
- **THEN** the section heading and the year race counts are shown in that language
