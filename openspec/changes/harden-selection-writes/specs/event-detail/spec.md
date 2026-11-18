# Spec Delta

## ADDED Requirements

### Requirement: Save from the detail page
The detail page SHALL offer a save control that adds or removes the race from the user's selection. If the account rejects the change, the control SHALL keep its previous state and a translated error SHALL be shown on the page, which stays visible.

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
