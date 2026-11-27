## ADDED Requirements

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
- **THEN** no hero is shown and the empty state is shown instead

### Requirement: Race timeline list
Below the hero the page SHALL list the remaining races in date order as a timeline of race rows, with a heading and the number of races shown.

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

### Requirement: Filtering
The page SHALL let users filter races by free-text search on city, country or race name, by race type (single or several chips, with an ALL chip that clears the type filter), by date range, and by showing past races. The race count and the hero SHALL reflect the active filters.

#### Scenario: Type chip
- **WHEN** the user selects the CV chip
- **THEN** only CV races are listed and the CV chip is marked as selected

#### Scenario: Show past events
- **WHEN** the user enables "show past events"
- **THEN** past races are listed in date order and the hero is the next upcoming race

#### Scenario: Reset
- **WHEN** the user resets the filters
- **THEN** search, types, dates and the past-events toggle return to their defaults

#### Scenario: No results
- **WHEN** no race matches the filters
- **THEN** an empty state with a reset action is shown

### Requirement: Responsive layout
On desktop (1024px and wider) the filters SHALL be shown in a sidebar next to the hero and list; on smaller screens the filters SHALL be reachable from a collapsible control above the list. All interactive elements on the page SHALL have a touch target of at least 44px.

#### Scenario: Desktop
- **WHEN** the viewport is 1024px or wider
- **THEN** the filters, export and account call-to-action appear in a right-hand sidebar

#### Scenario: Mobile
- **WHEN** the viewport is narrower than 768px
- **THEN** the filters are collapsed behind a control and the list uses the full width

### Requirement: Export and account call-to-action
The page SHALL offer export of the currently listed races to an iCal file, and SHALL show the account call-to-action to signed-out visitors only, readable on the dark theme.

#### Scenario: Export
- **WHEN** the user taps export
- **THEN** an iCal file with the currently listed races is downloaded

#### Scenario: Signed-in user
- **WHEN** the user is signed in
- **THEN** the account call-to-action is not shown

### Requirement: Save race to my calendar
The hero and each row SHALL offer a save control (star) that adds or removes the race from the user's selection using the existing selection behaviour: kept on the device for signed-out users and synced to the account for signed-in users.

#### Scenario: Save
- **WHEN** a user taps the star on a race that is not saved
- **THEN** the race is added to their selection and the star shows as saved

#### Scenario: Unsave
- **WHEN** a user taps the star on a saved race
- **THEN** the race is removed from their selection and the star shows as not saved

#### Scenario: Star does not open the detail page
- **WHEN** the user taps the star on a row
- **THEN** the selection changes and the race detail page is not opened

### Requirement: Localised text
All text on the page SHALL come from the nl, fr and en locale files and SHALL follow the selected language, including dates and registration messages.

#### Scenario: Language switch
- **WHEN** the user switches from NL to FR
- **THEN** headings, filter labels, month names, registration messages and button labels change to French
