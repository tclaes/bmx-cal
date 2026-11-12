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
| `search-uec-livestream` | Searches YouTube for live broadcasts of UEC BMX events happening today | false | Scheduler (service-role key or cron token) or admin | 401 |
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
