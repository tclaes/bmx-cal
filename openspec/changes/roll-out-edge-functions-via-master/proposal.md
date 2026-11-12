# Proposal

## Why

`consolidate-edge-function-shared-code` describes the code change but not how it reaches production safely. The user wants the edge-function work shipped to `master` ahead of the redesign, and tested, because functions run on Supabase and take effect for real users the moment they are deployed, independent of the bolt.new frontend publish. Checked facts that make this possible: `origin/master` is an ancestor of the redesign-based branch and `supabase/`, `docs/edge-functions.md` and `src/tests/edge-function-security.test.ts` are byte-identical on both, so an edge-function branch cut from `master` merges into the redesign without conflicts. This change plans what can ship first, in what order, and how each step is tested.

## What Changes

- Stage the work so the zero-risk part ships first: **Stage A** (nothing deployed, no behavior change): `_shared/` modules, unit tests, the authorization table in `docs/edge-functions.md`, and an offline characterization smoke script.
- **Stage B**: migrate functions to `_shared` on a branch cut from `origin/master`, one PR per group (public, user/admin, scheduled), each verified against a local Supabase before merging.
- **Stage C**: after each group is merged to `master`, deploy that group's functions one at a time and run a production-safe smoke set, with a written rollback.
- Define the production-safe smoke set: requests that cannot cause side effects (preflight `OPTIONS`, unauthenticated calls expecting 401, malformed payloads expecting 400) and never use real credentials. Positive paths (admin, team manager, scheduler) are tested only locally.
- Keep the OpenSpec artifacts on the redesign-based branch (master has no `openspec/` folder); implementation PRs target `master` and reference them.

Out of scope: the code changes themselves (see `consolidate-edge-function-shared-code`), the xlsx swap, and changing the CORS origin.

## Capabilities

### New Capabilities

### Modified Capabilities

(Process and delivery only; `skip_specs: true`.)

## Impact

- New branch(es) cut from `origin/master`, PRs against `master` (CI on master currently runs only `npm test` and `npm run build`)
- New `scripts/smoke-edge-functions.mjs` (or similar) and docs for it
- Supabase project: deploys of 11 functions, in groups, after each merge
- Depends on a local Supabase for the positive-path checks: the in-flight `add-local-supabase-test-env` change, or a Supabase CLI plus Docker setup (the CLI is not installed on this machine today)
