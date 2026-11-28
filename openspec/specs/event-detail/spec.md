# event-detail Specification

## Purpose
The single race page at /events/:id: all details of one race, its registration state and actions, and the rules for opening it from the calendar.

## Requirements

### Requirement: Event detail page
The application SHALL provide a page at `/events/:id` that shows one race with its title, type label, date or date range, start and end time, location (linking to a map), description, registration state with opening date, deadline and registration button, and the livestream link while the race is ongoing.

#### Scenario: Open from the list
- **WHEN** the user taps a race row or the hero title
- **THEN** the detail page for that race opens and the browser back button returns to the list with its filters kept

#### Scenario: Open directly
- **WHEN** the user opens `/events/:id` without having visited the list first
- **THEN** the race is loaded and shown

#### Scenario: Unknown race
- **WHEN** no race exists for the id
- **THEN** a not-found message with a link back to the calendar is shown

### Requirement: Registration on the detail page
The detail page SHALL show the same registration state as the list, derived from the shared registration status, and SHALL show the registration button only when registration is open and the race has a registration url.

#### Scenario: Registration open
- **WHEN** registration is open
- **THEN** a green start-light, the deadline and an INSCHRIJVEN button opening the external page in a new tab are shown

#### Scenario: Registration closed or not yet open
- **WHEN** registration is closed or opens later
- **THEN** no registration button is shown and the matching message is shown

### Requirement: Editing from the detail page
Users who may edit a race SHALL see an edit action on its detail page that opens the existing event editor; other users SHALL NOT see it.

#### Scenario: Permitted user
- **WHEN** an admin or the managing team member opens a race detail page
- **THEN** an edit action is shown

#### Scenario: Other users
- **WHEN** a signed-out or unrelated user opens a race detail page
- **THEN** no edit action is shown

### Requirement: Detail page metadata
The detail page SHALL set the document title to the race title and SHALL be reachable by a shareable URL.

#### Scenario: Title
- **WHEN** the detail page is shown
- **THEN** the document title contains the race title

### Requirement: Save from the detail page
The detail page SHALL offer a save control that adds or removes the race from the user's selection. If the account rejects the change, the control SHALL keep its previous state and a translated error SHALL be shown on the page, which stays visible. The error SHALL clear on a later successful save of the same race, when another race opens, and when the account changes.

#### Scenario: Save
- **WHEN** the user taps save on a race that is not saved
- **THEN** the race is added to their selection and the control shows it as saved

#### Scenario: Save rejected
- **WHEN** a signed-in user taps save and the account rejects the change
- **THEN** the control keeps its previous state and a translated error is shown above the actions

#### Scenario: Unsave
- **WHEN** the user taps the control on a saved race
- **THEN** the race is removed from their selection and the control shows it as not saved

#### Scenario: Unsave rejected
- **WHEN** a signed-in user taps the control on a saved race and the account rejects the removal
- **THEN** the control keeps showing the race as saved and a translated error is shown above the actions

#### Scenario: Another race opens
- **WHEN** a save is still running and the user opens another race
- **THEN** the result of that save is not shown on the other race's page

#### Scenario: Account changes
- **WHEN** the save error is shown and the user signs out or another account signs in
- **THEN** the error is cleared, and a save result from the previous account that arrives later is not shown
