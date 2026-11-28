# Spec Delta

## MODIFIED Requirements

### Requirement: Save race to my calendar
The hero and each row SHALL offer a save control (star) that adds or removes the race from the user's selection using the existing selection behaviour: kept on the device for signed-out users and synced to the account for signed-in users. If the account rejects the change, the star SHALL keep its previous state and a translated error SHALL be shown above the list without hiding it.

#### Scenario: Save
- **WHEN** a user taps the star on a race that is not saved
- **THEN** the race is added to their selection and the star shows as saved

#### Scenario: Unsave
- **WHEN** a user taps the star on a saved race
- **THEN** the race is removed from their selection and the star shows as not saved

#### Scenario: Star does not open the detail page
- **WHEN** the user taps the star on a row
- **THEN** the selection changes and the race detail page is not opened

#### Scenario: Save rejected
- **WHEN** a signed-in user taps the star and the account rejects the change
- **THEN** the star keeps its previous state and a translated error is shown above the list, which stays visible
