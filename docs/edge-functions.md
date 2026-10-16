## Edge Functions

All edge functions are in `supabase/functions/` and deployed via the Supabase MCP `deploy_edge_function` tool. Each function includes CORS headers for all responses.

| Function | Purpose |
|----------|---------|
| `sync-jstiming` | Syncs event data from JSTiming API (registration links, event details) |
| `search-uec-livestream` | Searches YouTube for live broadcasts of UEC BMX events happening today |
| `analyze-pdf` | Extracts event data from uploaded PDF files |
| `send-contact-email` | Sends contact form submissions via email |
| `send-password-reset` | Triggers a password reset email |
| `create-github-issue` | Creates a GitHub issue from a bug report |
| `get-github-issue-statuses` | Fetches status of GitHub issues linked to bug reports |
| `reopen-github-issue` | Reopens a GitHub issue linked to a bug report |
| `delete-account` | Handles user account deletion |