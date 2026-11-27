# release-process Specification

## Purpose
Defines how changes travel from a feature branch to production: which branch pull requests target, what a release to `master` requires, and how urgent fixes reach production.

## Requirements

### Requirement: Feature work targets development
Feature and fix pull requests SHALL target the `development` branch, and `development` SHALL be the repository's default branch.

#### Scenario: Opening a feature PR
- **WHEN** a contributor opens a pull request from a feature or fix branch without choosing a base
- **THEN** its base is `development`

#### Scenario: Checks on development
- **WHEN** a pull request into `development` is opened or updated
- **THEN** the CI checks and both end-to-end suites run on it, and it cannot merge while a required CI check fails

### Requirement: Master accepts only releases and hotfixes
A pull request into `master` SHALL come from `development` or from a branch named `hotfix/<name>`.

#### Scenario: Release PR
- **WHEN** a pull request into `master` comes from `development`
- **THEN** the source-branch part of the release check passes

#### Scenario: Hotfix PR
- **WHEN** a pull request into `master` comes from `hotfix/fix-login`
- **THEN** the source-branch part of the release check passes

#### Scenario: Feature PR aimed at master
- **WHEN** a pull request into `master` comes from any other branch
- **THEN** the release check fails and its message says to target `development`

### Requirement: A release raises the version
A pull request into `master` SHALL raise `version` in `src/config/release.json` above the version on `master`, and SHALL NOT merge until it does.

#### Scenario: Version unchanged or lowered
- **WHEN** a release or hotfix PR keeps the version on `master`, or lowers it
- **THEN** the release check fails and names both versions

#### Scenario: Version raised
- **WHEN** a release or hotfix PR raises the version by a patch, minor or major step
- **THEN** the version part of the release check passes

#### Scenario: Merge blocked until the check passes
- **WHEN** the release check fails on a pull request into `master`
- **THEN** the pull request cannot be merged

### Requirement: Hotfixes return to development
After a hotfix is merged into `master`, the same changes SHALL be merged into `development`, so the next release does not undo the fix or its version.

#### Scenario: Next release after a hotfix
- **WHEN** a hotfix raised `master` to `1.1.1` and was merged back into `development`
- **THEN** the next release PR starts from `1.1.1` and must raise it further
