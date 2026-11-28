# Spec Delta

## MODIFIED Requirements

### Requirement: Selection bar and actions
When at least one race is selected, the page SHALL show one selection bar with the number of selected races and a control to clear the selection, followed by the actions. For signed-in users the actions SHALL be an accent export action and an outlined "save calendar" action of equal height and width, stacked at full width on narrow screens and side by side on wide screens. The "save calendar" action SHALL NOT be shown to signed-out visitors.

The bar SHALL be a single card on every screen width. The count and the clear control form the top row and the actions sit in a row below it. Every row SHALL be inside the card's inner padding, which SHALL be the same on all four sides (the medium spacing token, 16px), so no control or its touch target reaches into that padding. On wide screens the signed-in actions keep the width of their content instead of stretching across the card.

#### Scenario: Signed-in with a selection
- **WHEN** a signed-in user has 23 races selected
- **THEN** the bar shows "23 selected" with a clear control and an accent export action and an outlined "save calendar" action of equal size

#### Scenario: Nothing selected
- **WHEN** no race is selected
- **THEN** the selection bar and the actions are not shown

#### Scenario: Touch targets
- **WHEN** the bar is shown
- **THEN** every control in it has a touch target of at least 44px

#### Scenario: Even padding on wide screens
- **WHEN** a signed-in user with races selected views the page at 768px wide or more
- **THEN** the count row is on top, the "save calendar" and export actions sit side by side below it at the width of their content and aligned to the start, the gap to the card's left and bottom edges equals the card's top padding, and the gap to the right edge is at least that padding

#### Scenario: Even padding on narrow screens
- **WHEN** a signed-in user with races selected views the page below 768px wide
- **THEN** the count row and both actions, stacked at full width, sit inside one card with the same inner padding on all sides

#### Scenario: Signed-out layout
- **WHEN** a signed-out visitor with races selected views the page at any width
- **THEN** the reason text, the create-account action and the sign-in link sit below the count row inside the same padded card

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
- **THEN** a translated error is shown and no undo message appears

#### Scenario: Restoring fails
- **WHEN** the user taps undo and restoring the races fails
- **THEN** a translated error asks to try again, the undo message with the same count is shown again for 6 seconds with keyboard focus on it, and tapping undo again restores exactly the cleared selection

#### Scenario: Cleared again during undo
- **WHEN** the user clears the selection again while an undo is still being applied
- **THEN** the newer clear wins and the earlier cleared races are not added back

#### Scenario: Newer clear fails during undo
- **WHEN** the user clears again while an undo is still being applied and that clear fails
- **THEN** the failed clear does not cancel the undo, which still restores the cleared races
