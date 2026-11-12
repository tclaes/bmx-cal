# Tasks

## 1. Prerequisites

- [ ] 1.1 Decide the local test target: install the Supabase CLI (Docker is installed), or implement the needed part of `add-local-supabase-test-env`; verify `supabase start` runs and `supabase functions serve` answers an `OPTIONS` request.
- [x] 1.2 Cut `feat/edge-function-shared-code` from `origin/master` and verify `git diff origin/master HEAD -- supabase docs/edge-functions.md` is empty at the start and `npm test` passes.

## 2. Stage A: ship nothing risky first

- [x] 2.1 Implement the `_shared/` modules and their unit tests (tasks 1.1 to 1.3 of `consolidate-edge-function-shared-code`); verify `npm test` passes on the branch.
- [x] 2.2 Write the authorization table into `docs/edge-functions.md` (task 5.2 of that change); verify every function in `supabase/config.toml` is listed.
- [ ] 2.3 (script and unit tests done in PR 17; local `functions serve` run still pending) Add `scripts/smoke-edge-functions.mjs` that takes a base URL and runs the production-safe smoke set (preflight, unauthenticated 401, malformed 400), prints a pass/fail table and exits non-zero on any failure; verify it passes against the local `functions serve` for the current, unmigrated functions.
- [ ] 2.4 Open the Stage A PR to `master`, merge after CI is green; verify nothing was deployed (Supabase function versions unchanged).

## 3. Stage B: migrate by group

- [x] 3.1 Migrate and locally verify the public group (`send-contact-email`, `send-password-reset`): smoke script plus positive-path calls on the local stack; PR to `master`. (PR 18; verified by running original and migrated functions side by side under Deno against a fake Supabase, not a local Supabase stack)
- [x] 3.2 Migrate and locally verify the user/admin group (`create-github-issue`, `reopen-github-issue`, `get-github-issue-statuses`, `analyze-pdf`, `analyze-image`, `delete-account`) with admin, team manager and plain user sessions; PR to `master`. (PR 19; verified by running original and migrated functions side by side under Deno against a fake Supabase, not a local Supabase stack)
- [x] 3.3 Migrate and locally verify the scheduled group (`sync-jstiming`, `search-uec-livestream`, `send-push-notifications`) with the cron token, service-role key and an admin session; PR to `master`. (PR 20; verified by running original and migrated functions side by side under Deno against a fake Supabase, not a local Supabase stack)

## 4. Stage C: deploy and verify, after each merge to master

- [ ] 4.1 Tag the commit currently deployed for each group, deploy the public group one function at a time, run the smoke script against production after each; record results in the PR.
- [ ] 4.2 Repeat for the user/admin group; verify the smoke script passes and the function logs show no new errors.
- [ ] 4.3 Repeat for the scheduled group; verify the smoke script passes and check the logs after the next scheduled run (`sync-jstiming` Tuesday 06:00 UTC, `search-uec-livestream` daily 08:00 UTC, push at 17:00 UTC).
- [ ] 4.4 Document the rollback steps and the smoke script in `docs/edge-functions.md`; verify a dry-run of the rollback redeploys a tagged version in the local stack.
