## Database

### Tables

| Table | Purpose |
|-------|---------|
| `events` | BMX events (title, date, location, registration, livestream, team, status) |
| `event_types` | Event categories (Race, Freestyle, etc.) with color codes, optionally team-scoped |
| `locations` | Physical locations with address, city, postal code, and maps URL |
| `teams` | BMX teams/clubs |
| `team_managers` | Links users to teams they manage |
| `team_members` | Links users to teams they belong to |
| `user_event_selections` | Events a user has selected for their personal calendar |
| `user_calendars` | Named saved calendars belonging to a user |
| `import_logs` | File import history with success/error details |
| `sync_logs` | Cron job sync history |
| `bug_reports` | User-submitted bug reports with optional GitHub issue link |

### Row Level Security (RLS)

RLS is enabled on all tables. Key policies:

- **Public read** on events, event_types, and locations (anon + authenticated)
- **Authenticated users** can manage their own `user_event_selections` and `user_calendars`
- **Team managers** can manage events, event types, and locations for their teams
- **Admins** have full CRUD on all tables
- Admin role is stored in `auth.users.raw_app_metadata` as `{"role": "admin"}`

### Migrations

All migrations are in `supabase/migrations/`. Apply them via the Supabase MCP `apply_migration` tool. Never use the Supabase CLI in this environment.

### Creating an Admin User

1. Go to your Supabase dashboard > Authentication > Users
2. Create a new user with email and password
3. Go to SQL Editor and run:

```sql
UPDATE auth.users
SET raw_app_metadata = raw_app_metadata || '{"role": "admin"}'::jsonb
WHERE email = 'your-admin@email.com';
```