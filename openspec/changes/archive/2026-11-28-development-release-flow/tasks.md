# Tasks

## 1. Release check

- [x] 1.1 Add `scripts/release-check.mjs` exporting `compareVersions` and `checkRelease({ headRef, baseVersion, headVersion })`, with a CLI entry that reads `HEAD_REF`, `BASE_VERSION` and `HEAD_VERSION` from the environment, prints each problem and exits non-zero. Add `src/tests/release-check.test.ts` covering: `development` and `hotfix/x` allowed; `feat/x`, `hotfix/` and `master` rejected; version greater (patch, minor, major) passes; equal and lower fail with both versions in the message; numeric compare (`1.10.0` > `1.9.0`). Verify `npm test` passes.
- [x] 1.2 Add `.github/workflows/release-check.yml`: `pull_request` into `master` (types opened, synchronize, reopened, edited), one job named `Release check`, `permissions: contents: read`. It reads the base version from `github.event.pull_request.base.sha` with `git show` and the head version from the checkout, passes everything through `env`, and runs the script. Verify with `node scripts/release-check.mjs` locally, with the env set for a passing and a failing case.

## 2. CI coverage

- [x] 2.1 In `.github/workflows/ci.yml`, add `development` and `hotfix/**` to the push branches. In `.github/workflows/e2e.yml`, set the `pull_request` branches to `[master, development]`. Verify the YAML parses (`npx --yes yaml-lint` or `node -e` with the `yaml` package) and that the job names are unchanged (`Test`, `E2E (mocked Supabase)`, `Playwright against local Supabase`).

## 3. Docs and agent instructions

- [x] 3.1 `AGENTS.md`: add a "Branches and pull requests" rule: feature and fix PRs target `development` (`gh pr create --base development`); only release PRs (from `development`) and hotfix PRs (from `hotfix/*`) target `master`. Verify it reads correctly next to the OpenSpec rule.
- [x] 3.2 `docs/contribute.md`: describe the flow (issue → branch → PR into `development` → release PR → `master`), the merge styles (squash into `development`; merge commit for release, hotfix and back-merge PRs), and where the release check is. Verify every command in it is valid.
- [x] 3.3 `docs/releases.md`: add "Release PR" and "Hotfix" sections. A release PR opens `development` → `master`, then a commit on it bumps the version and writes the notes, and it merges with a merge commit. A hotfix branches `hotfix/<name>` from `master`, bumps the patch and sets `minVersion` if mandatory, PRs into `master`, then merges `master` back into `development`. Keep the existing feature and crucial-fix steps consistent with these.
- [x] 3.4 `docs/deploy.md` and `docs/edge-functions.md`: say that production deploys, migrations and edge functions still go live only from `master`, which now means at release time. Verify no doc still tells people to open PRs into `master`, with `grep -rn "master" docs AGENTS.md`.

## 4. GitHub settings

- [x] 4.1 Show the user the exact settings from the design ("Branch protection"), then create `development` from `origin/master` and push it. Verify with `git ls-remote --heads origin development`.
- [x] 4.2 Make `development` the default branch with `gh api -X PATCH repos/tclaes/bmx-cal -f default_branch=development`. Verify `gh api repos/tclaes/bmx-cal -q .default_branch`.
- [x] 4.3 Apply branch protection to `master` (PR required, 0 approvals; required checks `Test`, `E2E (mocked Supabase)`, `Release check`; no force pushes or deletions; `enforce_admins` false) and to `development` (PR required, 0 approvals; required checks `Test`, `E2E (mocked Supabase)`; no force pushes or deletions). Verify both with `gh api repos/tclaes/bmx-cal/branches/<b>/protection`.
- [x] 4.4 Retarget open PR #12 to `development` with `gh pr edit 12 --base development`, and open this change's PR against `development`. Verify with `gh pr list --json number,baseRefName`.

## 5. Final checks

- [x] 5.1 Run `npm run check`, `npm run sheriff`, `npm run stylelint`, `npm test` and `npm run build`. Verify all pass, and that this change's PR into `development` runs `Test`, `E2E (mocked Supabase)` and `Playwright against local Supabase`.

## Workflow follow-up

- Archive this change in its PR before it merges into `development` (done).
- Next: the first release PR `development` → `master`, bumping `1.0.0` → `1.1.0` with notes in nl/fr/en, merged with a merge commit. It is the first PR to run `Release check`.
