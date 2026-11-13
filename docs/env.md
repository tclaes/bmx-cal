## Environment Variables

All variables are stored in `.env` (gitignored). Required variables:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, never exposed to client) |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics measurement ID |

For running the app against a local, seeded Supabase (generated `.env.e2e.local`), see `docs/test-env.md`.
