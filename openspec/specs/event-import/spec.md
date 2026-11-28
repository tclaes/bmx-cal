# event-import Specification

## Purpose
Defines how admins and team managers review the races found in an uploaded file or image before importing them, starting with the Confirm Import list.

## Requirements

### Requirement: Confirm Import rows are readable
Every text element in a Confirm Import event row (title, dates, the Type and Location labels and values, and the Edit hint) SHALL have a contrast ratio of at least 4.5:1 against the row background.

#### Scenario: Reviewing an import
- **WHEN** an admin reaches Confirm Import after uploading a file with races
- **THEN** each row's title, dates, type, location and Edit hint are readable, with at least 4.5:1 contrast against the row

### Requirement: Confirm Import row layout
Each Confirm Import row SHALL show the race title first, its date or date range below it, and one line with the type and location below that, with an Edit hint on the right of the row. The same layout SHALL apply at every viewport width.

#### Scenario: Desktop
- **WHEN** the Confirm Import list is shown at 1280px
- **THEN** each row's date and its type and location line sit below the title, and the Edit hint sits at the right edge of the row

#### Scenario: Mobile
- **WHEN** the Confirm Import list is shown at 375px
- **THEN** each row uses the same order (title, date, type and location) and the Edit hint stays on the right

#### Scenario: Unknown location
- **WHEN** a race's location is not yet a known location
- **THEN** its type and location line still shows how that location will be resolved

### Requirement: Rows open the event for editing
Activating a Confirm Import row SHALL open that race in the event editor.

#### Scenario: Editing from the list
- **WHEN** the admin activates the second row in the Confirm Import list
- **THEN** the editor shows the second race
