# Spec Delta

## ADDED Requirements

### Requirement: Selection bar and actions
When at least one race is selected, the signed-in personal calendar SHALL show one selection bar with the number of selected races and a control to clear the selection, followed by the export and save actions. The two actions SHALL have the same height and width, export SHALL be the only accent-filled control, and the actions SHALL stack at full width on narrow screens and sit side by side on wide screens. The save action SHALL be shown to signed-in users only.

#### Scenario: Selection exists
- **WHEN** 23 races are selected
- **THEN** the bar shows "23 selected" with a clear control, and below or beside it an accent export action and an outlined save action of equal size

#### Scenario: Signed-out visitor
- **WHEN** a signed-out visitor has selected races
- **THEN** the bar shows the count and clear control and only the export action, at full width on narrow screens

#### Scenario: Nothing selected
- **WHEN** no race is selected
- **THEN** the selection bar and the actions are not shown

#### Scenario: Touch targets
- **WHEN** the bar is shown
- **THEN** every control in it has a touch target of at least 44px

### Requirement: Clear selection with undo
Clearing the selection SHALL remove all selected races at once without a confirmation dialog and SHALL show a message with the number of cleared races and an undo action for 6 seconds. Undo SHALL restore exactly the cleared selection.

#### Scenario: Clear and undo
- **WHEN** the user clears 23 selected races and taps undo within 6 seconds
- **THEN** the same 23 races are selected again and the message disappears

#### Scenario: Undo expires
- **WHEN** 6 seconds pass without undo
- **THEN** the message disappears and the selection stays empty

### Requirement: Notification settings behind a feature flag
The deadline notification settings on the personal calendar SHALL only be available when the notifications feature flag is on. The flag SHALL be off unless explicitly enabled by configuration. While it is off, the settings block SHALL NOT be shown and no push subscription calls SHALL be made from the page.

#### Scenario: Flag off
- **WHEN** the notifications flag is not enabled
- **THEN** the signed-in personal calendar shows no notification block and makes no push subscription check

#### Scenario: Flag on
- **WHEN** the notifications flag is enabled by configuration
- **THEN** the notification block is shown and behaves as before
