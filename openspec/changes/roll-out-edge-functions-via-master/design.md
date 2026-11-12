# Design

## Context

Production is one Supabase project plus a frontend published manually from bolt.new. Functions deploy through the Supabase MCP `deploy_edge_function` tool or the CLI and go live immediately. `master` has no `openspec/` folder and a smaller CI (tests and build only). No local Supabase stack exists yet; `add-local-supabase-test-env` plans one (Supabase CLI plus Docker, seeded admin/team-manager/user) but is not implemented. See proposal.md for why shipping via `master` first is possible.

## Goals / Non-Goals

**Goals:**
- Ship the lowest-risk slice to `master` first and make each later step independently deployable and reversible.
- A repeatable smoke set that is safe to run against production.
- Every positive-path check runs only against a local stack.

**Non-Goals:**
- Standing up a staging Supabase project, or a full e2e suite for the functions.

## Decisions

- **Branch from `origin/master`, not from the redesign.** The touched files are identical on both, so merge conflicts are not expected, and production-bound work is not coupled to unreleased UI. Alternative: stack on the redesign branch, which delays shipping until the whole redesign is ready.
- **Three stages by risk.** Stage A changes nothing at runtime because `_shared` is unused until functions import it. Stage B changes code but not production until deployed. Stage C is the only step that touches production. Alternative: one big PR, which cannot be partially rolled back.
- **Group and order the deploys: public, then user/admin, then scheduled.** Public functions have the simplest paths and are exercised by real users; scheduled functions are last because a mistake there is silent (cron failures) and spends third-party quota.
- **Smoke set without credentials.** For each function: `OPTIONS` returns the CORS headers; an unauthenticated or anon-key call returns 401 (403 for the two GitHub-issue functions on non-admin, which an anon call cannot reach, so only the 401 path is checked in production); a malformed payload to the two public functions returns 400. These never reach side-effecting code. The scheduled functions' unauthenticated path only reads `cron_auth_tokens`.
- **Positive paths locally** with `supabase functions serve` against the seeded local stack (admin, team manager, user, scheduler token). If `add-local-supabase-test-env` is not done by Stage B, use the Supabase CLI with a minimal seed for just the auth cases.
- **Rollback is per function**: keep the last deployed source for each function (tag the commit before each deploy) and redeploy it if a smoke check fails.

## Risks / Trade-offs

- [The smoke set cannot prove admin and scheduler paths in production] → Those paths are covered locally before merge, and the unit tests cover the shared auth logic; after deploy, check the function logs after the next real scheduled run before closing out Stage C.
- [Supabase CLI and Docker are not set up] → Task 1.1 makes this an explicit prerequisite; if it cannot be done, Stage B falls back to unit tests plus a one-function-at-a-time deploy with extra log monitoring, and says so in the PR.
- [CI on `master` is thinner than on the redesign] → Run `npm test` locally and in CI; the Phase 1 gates reach `master` later with the redesign.
- [Artifacts are on a different branch than the code] → Link the OpenSpec change from each PR description.

## Migration Plan

1. Stage A PR to `master`; merge; no deploy.
2. Stage B PRs to `master`, one per group; merge each after local verification.
3. Stage C after each merge: deploy, smoke test, watch logs; roll back by redeploying the tagged previous version.
