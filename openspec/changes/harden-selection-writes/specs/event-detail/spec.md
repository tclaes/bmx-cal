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
