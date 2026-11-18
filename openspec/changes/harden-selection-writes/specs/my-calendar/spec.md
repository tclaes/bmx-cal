# Spec Delta

## MODIFIED Requirements

### Requirement: Clear selection with undo
Clearing the selection SHALL remove all selected races at once without a confirmation dialog and SHALL show a message with the number of cleared races and an undo action for 6 seconds. Undo SHALL restore exactly the cleared selection. If clearing or restoring fails, the page SHALL show a translated error; a failed restore SHALL offer the same undo again for another 6 seconds so the user can retry within that window.

#### Scenario: Clear and undo
- **WHEN** the user clears 23 selected races and taps undo within 6 seconds
- **THEN** the same 23 races are selected again and the message disappears

#### Scenario: Selection changed meanwhile
- **WHEN** the user picks another race during the 6 seconds and then taps undo
- **THEN** the selection is exactly the one from before clearing

#### Scenario: Keyboard focus
- **WHEN** the selection is cleared
- **THEN** keyboard focus moves to the undo action

#### Scenario: Focus after undo
- **WHEN** the user taps undo and the races are restored
- **THEN** keyboard focus moves to the clear control

#### Scenario: Undo expires
- **WHEN** 6 seconds pass without undo
- **THEN** the message disappears and the selection stays empty

#### Scenario: Clearing fails
- **WHEN** clearing the selection fails
- **THEN** the selection is unchanged on this device and in the account, a translated error is shown and no undo message appears

#### Scenario: Restoring fails
- **WHEN** the user taps undo and restoring the races fails
- **THEN** a translated error asks to try again, the undo message with the same count is shown again for 6 seconds with keyboard focus on it, and tapping undo again restores exactly the cleared selection

#### Scenario: Cleared again during undo
- **WHEN** the user clears the selection again while an undo is still being applied
- **THEN** the newer clear wins and the earlier cleared races are not added back

#### Scenario: Newer clear fails during undo
- **WHEN** the user clears again while an undo is still being applied and that clear fails
- **THEN** the failed clear does not cancel the undo, which still restores the cleared races

#### Scenario: Account rejects a change
- **WHEN** the account rejects saving or removing a race (on select, deselect, clear or undo, from My Events, the race list or a race's detail page)
- **THEN** this device keeps showing what the account has and a translated error is shown above the races, which stay visible

### Requirement: Saved calendars and export
The page SHALL let a signed-in user export the selection to an iCal file and save it as a named calendar, and SHALL list saved calendars. The save dialog and the saved calendars list SHALL follow the dark theme tokens and have touch targets of at least 44px. Loading a saved calendar SHALL replace the selection as one change: if it fails, this device keeps its previous selection and the account is put back to what it held (best effort).

#### Scenario: Export
- **WHEN** the user exports with at least one race selected
- **THEN** an iCal file with the selected races is downloaded

#### Scenario: Export without selection
- **WHEN** the user exports with no race selected
- **THEN** an error asks to select at least one race and no file is downloaded

#### Scenario: Load a saved calendar
- **WHEN** the user loads a saved calendar
- **THEN** the selection becomes exactly that calendar's races

#### Scenario: Loading a saved calendar fails
- **WHEN** loading a saved calendar fails part-way
- **THEN** the previous selection is kept on this device and a translated error says so

#### Scenario: Saved calendar cannot be read
- **WHEN** reading the saved calendar's races fails
- **THEN** nothing changes and the same translated error is shown
