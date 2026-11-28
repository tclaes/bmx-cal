# Design

## Context

- `master` is the default branch and Netlify's production branch. Its protection today requires only the `Test` status check: no PR requirement, and admins are not enforced.
- The repo allows squash, merge and rebase merges, and has "automatically delete head branches" on.
- `ci.yml` runs on every `pull_request` and on pushes to `master`, `feat/**` and `fix/**`. It has two jobs, `Test` and `E2E (mocked Supabase)`. `e2e.yml` (`Playwright against local Supabase`) runs only for PRs into `master`.
- `src/tests/release-config.test.ts` already enforces semver format, `package.json` = `release.json`, and `minVersion` ≤ `version`.
- Scripts live in `scripts/*.mjs` with exported functions, unit-tested from `src/tests/` (e.g. `smoke-edge-functions.mjs`). Vitest only collects `src/tests/**/*.test.ts`.
- Open PRs: #12 (into `master`).

## Goals / Non-Goals

**Goals:**
- The release rule is enforced by a required check, not only by docs.
- The change lands without a window where PRs have nowhere valid to go.

**Non-Goals:**
- Automating the version bump or the release notes.
- Enforcing the merge style per branch. GitHub can't set it per base branch without rulesets; the docs carry this instead.
- A Netlify staging deploy for `development`.

## Decisions

### Bootstrap order: settings first, this change into `development`
1. Create `development` from `master` and push it.
2. Make it the default branch, and apply branch protection on both branches (below).
3. This change's PR targets `development`. It is archived in the PR as usual and merges into `development`.
4. The workflow files and docs reach `master` with the first release PR (`1.0.0` → `1.1.0`, a follow-up). That PR is the first to run the release check.

On `pull_request`, GitHub runs workflows from the PR's merge ref. So the first release PR runs `release-check.yml` even though `master` doesn't have it yet.
- *Alternative: merge this change into `master` first, then create `development`.* Rejected: the settings and the retarget of #12 would then happen after merge. That leaves tracked tasks open after archiving and creates a window where `master` has the new rules but `development` doesn't exist yet.

### Release check as its own workflow and script
- Add `.github/workflows/release-check.yml`, triggered on `pull_request` into `master` (types `opened`, `synchronize`, `reopened`, `edited`, so a base change re-runs it). It has one job named `Release check`, which is the required context.
- The job checks out the PR and reads the base version with `git show <base sha>:src/config/release.json`. It runs `node scripts/release-check.mjs` with the head branch name, base version and head version passed as **environment variables**. The branch name is never interpolated into the shell script, so a crafted branch name cannot inject commands.
- `scripts/release-check.mjs` exports `compareVersions(a, b)` and `checkRelease({ headRef, baseVersion, headVersion })`. The second returns a list of problems: a wrong source branch, or a version not greater than the base, naming both versions. The CLI entry prints the problems and exits non-zero. It is unit-tested in `src/tests/release-check.test.ts`.
- *Alternative: a step inside `ci.yml`.* Rejected: `ci.yml` runs for every PR. A separate workflow keeps the release rule scoped to `master` and gives it its own required check name.

### Source branch rule
The head branch must be `development` or match `hotfix/` followed by a non-empty name. Anything else fails with "target `development` instead".

### CI coverage
- `ci.yml`: add `development` and `hotfix/**` to the push branches. Its `pull_request` trigger already covers PRs into `development`.
- `e2e.yml`: `pull_request` branches become `[master, development]`.

### Branch protection (applied with `gh api`, shown to the user first)
- `master`:
  - PR required (0 approvals, so it works solo);
  - required checks `Test`, `E2E (mocked Supabase)` and `Release check`;
  - no force pushes, no deletions;
  - `enforce_admins` stays `false` as today, so an admin can still recover in an emergency.
- `development`:
  - PR required (0 approvals);
  - required checks `Test` and `E2E (mocked Supabase)`;
  - no force pushes, no deletions.
  - No-deletions also stops "automatically delete head branches" from removing `development` after a release PR merges.
- `Playwright against local Supabase` stays a non-required check on both branches, as today.

### Merge styles (documented)
- Feature PRs into `development`: squash, as today.
- Release and hotfix PRs into `master`: **merge commit**. A squash would give `master` a commit that `development` lacks, and the next release PR would conflict on the version lines.
- Hotfix back-merge: a PR from `master` (or the hotfix branch) into `development`, merged with a merge commit.

### Docs
- `AGENTS.md`: a short rule that PRs target `development` (`gh pr create --base development`) and that only release and hotfix PRs go to `master`.
- `docs/contribute.md`: the flow, merge styles, and the archive rule (unchanged).
- `docs/releases.md`: "Release PR" and "Hotfix" sections, using the existing bump instructions.
- `docs/deploy.md` and `docs/edge-functions.md`: production, migrations and edge functions still go live only from `master`, which now means at release.

## Risks / Trade-offs

- [Between this change and the first release, `master` requires a `Release check` that `master` itself can't run yet. A hotfix branched from `master` would have no `release-check.yml` and could never get the check] → Do the first release (`1.1.0`) right after this change merges into `development`. Hotfixes always branch from `master`, never from `development`, which would bring unreleased work along. If one is needed before the first release, finish that release first.
- [The docs and AGENTS.md on `master` still say "PRs go to `master`" until the first release] → `development` is the default branch, so new checkouts and `gh pr create` already use it. The first release follows immediately.
- [Admins can still push straight to `master` (`enforce_admins: false`)] → Kept deliberately for emergencies. The docs say not to.
- [Forgetting the hotfix back-merge] → Nothing catches it automatically: `Release check` does not verify the back-merge, so a next release that bumps past the hotfix version still passes, and `development` would still lack the fix. The docs make the back-merge an explicit step right after the hotfix merges.

## Migration Plan

1. Create `development`, set it as default, apply protection, retarget #12.
2. Merge this change into `development`.
3. Follow-up: release PR `development` → `master` with `1.1.0` and notes (merge commit).
4. Rollback: set `master` back as default, restore the old `master` protection (only `Test` required), and retarget open PRs to `master`. Leave the workflows in place, since they are harmless without the protection.
