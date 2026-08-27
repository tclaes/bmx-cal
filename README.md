# BMX Calendar

A Progressive Web App for discovering, tracking, and managing BMX races, cups, and events across Belgium. Built with Svelte, TypeScript, Vite, and Supabase.

Live site: [bmxkalender.be](https://bmxkalender.be)

## Features

### Public

- Browse and filter BMX events by type, date range, team, and search
- Event cards with registration status, deadlines, location maps, and livestream links
- Beginner-friendly guide pages: racing guide, FAQ, race-day checklist, track directory
- About and get-in-touch pages
- Privacy policy and terms of service
- Multi-language support: English, Dutch, French (auto-detected, user-switchable)
- PWA install prompt and update notifications
- Cookie consent banner with granular settings
- AdSense integration with route-level ad suppression on utility/auth screens

### Authenticated Users

- Build a personal BMX season calendar ("My Events") by selecting races from the shared calendar
- Export personal calendar to iCal for Apple, Google, or Outlook
- Save and manage multiple named calendars
- User profile page

### Team Managers

- Team manager dashboard
- Create and manage team-specific events and event types
- Manage team members

### Admins

- Admin dashboard with event management, document upload, bug reports panel, and team member manager
- Event editor with full CRUD on events, locations, and event types
- Bulk import events from CSV, Excel, iCal, or PDF files
- View import history and sync logs
- Bug report triage with GitHub issue integration

## Tech Stack

- **Svelte 4** - Reactive UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Supabase** - PostgreSQL database, Auth, Edge Functions, and storage
- **Navaid** - Lightweight client-side router
- **Sheriff** - Module boundary enforcement
- **PapaParse** - CSV parsing
- **SheetJS** - Excel parsing
- **Vitest** - Unit testing

## Getting Started

### Prerequisites

- Node.js 22 or higher
- A Supabase project (URL and anon key)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env` (see [Environment Variables](#environment-variables) below).

3. Start the dev server:
   ```bash
   npm run dev
   ```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run check` | Type-check with svelte-check and tsc |
| `npm run sheriff` | Verify Sheriff module boundaries |
| `npm run stylelint` | Lint CSS and Svelte styles |
| `npm run stylelint:fix` | Auto-fix stylelint issues |
| `npm test` | Run unit tests with Vitest |
| `npm run test:watch` | Run Vitest in watch mode |

## Environment Variables

All variables are stored in `.env` (gitignored). Required variables:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, never exposed to client) |
| `YOUTUBE_API_KEY` | YouTube Data API key for UEC livestream search |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics measurement ID |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins for password reset emails (e.g., `https://bmxcalendar.be,http://localhost:5173`). Defaults to `SUPABASE_URL` if not set. **Important for security**: Configure this in production to prevent password-reset token exfiltration attacks. |

## Architecture

### Module Boundaries (Sheriff)

Sheriff enforces strict import boundaries between modules to prevent circular dependencies:

```
features/calendar   → can import → [components, services, data, types]
features/admin      → can import → [components, services, data, types]
shared/components   → can import → [types]
shared/services     → can import → [data, types]
data                → can import → [types]
types               → no dependencies
```

Run `npm run sheriff` to verify boundaries are respected.

### Design Principles

- **Smart/Dumb Components** - Smart components (in `features/`) handle data fetching and business logic; dumb components (in `shared/components/`) are pure presentation receiving data via props.
- **Single Responsibility** - Each file has one clear purpose; things that change together belong together.
- **KISS** - Simple, readable code over clever abstractions.

### Directory Structure

```
src/
├── features/                # Feature modules (smart components)
│   ├── calendar/           # Calendar view, event list, cards, filters, editor, export
│   ├── admin/              # Admin dashboard, login, bug reports, document upload, team member manager
│   ├── auth/               # Login, register, forgot/reset password pages
│   ├── profile/            # User profile page
│   ├── my-events/          # Personal calendar builder, saved calendars, iCal export
│   ├── team-manager/       # Team manager dashboard
│   ├── bug-report/         # Bug report form and service
│   ├── about/              # About and get-in-touch pages
│   ├── guide/              # Guide, FAQ, race-day checklist, tracks pages
│   └── legal/              # Privacy policy and terms pages
│
├── shared/                  # Shared code across features
│   ├── components/         # Dumb/presentational components (Button, Input, Modal, etc.)
│   ├── services/          # Business logic (events, auth, import, calendar, team, selection)
│   ├── stores/             # Svelte stores (auth, events, filters, import, pwa, selection)
│   └── utils/              # Utilities (parsers, analytics, iCal export, permissions, etc.)
│
├── data/                    # Supabase client and data layer
├── types/                   # TypeScript type definitions
├── router/                  # Client-side routing (Navaid)
├── i18n/                    # Internationalization (EN/NL/FR locales)
├── config/                  # App version config
├── styles/                  # CSS system (variables, reset, layout, utilities)
└── assets/                  # Static assets (PDF calendar)
```

### State Management

Svelte stores are used for global state:

- **authStore** - Current user, authentication state, role
- **eventsStore** - Events list, event types, loading state
- **filtersStore** - Active filters (type, date range, search, team)
- **importStore** - Upload progress, import history
- **selectionStore** - User's selected events for personal calendar
- **pwaStore** - PWA install/update state

### Routing

Client-side routing via Navaid. Routes are defined in `src/router/index.ts`. Route guards in `App.svelte` check authentication and role before rendering admin, team-manager, and profile pages.

### Styling

- CSS custom properties defined in `src/styles/variables.css` (color ramps, spacing scale, typography, border radii, transitions)
- Mobile-first responsive design with breakpoints at 768px and 1024px
- Scoped styles per Svelte component; no Tailwind or BEM

### Internationalization

- Three locales: `en`, `nl`, `fr`
- Translations in `src/i18n/locales/`
- Locale auto-detected from browser language or localStorage, user-switchable
- Accessed via the `t` derived store and `interpolate()` helper

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

## Cron Jobs

Two `pg_cron` jobs run automated background tasks. See [CRON_JOBS.md](./CRON_JOBS.md) for full details, monitoring queries, and troubleshooting.

| Job | Schedule | Purpose |
|-----|----------|---------|
| `sync-jstiming-weekly` | Every Tuesday 06:00 UTC | Calls `sync-jstiming` edge function |
| `search-uec-livestream-daily` | Every day 08:00 UTC | Calls `search-uec-livestream` edge function |

## File Import System

Admins can bulk import events from uploaded files. Supported formats:

### CSV

```csv
title,date,location,event_type,description,start_time,end_time
BMX Race Championship,2026-06-15,Kessel-Lo,Race,Annual championship,10:00,16:00
```

### Excel (.xlsx, .xls)

Same columns as CSV.

### iCalendar (.ics)

Standard iCalendar format with VEVENT entries.

### PDF

Event data extracted via the `analyze-pdf` edge function.

### Column Mapping

The parser accepts flexible column names:

| Field | Accepted headers |
|-------|-----------------|
| Title | `title`, `Title`, `event`, `Event` |
| Date | `date`, `Date` (YYYY-MM-DD format) |
| Location | `location`, `Location`, `venue`, `Venue` |
| Event Type | `event_type`, `Event_Type`, `type`, `Type` |
| Description | `description`, `Description` |
| Start Time | `start_time`, `Start_Time`, `time`, `Time` |
| End Time | `end_time`, `End_Time` |

### Validation Rules

- Title is required
- Date is required (YYYY-MM-DD format)
- Location is required
- Event type is optional (mapped to existing types if provided)
- Times are optional (HH:MM format)

## Contributing

When adding new features:

1. Follow the smart/dumb component pattern - smart components in `features/`, dumb in `shared/components/`
2. Place business logic in `shared/services/`, utilities in `shared/utils/`
3. Run `npm run sheriff` to verify module boundaries
4. Run `npm run check` to verify types
5. Run `npm test` to verify tests pass
6. Keep files focused and under 300 lines when possible
7. Make small, focused commits with descriptive messages

## Troubleshooting

### Build Errors

- Check TypeScript errors: `npm run check`
- Verify Sheriff boundaries: `npm run sheriff`
- Clear cache: `rm -rf node_modules dist && npm install`

### Runtime Errors

- Check browser console for errors
- Verify Supabase connection and environment variables
- Check RLS policies if data is missing or writes fail
- Verify edge function secrets are configured (e.g., `YOUTUBE_API_KEY`)

### Import Issues

- Verify file format matches the file extension
- Check column names in CSV/Excel match accepted headers
- Validate date format is YYYY-MM-DD
- Ensure event types referenced in the file exist in the database

## License

MIT
