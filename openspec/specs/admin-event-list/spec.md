# admin-event-list Specification

## Purpose
Defines how admins see all races in the admin dashboard: grouped per year, and which year group each race belongs to.

## Requirements

### Requirement: Races are grouped by the year in their date
The admin dashboard SHALL group each race under the calendar year written in its date, whatever the admin's time zone.

#### Scenario: New Year's Day race behind UTC
- **WHEN** an admin in a time zone behind UTC (such as New York) views a race dated 1 January 2026
- **THEN** it is listed in the 2026 group

#### Scenario: New Year's Eve race ahead of UTC
- **WHEN** an admin in a time zone ahead of UTC (such as Auckland) views a race dated 31 December 2025
- **THEN** it is listed in the 2025 group

#### Scenario: Same year as the calendar
- **WHEN** a race appears both in the admin dashboard and in the calendar's previous-races section
- **THEN** both place it under the same year
