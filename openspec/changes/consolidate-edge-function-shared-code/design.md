# Design

## Context

Eleven functions, about 2,100 lines, each self-contained. Observed duplication (see proposal.md): CORS headers in 11 files, a user-session check via a client built from the caller's `Authorization` header in 9, the cron-token lookup in 3, the admin role check in 8. Differences that must be preserved because clients may depend on them: admin failures are 403 in `create-github-issue`/`reopen-github-issue` and 401 elsewhere; `analyze-image` also admits team managers; `send-push-notifications` has a test mode for signed-in non-admins. Functions are deployed with the Supabase MCP `deploy_edge_function` tool. Vitest only runs `src/tests/**`, and the edge code imports `npm:`/`jsr:` specifiers that Node cannot resolve.

## Goals / Non-Goals

**Goals:**
- One implementation of CORS handling, bearer parsing, scheduled-caller check and admin check.
- Identical external behavior (see the `edge-function-access` spec).
- Shared logic covered by real unit tests.

**Non-Goals:**
- Changing status codes, tightening CORS origins, or reworking rate limiting.
- A framework or router for edge functions.

## Decisions

- **Plain `_shared/` modules imported by relative path** (`../_shared/cors.ts`), the Supabase convention, rather than a published package or code generation. Alternative: keep copies and add a lint rule, which fixes nothing.
- **Dependency injection for anything that touches the network.** `auth.ts` has no remote imports: functions pass in their `createClient` result or a small `{ getUser, isTeamManager, lookupCronToken }` object. This keeps the logic testable from `src/tests` under Node and avoids `npm:`/`jsr:` resolution in Vitest. Alternative: add Deno's test runner to CI, which adds a second toolchain for roughly 100 lines of logic.
- **Behavior-preserving API.** `requireAdmin(..., { failureStatus })` takes the status per function so the 401/403 split is explicit instead of silently unified. Unifying it is a follow-up decision, not part of this refactor.
- **Standardize on `npm:@supabase/supabase-js@2`.** It is the majority specifier and what the Supabase docs now use. Pin to the same major everywhere.
- **Tests replace the constant-asserting suite**: tests import `supabase/functions/_shared/*.ts` from `src/tests/` and cover bearer parsing, scheduled vs. user vs. anonymous callers, admin and team-manager checks and CORS/JSON helpers.
- **One function per commit while migrating**, so a regression is bisectable and a single function can be redeployed or rolled back.

## Risks / Trade-offs

- [A deploy that omits `_shared/` breaks every migrated function] → Deploy only after the change is merged to `master`, with each function's shared files, and smoke-test one admin-only, one scheduled and one public function after the first deploy, before the rest. Until then, verify with the unit tests and a local `supabase functions serve`, never against the live project.
- [Subtle behavior drift during the migration, especially status codes] → The spec scenarios become tests; migrate and verify one function at a time against its current responses.
- [`supabase/functions` is outside `tsconfig` `include`, so `svelte-check` will not type-check the shared files] → Add them to a tsconfig `include`, or type-check them through the imports in the tests.
- [Tests run in Node against code written for Deno] → Keep `_shared` free of Deno globals and remote imports.

## Migration Plan

1. Land `_shared/` with tests (no function changes yet).
2. Migrate functions in order: public (2), user/admin (6), scheduled (3).
3. Merge everything to `master` first. Only then deploy, one function at a time, smoke-testing each; roll back by redeploying the previous version of that function.
