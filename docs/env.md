## Environment Variables

All variables are stored in `.env` (gitignored). Required variables:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, never exposed to client) |
| `YOUTUBE_API_KEY` | YouTube Data API key for UEC livestream search |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics measurement ID |