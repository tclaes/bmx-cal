# Spec Delta

## Purpose

Lets the maintainer ship new releases to every running copy of the app, as either an optional feature update or a mandatory fix, and makes sure users actually end up on the new version.

## ADDED Requirements

### Requirement: Published release information
Every deployment SHALL publish the deployed release's version, its minimum required version and its localised release notes (nl, fr, en) at a fixed public URL. This information SHALL NOT be cached by browsers or the service worker, and it SHALL always match the deployed app bundle.

#### Scenario: Fresh release information after deploy
- **WHEN** version 1.4.0 is deployed and a client requests the release information
- **THEN** it receives version 1.4.0 with its minimum required version and notes, even if it previously received 1.3.0

#### Scenario: Bundle and release information agree
- **WHEN** a build is produced
- **THEN** the version shown in the app and the published version are identical

### Requirement: Running app detects new releases
The running app SHALL compare its own version with the published release information when it starts, when it returns to the foreground (at most once per minute), and at least every 30 minutes while it is open. When the check fails (offline, network error, invalid response), the app SHALL keep working, SHALL NOT show a new update prompt, and SHALL keep the result of its last successful check.

#### Scenario: Old client learns about a new release
- **WHEN** a user runs 1.3.0 and 1.4.0 has been deployed, and the user brings the app back to the foreground
- **THEN** the app detects that 1.4.0 is available without the user reloading first

#### Scenario: Offline
- **WHEN** the release information cannot be fetched and no earlier check succeeded
- **THEN** no update prompt is shown and the app stays usable

#### Scenario: Transient failure during a mandatory update
- **WHEN** a mandatory update is shown and a later check fails
- **THEN** the mandatory update stays shown

### Requirement: Effective minimum version
The effective minimum version SHALL be the highest of the minimum in the published release information and the admin override, if one is set and not higher than the deployed version. If the override cannot be read or is higher than the deployed version, the published minimum SHALL apply on its own.

#### Scenario: Override raises the minimum
- **WHEN** the published minimum is 1.2.0, version 1.4.0 is deployed and an admin sets the override to 1.4.0
- **THEN** clients below 1.4.0 are treated as needing a mandatory update

#### Scenario: Override lower than published minimum
- **WHEN** the published minimum is 1.4.0 and the override is 1.2.0
- **THEN** the effective minimum is 1.4.0

### Requirement: Admin override of the minimum version
Admins SHALL be able to set or clear a minimum required version, with an optional message in nl/fr/en, without a new deployment. Anyone SHALL be able to read the override. Only admins SHALL be able to change it.

#### Scenario: Anonymous visitor reads the override
- **WHEN** a signed-out visitor's app checks for updates
- **THEN** it can read the current override

#### Scenario: Non-admin cannot change it
- **WHEN** a signed-in non-admin user tries to change the override
- **THEN** the change is rejected

### Requirement: Mandatory update
When the running version is below the effective minimum and the deployed version meets that minimum, the app SHALL show a blocking full-screen notice in the user's language with a single "update now" action. The rest of the app SHALL NOT be usable while the notice is shown.

#### Scenario: Crucial fix released
- **WHEN** the user runs 1.3.0, 1.3.1 is deployed with minimum 1.3.1, and the app checks for updates
- **THEN** a blocking notice is shown that cannot be dismissed, and the app behind it cannot be used

#### Scenario: Override message shown
- **WHEN** the mandatory update is triggered by an override that includes a message
- **THEN** the notice shows that message in the user's language

### Requirement: No unresolvable mandatory update
An override higher than the deployed version SHALL be ignored, because updating cannot satisfy it; the published minimum SHALL still apply. An optional update SHALL still be offered if one is available.

#### Scenario: Override set too high
- **WHEN** an admin sets the override to 2.0.0 while 1.4.0 is deployed
- **THEN** users on 1.4.0 are not blocked and see no mandatory notice

#### Scenario: Override set too high during a crucial fix
- **WHEN** 1.3.1 is deployed with minimum 1.3.1, an admin sets the override to 2.0.0, and the user runs 1.3.0
- **THEN** the mandatory notice is still shown

### Requirement: Optional update
When the running version is below the deployed version and no mandatory notice applies, the app SHALL show a dismissible banner with a reload action. Optional updates SHALL NOT be presented as critical.

#### Scenario: Feature release
- **WHEN** the user runs 1.3.0, 1.4.0 is deployed with minimum 1.0.0, and the app checks for updates
- **THEN** a dismissible "new version available" banner is shown, not a critical notice

#### Scenario: Up to date
- **WHEN** the running version equals the deployed version
- **THEN** no banner or notice is shown

### Requirement: Dismissal is remembered per release
Dismissing the optional banner SHALL hide it for that deployed version on that device, including after reloads and later checks. A newer deployed version SHALL show the banner again.

#### Scenario: Banner does not come back
- **WHEN** the user dismisses the banner for 1.4.0 and the app checks again or is reopened
- **THEN** the banner is not shown again for 1.4.0

#### Scenario: Next release shows banner again
- **WHEN** the user dismissed the banner for 1.4.0 and 1.5.0 is then deployed
- **THEN** the banner is shown for 1.5.0

### Requirement: Updating loads the new version
Choosing to update (from the banner, the blocking notice or the manual check) SHALL load the deployed version, so that after the reload the app runs that version and the prompt is gone. Old cached app files SHALL be removed after an update.

#### Scenario: Update resolves the prompt
- **WHEN** the user on 1.3.0 taps "update now" while 1.4.0 is deployed
- **THEN** the app reloads, runs 1.4.0 and shows no update prompt

#### Scenario: Installed app
- **WHEN** the app is installed as a PWA and the user updates
- **THEN** the PWA runs the new version after the reload, not a cached old one

### Requirement: Manual update check
The footer and the profile page SHALL show the running version and let the user check for updates. A check SHALL lead to the same result as an automatic check: a mandatory notice, an optional banner, or a "you have the latest version" message. A failed check SHALL show a localised "check failed" message. A dismissed banner SHALL NOT make a manual check report the latest version while a newer version is deployed.

#### Scenario: Manual check fails
- **WHEN** the user taps the version in the footer while offline
- **THEN** a "check failed" message is shown

#### Scenario: Manual check after dismissing
- **WHEN** the user dismissed the banner for 1.4.0 and taps the version in the footer
- **THEN** an "update available" message is shown, not "latest version"

#### Scenario: Manual check when up to date
- **WHEN** the user runs the deployed version and taps the version in the footer
- **THEN** a "latest version" message is shown and no banner appears

### Requirement: Release notes after update
After the app starts on a newer version than the one last used on the device, it SHALL show that release's notes once, in the user's language, if notes exist. First-time visitors SHALL NOT see release notes.

#### Scenario: Notes after updating
- **WHEN** the user updates from 1.3.0 to 1.4.0, which has notes
- **THEN** the 1.4.0 notes are shown once and not again on later visits

#### Scenario: First visit
- **WHEN** a visitor opens the app for the first time
- **THEN** no release notes are shown
