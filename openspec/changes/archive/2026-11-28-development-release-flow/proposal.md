# Proposal

## Why

Every PR targets `master`, and Netlify publishes production straight from `master`, so every merge is a release (GitHub issue #64). Nothing forces a version bump: `src/config/release.json` and `package.json` are still `1.0.0` after many merges, so the in-app update flow (`/version.json`, the "new version" banner, release notes, `minVersion`) has never fired for users. There is also no place to collect merged work and release it together.

## What Changes

- Add a long-lived `development` branch, created from `master`, and make it the repository's default branch.
- Feature and fix PRs target `development`. `master` only receives release PRs from `development`, or hotfix PRs from `hotfix/*` branches.
- A new CI release check on every PR into `master` fails unless:
  - the head branch is `development` or `hotfix/*`, and
  - `version` in `src/config/release.json` is semver-greater than the version on `master`.
  The existing unit test already keeps `package.json` equal to `release.json`.
- The version bump and release notes are committed on the release PR itself.
- Hotfixes: a `hotfix/*` branch may PR straight into `master` (with a bump) and is then merged back into `development`.
- Release and hotfix PRs into `master` use a merge commit, not a squash, so `development` and `master` stay in step.
- CI covers the new branch: `ci.yml` also runs on pushes to `development` and `hotfix/**`, and `e2e.yml` also runs on PRs into `development`.
- Branch protection: `master` requires a PR plus the release check and CI. `development` requires CI.
- Docs and agent instructions: PRs target `development` (`gh pr create --base development`); a release section describes the release PR and the hotfix path; deploy docs say production, migrations and edge functions go live at release.
- Retarget open PR #12 to `development`.

Out of scope: the first release through the new flow (`1.0.0` → `1.1.0` with notes) is a follow-up release PR, not part of this change. Netlify staging deploys for `development` are not added.

## Capabilities

### New Capabilities
- `release-process`: How changes travel from a feature branch to production: which branch PRs target, what a release to `master` requires (source branch, version bump), and how hotfixes reach production.

### Modified Capabilities

(none)

## Impact

- `.github/workflows/ci.yml`, `.github/workflows/e2e.yml`, new `.github/workflows/release-check.yml`
- New `scripts/release-check.mjs` with a unit test in `src/tests/release-check.test.ts`
- `AGENTS.md`, `docs/contribute.md`, `docs/releases.md`, `docs/deploy.md`, `docs/edge-functions.md`
- GitHub repository settings: new `development` branch, default branch, branch protection on `master` and `development`
- Workflow change for contributors and agents: new PRs must target `development`
