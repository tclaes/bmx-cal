# BMX Calendar

A central hub for BMX racing events in Belgium. Browse upcoming races, filter by type or location, build a personal calendar, and never miss a registration deadline.

## What it does

BMX Calendar brings together race schedules from multiple organisations into one clear overview. No more hunting across different websites or missing a registration deadline -- everything is in one place.

- **Browse events** -- view upcoming BMX races, competitions, and shows with full details
- **Filter and search** -- narrow down by event type, date range, or location
- **Personal calendar** -- create a free account, select the races you want to ride, and download your selection as an `.ics` calendar file that imports into Google, Apple, or Outlook Calendar
- **Registration tracking** -- see at a glance whether registration is open, closed, or opening soon
- **Livestream links** -- watch UEC European events live, with links discovered automatically each day
- **Multi-language** -- available in English, Dutch, and French
- **Installable** -- add it to your phone or desktop as a PWA for quick access and offline support

## Features

### Public

- Event calendar with filtering by type, date range, and location
- Event details with registration status, Google Maps directions, and livestream links
- Personal calendar builder with iCal (.ics) export
- Free accounts to save event selections across devices
- Beginner's guide to BMX racing in Belgium

### Account

- Sign up and sign in with email and password
- Password reset via email
- Profile management with password change and account deletion
- Save multiple calendars (e.g. one per rider in your family)

### Team Manager

- Dedicated dashboard for club managers
- Create and manage club-specific events
- Member management tools
- Team-specific event visibility controls

### Admin

- Secure login with Supabase Auth
- Event editor for creating and updating events
- Document upload to bulk import events (CSV, Excel, iCalendar, PDF)
- Bug report management with GitHub issue integration

### Automated Background Jobs

- **JSTiming sync** -- runs weekly (every Tuesday at 06:00 UTC) to sync event data from the JSTiming API, keeping registration links and event details current
- **UEC livestream search** -- runs daily (08:00 UTC) to search YouTube for live broadcasts of UEC BMX events happening that day

## Technology Stack

| Technology | Purpose |
|---|---|
| **Svelte 5** | Reactive UI framework |
| **TypeScript** | Type safety throughout the codebase |
| **Vite** | Build tool and dev server |
| **Supabase** | Database, authentication, edge functions, and secret storage |
| **Navaid** | Client-side routing |
| **Sheriff** | Module boundary enforcement |
| **Papa Parse** | CSV file parsing |
| **SheetJS** | Excel file parsing |
| **Vitest** | Test runner |
| **Stylelint** | CSS and Svelte style linting |

## Prerequisites

- **Node.js** 18 or higher
- A **Supabase** project (for the database, authentication, and edge functions)
- Optionally, a **YouTube Data API v3** key (for the automated livestream search feature)
- Optionally, a **Google Analytics** measurement ID (for usage analytics)

## Installation and Local Setup

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd bmx-calendar
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root with the following variables. You can find the Supabase values in your Supabase project dashboard under **Project Settings > API**.

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
YOUTUBE_API_KEY=your-youtube-api-key
VITE_GA_MEASUREMENT_ID=your-ga-measurement-id
```

> **Security note**: Never commit your `.env` file. It is already listed in `.gitignore`. The service role key bypasses all row-level security -- keep it private and never expose it in client-side code.

### 3. Run database migrations

Apply the SQL migrations in `supabase/migrations/` to your Supabase project. These create all tables, row-level security policies, indexes, and cron jobs. Run them in order using the Supabase SQL Editor in your dashboard.

### 4. Create an admin user

To access the admin dashboard:

1. Go to your Supabase dashboard
2. Navigate to **Authentication > Users**
3. Create a new user with email and password
4. Go to **SQL Editor** and run:

```sql
UPDATE auth.users
SET raw_app_metadata = raw_app_metadata || '{"role": "admin"}'::jsonb
WHERE email = 'your-admin@email.com';
```

### 5. Set up the YouTube API key (optional, for livestream search)

If you want the automated livestream search to work, add your YouTube API key as a Supabase Edge Function secret:

1. Go to your Supabase dashboard
2. Navigate to **Edge Functions > Manage secrets**
3. Add a secret named `YOUTUBE_API_KEY` with your YouTube Data API v3 key as the value

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server with hot reloading |
| `npm run build` | Create an optimized production build |
| `npm run preview` | Preview the production build locally |
| `npm run check` | Run TypeScript and Svelte type checking |
| `npm run sheriff` | Verify that module boundaries are respected |
| `npm run stylelint` | Check CSS and Svelte files for style rule violations |
| `npm run stylelint:fix` | Automatically fix stylelint issues |
| `npm run test` | Run the test suite once |
| `npm run test:watch` | Run the test suite in watch mode |

## Project Structure

```text
src/
├── features/              # Feature modules (smart components)
│   ├── about/            # About and contact pages
│   ├── admin/            # Admin dashboard, login, bug reports
│   ├── auth/             # Login, register, password reset
│   ├── bug-report/       # Bug report submission
│   ├── calendar/         # Event calendar, cards, filters, editor
│   ├── guide/            # BMX racing guide, FAQ, race day, tracks
│   ├── legal/            # Privacy policy, terms
│   ├── my-events/        # Personal calendar builder, saved calendars
│   ├── profile/          # User profile management
│   └── team-manager/     # Team manager dashboard
├── shared/               # Reusable code across features
│   ├── components/       # Presentational (dumb) components
│   ├── services/         # Business logic and data access
│   ├── stores/           # Svelte stores for state management
│   └── utils/            # Utility functions (parsing, export, etc.)
├── data/                 # Supabase client and data layer
├── types/                 # TypeScript type definitions
├── router/               # Client-side routing
├── i18n/                 # Internationalization (English, Dutch, French)
└── styles/               # CSS system (variables, reset, layout, utilities)

supabase/
├── migrations/           # SQL migrations (tables, RLS, cron jobs)
└── functions/            # Edge functions (Deno)
```

## Contributing

### Architecture conventions

- **Smart/dumb components**: Feature pages in `src/features/` handle data fetching and business logic. Shared components in `src/shared/components/` are pure presentation -- they receive data via props and emit events.
- **Logic in services and utilities**: Keep components thin. Business logic belongs in `src/shared/services/`, and reusable helper functions belong in `src/shared/utils/`.
- **Module boundaries**: Sheriff enforces import rules between modules. Run `npm run sheriff` to verify your changes respect these boundaries.

### Before submitting a pull request

Run all checks locally:

```bash
npm run check       # type checking
npm run sheriff     # module boundaries
npm run stylelint   # style rules
npm run test        # test suite
```

### Project conventions

- Write tests for all new feature requests
- Update tests for bug fixes (if no test exists, create one)
- Keep accessibility in mind when creating components or pages
- Use CSS logical properties (e.g. `margin-inline` instead of `margin-left`) wherever possible
- Keep files focused and under 200-300 lines when possible

### Git workflow

- Use small, focused commits with descriptive messages
- Create a feature branch for new work
- Verify the build passes before committing (`npm run build`)

## Further Documentation

- **[SETUP.md](./SETUP.md)** -- detailed setup guide including file upload formats and column mapping
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** -- architecture overview, data flow, and design principles
- **[CRON_JOBS.md](./CRON_JOBS.md)** -- background job configuration, monitoring, and troubleshooting

## License

MIT
