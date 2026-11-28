# admin-bug-reports Specification

## Purpose
Defines how admins see and manage the bug reports users submit, in the admin dashboard's Bug reports panel.

## Requirements

### Requirement: Report status is shown as text
Each bug report in the admin Bug reports panel SHALL show its status as a coloured badge containing the status text: "Open", "In Progress" or "Resolved". A status outside these three SHALL show its raw value.

#### Scenario: Known statuses
- **WHEN** an admin opens the Bug reports panel with one open, one in-progress and one resolved report
- **THEN** their badges read "Open", "In Progress" and "Resolved"

#### Scenario: Unknown status
- **WHEN** a report has a status the panel does not know, such as "duplicate"
- **THEN** its badge reads "duplicate"
