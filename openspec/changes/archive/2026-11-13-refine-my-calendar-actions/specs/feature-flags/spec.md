# Spec Delta

## Purpose
Named on/off switches stored in the database so an admin can turn unfinished or risky features on and off without a deploy.

## ADDED Requirements

### Requirement: Flag storage and visibility
Feature flags SHALL be stored in the database with a unique key, an enabled value that is off by default, and who changed it last and when. Every visitor, signed in or not, SHALL be able to read the flags. Only admins SHALL be able to create, change or delete them.

#### Scenario: Anyone can read
- **WHEN** a signed-out visitor loads the app
- **THEN** the current flag values are readable

#### Scenario: Only admins write
- **WHEN** a user who is not an admin tries to change a flag
- **THEN** the change is rejected and the flag keeps its value

### Requirement: Fail closed
A feature SHALL be treated as off when its flag does not exist, has not been loaded yet, or cannot be read.

#### Scenario: Loading
- **WHEN** the flags have not finished loading
- **THEN** every gated feature is off

#### Scenario: Read error
- **WHEN** reading the flags fails
- **THEN** every gated feature stays off and the page keeps working

### Requirement: Admin management
Admins SHALL see all flags on the admin dashboard with their state and SHALL be able to turn each on or off. A change SHALL take effect for visitors on their next load of the app and SHALL record who made it and when.

#### Scenario: Turn a flag on
- **WHEN** an admin turns the notifications flag on
- **THEN** the flag is stored as enabled with the admin and time recorded
- **AND** visitors loading the app afterwards see the feature

#### Scenario: Non-admin
- **WHEN** a user who is not an admin opens the dashboard route
- **THEN** no flag controls are available to them

### Requirement: Notifications flag
A flag with the key `notifications` SHALL exist and SHALL be off until an admin turns it on.

#### Scenario: Default
- **WHEN** the system is set up
- **THEN** the notifications flag exists and is off
