# Tasks

## 1. Shared modules

- [ ] 1.1 Create `supabase/functions/_shared/cors.ts` (CORS headers, preflight response, `jsonResponse`) with unit tests in `src/tests/edge-shared-cors.test.ts`; verify `npm test` passes.
- [ ] 1.2 Create `supabase/functions/_shared/auth.ts` (`getBearerToken`, `isScheduledCaller`, `resolveCaller`, `requireAdmin` with `failureStatus`, team-manager check) with injected clients, and tests in `src/tests/edge-shared-auth.test.ts` covering anonymous, user, admin, team manager and scheduled callers; verify `npm test` passes.
- [ ] 1.3 Delete the constant-asserting cases in `src/tests/edge-function-security.test.ts` that the new tests supersede; verify the remaining cases still describe real behavior and `npm test` passes.

## 2. Migrate public functions

- [ ] 2.1 Migrate `send-contact-email` and `send-password-reset` to `_shared`, keep status codes and bodies; verify with a test or manual call that 400, 429 and CORS preflight responses are unchanged.

## 3. Migrate user and admin functions

- [ ] 3.1 Migrate `create-github-issue` and `reopen-github-issue` (admin, 403 on failure); verify non-admin returns 403 and admin succeeds.
- [ ] 3.2 Migrate `get-github-issue-statuses` and `analyze-pdf` (admin, 401 on failure); verify non-admin returns 401.
- [ ] 3.3 Migrate `analyze-image` (admin or team manager) and `delete-account` (signed-in user); verify a team manager is accepted and a plain user is rejected.

## 4. Migrate scheduled functions

- [ ] 4.1 Migrate `sync-jstiming`, `search-uec-livestream` and `send-push-notifications` (service-role key or cron token, else admin; push keeps test mode and 403 for non-admin); verify the scheduled bearer, an admin session and an unknown caller each behave as before.

## 5. Standardize and document

- [ ] 5.1 Use the `npm:@supabase/supabase-js@2` specifier in every function; verify with `grep -rn "jsr:@supabase/supabase-js" supabase/functions` returning nothing.
- [ ] 5.2 Rewrite `docs/edge-functions.md` with a table of all 11 functions: purpose, `verify_jwt`, allowed callers, auth method, and a note that deploys must include `_shared/`; verify every function in `supabase/config.toml` appears in the table.
- [ ] 5.3 Deploy one function per category, smoke-test, then deploy the rest; record results in the PR description.
