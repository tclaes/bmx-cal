## Edge Functions

All edge functions are in `supabase/functions/` and deployed via the Supabase MCP `deploy_edge_function` tool or `supabase functions deploy`. Each function answers CORS preflight requests and includes CORS headers on all responses.

Functions run on Supabase, not in the frontend build: a deploy takes effect for real users immediately, independent of publishing the frontend. Deploy only code that is merged to `master`.

### Functions and who may call them

`verify_jwt` is the setting in `supabase/config.toml`. The anon key satisfies `verify_jwt = true`, so every protected function also identifies the caller itself.

| Function | Purpose | `verify_jwt` | Allowed callers | Failure for a rejected caller |
|----------|---------|--------------|-----------------|-------------------------------|
| `analyze-image` | Extracts event data from an uploaded image (Gemini) | true | Admin or team manager | 401 |
| `analyze-pdf` | Extracts event data from an uploaded PDF (Gemini) | true | Admin | 401 |
| `create-github-issue` | Creates a GitHub issue from a bug report | true | Admin | 401 without a session, 403 for a non-admin |
| `reopen-github-issue` | Reopens a GitHub issue linked to a bug report | true | Admin | 401 without a session, 403 for a non-admin |
| `get-github-issue-statuses` | Fetches status of GitHub issues linked to bug reports | true | Admin | 401 |
| `delete-account` | Deletes the caller's own account | true | Signed-in user (own account only) | 401 |
| `sync-jstiming` | Syncs event data from the JSTiming API | false | Scheduler (service-role key or cron token) or admin | 401 |
| `send-push-notifications` | Sends push notifications | false | Scheduler or admin; any signed-in user in test mode (own device) | 401 unknown caller, 403 non-admin outside test mode |
| `send-contact-email` | Sends contact form submissions via email | false | Anyone (input validated, rate limited) | 400 invalid input, 429 too many requests |
| `send-password-reset` | Triggers a password reset email | false | Anyone (input validated, rate limited) | 400 invalid input, 429 too many requests |

The scheduler authenticates with the service-role key or a per-function token stored in `cron_auth_tokens` (see [cron.md](cron.md)).

### Smoke test

`scripts/smoke-edge-functions.mjs` checks every function with requests that cannot cause side effects: a browser-style CORS preflight (origin, `POST`, `Content-Type` and `Authorization` must be allowed), an unauthenticated call (expects 401) and, for `send-contact-email`, an empty payload (expects 400). `send-password-reset` is only probed with the preflight, because it rate-limits before validating and a POST would use up one of the caller's reset slots. Requests send no credentials and time out after 10 seconds, so the script is safe to run against production:

```bash
node scripts/smoke-edge-functions.mjs https://<project-ref>.supabase.co/functions/v1
```

Admin, team-manager and scheduler paths must only be tested against a local Supabase, never against production.

### Rollback

Functions deploy independently of git, so a bad deploy is undone by redeploying earlier source, not by reverting a merge. Commit `9e9a790` is the last source from before the shared-helper migration (`_shared/` CORS and auth modules); every function there is self-contained.

1. Check out the source you want to restore into a scratch worktree, so the working copy stays untouched:

   ```bash
   git worktree add ../bmx-cal-rollback 9e9a790
   cd ../bmx-cal-rollback
   ```

2. Redeploy only the broken function (the project ref is in `docs/env.md`):

   ```bash
   supabase functions deploy <function-name> --project-ref <project-ref>
   ```

   A function that imports from `supabase/functions/_shared/` must be redeployed together with that directory, so roll back to a commit that contains the matching `_shared/` version, not just the function file.

3. Verify with the smoke script (see above). It must pass before you consider the rollback done:

   ```bash
   node scripts/smoke-edge-functions.mjs https://<project-ref>.supabase.co/functions/v1
   ```

4. Remove the scratch worktree with `git worktree remove ../bmx-cal-rollback`, then fix forward on a branch from `master` and redeploy only after the fix is merged.

`verify_jwt` is read from `supabase/config.toml` at the commit you deploy from, so a rollback also restores that commit's JWT settings. Compare it with the current file before redeploying a function whose setting changed.

#### Local dry-run

The rollback source was dry-run on 2026-11-12: commit `9e9a790` checked out into a scratch worktree, served with `supabase functions serve --env-file <file>` on a local stack, and `scripts/smoke-edge-functions.mjs http://127.0.0.1:54321/functions/v1` passed 21/21. Notes if you repeat it:

- `supabase/config.toml` has no `project_id`; add one in the scratch copy before `supabase start`.
- The committed migrations do not replay on an empty database (`20260314125514_add_missing_uec_cup_rounds.sql` inserts events that reference production-only event types). Move `supabase/migrations/` aside in the scratch copy; the smoke checks need no schema. Exclude services you do not need, for example `supabase start -x studio,imgproxy,logflare,vector,mailpit,realtime,storage-api,postgres-meta`.
- The `9e9a790`-era functions check that their secrets exist before they check auth or input, so pass dummy values for `YOUTUBE_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `RESEND_API_KEY` and `CONTACT_EMAIL` in the env file, or three functions answer 5xx instead of 401/400.
- `functions serve` proves the old source runs and answers correctly. It does not exercise `supabase functions deploy`, which needs a remote project.
