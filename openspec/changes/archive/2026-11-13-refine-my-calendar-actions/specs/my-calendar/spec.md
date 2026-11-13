# Spec Delta

## ADDED Requirements

### Requirement: Selection list
Every visitor on the personal calendar route SHALL see all upcoming races as rows with date, type label, title and location, each with a select control (a star) that adds or removes the race from their selection. A signed-out visitor's selection SHALL be kept on their device and a signed-in user's SHALL be synced to their account.

#### Scenario: Signed-out visitor selects
- **WHEN** a signed-out visitor taps the select control on a row
- **THEN** the race is selected on this device and the selected count increases

#### Scenario: Selection from the calendar
- **WHEN** a signed-out visitor saved races on the public calendar and opens the personal calendar route
- **THEN** those races are shown as selected

### Requirement: Selection bar and actions
When at least one race is selected, the page SHALL show one selection bar with the number of selected races and a control to clear the selection, followed by the actions. For signed-in users the actions SHALL be an accent export action and an outlined "save calendar" action of equal height and width, stacked at full width on narrow screens and side by side on wide screens. The "save calendar" action SHALL NOT be shown to signed-out visitors.

#### Scenario: Signed-in with a selection
- **WHEN** a signed-in user has 23 races selected
- **THEN** the bar shows "23 selected" with a clear control and an accent export action and an outlined "save calendar" action of equal size

#### Scenario: Nothing selected
- **WHEN** no race is selected
- **THEN** the selection bar and the actions are not shown

#### Scenario: Touch targets
- **WHEN** the bar is shown
- **THEN** every control in it has a touch target of at least 44px

### Requirement: Account required to export and save
A signed-out visitor SHALL NOT be able to export the selection or save a calendar. In place of those actions the page SHALL show an accent action that leads to creating an account and a link to sign in.

#### Scenario: Signed-out with a selection
- **WHEN** a signed-out visitor has races selected
- **THEN** the bar shows the count and the clear control, and a "create an account to export" action and a sign-in link instead of export and save

#### Scenario: Create an account
- **WHEN** the visitor taps the create-account action
- **THEN** the registration page opens

#### Scenario: Selection survives signing up
- **WHEN** a visitor selected races while signed out and then signs in or creates an account
- **THEN** those races join the account's selection instead of being replaced by it

#### Scenario: Readable action
- **WHEN** the create-account action is shown
- **THEN** its text meets AA contrast against its background on the dark theme and its touch target is at least 44px

### Requirement: Clear selection with undo
Clearing the selection SHALL remove all selected races at once without a confirmation dialog and SHALL show a message with the number of cleared races and an undo action for 6 seconds. Undo SHALL restore exactly the cleared selection.

#### Scenario: Clear and undo
- **WHEN** the user clears 23 selected races and taps undo within 6 seconds
- **THEN** the same 23 races are selected again and the message disappears

#### Scenario: Selection changed meanwhile
- **WHEN** the user picks another race during the 6 seconds and then taps undo
- **THEN** the selection is exactly the one from before clearing

#### Scenario: Keyboard focus
- **WHEN** the selection is cleared
- **THEN** keyboard focus moves to the undo action

#### Scenario: Undo expires
- **WHEN** 6 seconds pass without undo
- **THEN** the message disappears and the selection stays empty

### Requirement: Notification settings behind a flag
The deadline notification settings SHALL only be shown to signed-in users while the `notifications` feature flag is on. While it is off, the settings block SHALL NOT be shown and no push subscription calls SHALL be made from the page.

#### Scenario: Flag off
- **WHEN** the notifications flag is off
- **THEN** the page shows no notification block and makes no push subscription check

#### Scenario: Flag on
- **WHEN** the flag is on and a signed-in user opens the page
- **THEN** the notification block is shown and behaves as before

#### Scenario: Signed out with flag on
- **WHEN** the flag is on and the visitor is signed out
- **THEN** no notification block is shown

## REMOVED Requirements

### Requirement: Signed-in selection list
**Reason**: Replaced by the visitor-wide "Selection list" requirement; signed-out visitors now use the same list.
**Migration**: Use the "Selection list" requirement.

### Requirement: Signed-out preview
**Reason**: Signed-out visitors now see the real list and their own selection instead of a sample preview, and sign-up is offered through the account action.
**Migration**: The demo page and its sample data are deleted; the route keeps its title and description.
