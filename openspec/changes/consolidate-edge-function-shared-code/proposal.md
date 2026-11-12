# Proposal

## Why

Eleven edge functions under `supabase/functions/` each carry their own copy of the CORS headers, the bearer-token parsing, the "who is calling" check and the JSON error responses. The cron-token check alone is copied three times (`sync-jstiming`, `search-uec-livestream`, `send-push-notifications`), and the admin check five-plus times with drifting details: admin-only failures return 403 in `create-github-issue` and `reopen-github-issue` but 401 elsewhere, and `supabase-js` is imported via `npm:` in some functions and `jsr:` in others. Authorization code that is copy-pasted is where a security fix lands in one function and misses another. Which function is open to whom is also written down nowhere: `docs/edge-functions.md` omits two functions, and `src/tests/edge-function-security.test.ts` asserts hard-coded constants rather than behavior. Phase 2 of the tech-debt audit (see the archived `add-ci-quality-gates` change) targets exactly this.

## What Changes

- Add `supabase/functions/_shared/` with `cors.ts` (headers, preflight, JSON response helper) and `auth.ts` (bearer parsing, scheduled-caller check, resolve-caller, require-admin), written so the logic is unit-testable without Deno.
- Migrate all 11 functions to the shared modules with **no change in observable behavior**: same status codes, same bodies, same CORS headers (including the 401/403 difference, preserved explicitly).
- Standardize the `supabase-js` import specifier across functions.
- Add a real test suite for the shared modules and replace the constant-asserting `edge-function-security.test.ts` with tests that exercise them.
- Document, in `docs/edge-functions.md`, a table of every function with its `verify_jwt` setting, who may call it and how the caller is authenticated; add the two missing functions.

Out of scope: tightening the wildcard CORS origin, changing any status code, rate-limit changes, moving cron-token storage, the xlsx replacement (separate change `replace-xlsx-with-sheetjs-official`).

## Capabilities

### New Capabilities
- `edge-function-access`: who may call each edge function (admin, signed-in user, scheduler-or-admin, public), how failures are reported, and the CORS contract that applies to every response.

### Modified Capabilities

## Impact

- `supabase/functions/*/index.ts` (11 files) and new `supabase/functions/_shared/*`
- `src/tests/edge-function-security.test.ts` (replaced), new shared-module tests
- `docs/edge-functions.md`
- Delivery: how this ships to `master` first and is tested is planned in `roll-out-edge-functions-via-master`
- Deployment: functions are deployed through the Supabase MCP `deploy_edge_function` tool, so every deploy must now include the `_shared` files (see design.md)
