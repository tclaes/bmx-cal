## Environment Variables

All variables are stored in `.env` (gitignored).

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts only | Supabase service role key (server-side only, never exposed to client) |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics measurement ID. When empty, the build removes the gtag tag from `index.html` and sends no analytics |
| `VITE_VAPID_PUBLIC_KEY` | No | Web push public key. When empty, `push.service.ts` falls back to the built-in production key |

For running the app against a local, seeded Supabase (generated `.env.e2e.local`), see `docs/test-env.md`.

For the production values on Netlify, see `docs/deploy.md`.
