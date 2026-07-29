# BMX Calendar App - Architecture Documentation

## Overview

This application is a BMX events calendar built with Svelte 5, TypeScript, and Supabase. It follows clean architecture principles with strict module boundaries enforced by Sheriff. The app serves Belgian BMX race events, supports team management, personal calendars, multi-language i18n, PWA features, and automated data syncing.

## Core Principles

### 1. KISS (Keep It Simple, Stupid)
- Components are focused on a single responsibility
- Simple, readable code over clever abstractions
- No premature optimization

### 2. Smart and Dumb Components
- **Smart Components** (in `features/`): Handle data fetching, business logic, and state management
- **Dumb Components** (in `shared/components/`): Pure presentation components that receive data via props

### 3. Module Boundaries (Sheriff)
The application enforces strict boundaries between modules. Currently configured in `sheriff.config.ts`:

```
features/calendar  → can import → [shared/components, shared/services, data, types]
features/admin     → can import → [shared/components, shared/services, data, types]
shared/components  → can import → [types]
shared/services    → can import → [data, types]
data               → can import → [types]
types              → no dependencies
```

> **Note:** Only `calendar` and `admin` features are currently tagged in the Sheriff config. The other 8 feature folders (about, auth, bug-report, guide, legal, my-events, profile, team-manager) are not yet tagged, meaning their module boundaries are not enforced. Adding them is a future improvement.

## Directory Structure

```
src/
├── features/                  # Feature modules (smart components)
│   ├── about/                 # About page and contact page
│   │   ├── AboutPage.svelte
│   │   └── GetInTouchPage.svelte
│   ├── admin/                 # Admin dashboard and management
│   │   ├── AdminDashboard.svelte
│   │   ├── BugReportsPanel.svelte
│   │   ├── DocumentUpload.svelte
│   │   ├── Login.svelte
│   │   └── TeamMemberManager.svelte
│   ├── auth/                  # Authentication pages
│   │   ├── ForgotPasswordPage.svelte
│   │   ├── LoginPage.svelte
│   │   ├── RegisterPage.svelte
│   │   └── ResetPasswordPage.svelte
│   ├── bug-report/            # User-facing bug reporting
│   │   ├── BugReportPage.svelte
│   │   └── bug-report.service.ts
│   ├── calendar/              # Calendar viewing and event management
│   │   ├── CalendarView.svelte
│   │   ├── EventCard.svelte
│   │   ├── EventEditor.svelte
│   │   ├── EventFilters.svelte
│   │   ├── EventList.svelte
│   │   └── ExportButton.svelte
│   ├── guide/                 # Informational guide pages
│   │   ├── FaqPage.svelte
│   │   ├── GuidePage.svelte
│   │   ├── RaceDayPage.svelte
│   │   └── TracksPage.svelte
│   ├── legal/                 # Legal pages
│   │   ├── PrivacyPolicyPage.svelte
│   │   └── TermsPage.svelte
│   ├── my-events/             # Personal calendar management
│   │   ├── MyEventsDemoPage.svelte
│   │   ├── MyEventsPage.svelte
│   │   ├── SaveCalendarModal.svelte
│   │   └── SavedCalendarsList.svelte
│   ├── profile/               # User profile page
│   │   └── ProfilePage.svelte
│   └── team-manager/          # Team manager dashboard
│       └── TeamManagerDashboard.svelte
│
├── shared/                    # Shared code
│   ├── components/            # Dumb components (pure presentation)
│   │   ├── AccountCTA.svelte
│   │   ├── AdBanner.svelte
│   │   ├── Alert.svelte
│   │   ├── Badge.svelte
│   │   ├── Button.svelte
│   │   ├── Card.svelte
│   │   ├── CheckboxItem.svelte
│   │   ├── CookieConsent.svelte
│   │   ├── Dropdown.svelte
│   │   ├── FileUpload.svelte
│   │   ├── Footer.svelte
│   │   ├── Input.svelte
│   │   ├── InstallPrompt.svelte
│   │   ├── LoadingSpinner.svelte
│   │   ├── LocationPicker.svelte
│   │   ├── Modal.svelte
│   │   ├── Navigation.svelte
│   │   ├── RouterView.svelte
│   │   ├── Select.svelte
│   │   ├── UpdatePrompt.svelte
│   │   └── index.ts           # Barrel export
│   │
│   ├── services/              # Business logic layer
│   │   ├── auth.service.ts     # Authentication and user management
│   │   ├── calendar.service.ts # Personal calendar CRUD and saved calendars
│   │   ├── events.service.ts   # Event CRUD operations
│   │   ├── import.service.ts   # File import and validation logic
│   │   ├── selection.service.ts # User event selection persistence
│   │   ├── team.service.ts     # Team and team member management
│   │   └── index.ts            # Barrel export
│   │
│   ├── stores/                # State management (Svelte stores)
│   │   ├── auth.store.ts       # Current user, auth state, admin/team-manager flags
│   │   ├── events.store.ts     # Events list, event types, loading state
│   │   ├── filters.store.ts    # Active filters (type, date range, search)
│   │   ├── import.store.ts     # Upload progress, import history
│   │   ├── pwa.store.ts        # Install prompt and update prompt state
│   │   ├── selection.store.ts  # User's selected events and bulk operations
│   │   └── index.ts            # Barrel export
│   │
│   └── utils/                 # Utility functions
│       ├── analytics.ts        # Page view and event tracking
│       ├── color-contrast.ts   # Accessibility color contrast checks
│       ├── cookie-consent.ts   # GDPR cookie consent logic
│       ├── csv-parser.ts       # CSV parsing (Papa Parse)
│       ├── event-grouping.ts   # Group events by year for display
│       ├── event-search.ts     # Event search/filtering logic
│       ├── excel-parser.ts     # Excel parsing (SheetJS)
│       ├── file-parser.ts     # File format detection and dispatch
│       ├── ical-exporter.ts    # iCalendar (.ics) file generation
│       ├── ical-parser.ts     # iCalendar parsing
│       ├── pdf-parser.ts       # PDF parsing
│       ├── permissions.ts      # Event edit and team-expanded state checks
│       ├── registration-status.ts # Registration open/closed/opens-soon logic
│       ├── route-meta.ts       # Per-route SEO metadata and ad-free routes
│       ├── version-checker.ts  # App version checking for PWA updates
│       └── index.ts            # Barrel export
│
├── data/                      # Data access layer
│   ├── supabase.ts            # Supabase client singleton
│   ├── index.ts               # Barrel export
│   ├── cycling_vlaanderen_events.json # Static event data
│   └── cron-jobs.test.ts      # Cron job tests
│
├── types/                     # TypeScript type definitions
│   ├── database.types.ts      # All domain types (Event, Team, Location, etc.)
│   └── index.ts               # Barrel export
│
├── i18n/                      # Internationalization
│   ├── index.ts               # Locale store, translation derived store
│   ├── types.ts               # Translations interface (all translation keys)
│   └── locales/
│       ├── en.ts              # English translations
│       ├── nl.ts              # Dutch translations
│       └── fr.ts              # French translations
│
├── config/                    # App configuration
│   └── version.ts            # App version, min version, force-update flag
│
├── router/                    # Client-side routing (navaid)
│   └── index.ts
│
├── styles/                    # CSS system
│   ├── variables.css          # Design tokens (colors, spacing, typography)
│   ├── reset.css              # Browser normalization
│   ├── layout.css             # Layout utilities
│   └── utilities.css          # Utility classes
│
├── App.svelte                 # Root app component
├── app.css                    # Global styles
├── main.ts                    # App entry point
└── test-setup.ts              # Vitest test setup
```

## Supabase Edge Functions

Located in `supabase/functions/`, these run server-side on the Supabase Deno runtime:

| Function | Purpose |
|---|---|
| `analyze-pdf` | Extract event data from uploaded PDF files |
| `create-github-issue` | Create a GitHub issue from a user bug report |
| `delete-account` | Permanently delete a user account and associated data |
| `get-github-issue-statuses` | Fetch GitHub issue statuses for bug report tracking |
| `reopen-github-issue` | Reopen a GitHub issue from a bug report |
| `search-uec-livestream` | Search YouTube for UEC event livestream URLs |
| `send-contact-email` | Send contact form emails to the project team |
| `send-password-reset` | Trigger password reset email flow |
| `sync-jstiming` | Sync event registration data from JS Timing |

All edge functions implement CORS headers and JWT verification.

## Data Flow

### Public User Flow
1. User visits the app
2. `CalendarView` loads and `EventList` fetches events via `EventsService`
3. Events stored in `eventsStore`
4. `EventCard` components render events grouped by year
5. User can filter via `EventFilters` (type, date range, location search)
6. Registration status shown per event (open, closed, opens soon)
7. Livestream links displayed for UEC events when available

### Authenticated User Flow
1. User registers or signs in via `LoginPage` / `RegisterPage`
2. `AuthService` authenticates via Supabase Auth
3. `authStore` holds user, admin flag, and team-manager flag
4. User can save events to a personal calendar (`MyEventsPage`)
5. User can export their calendar to iCal format (`ExportButton`)
6. User can manage their profile and delete their account (`ProfilePage`)

### Admin User Flow
1. Admin navigates to `/admin/login`
2. `Login` authenticates via `AuthService`
3. Redirected to `/admin` dashboard
4. `AdminDashboard` provides `DocumentUpload`, `BugReportsPanel`, `TeamMemberManager`
5. Admin uploads file (CSV/Excel/iCal/PDF)
6. File parsed by appropriate parser
7. `ImportService` validates and imports events
8. Import logged in database
9. Events appear in public calendar

### Team Manager Flow
1. Team manager signs in and navigates to `/team-manager`
2. `TeamManagerDashboard` shows team-specific events and event types
3. Team manager can add/edit events for their team
4. `TeamMemberManager` (admin) manages team members

### Bug Report Flow
1. User navigates to `/report-bug`
2. `BugReportPage` collects issue details
3. `bug-report.service` creates a database record
4. `create-github-issue` edge function files a GitHub issue
5. `BugReportsPanel` (admin) shows bug reports with GitHub status
6. Admin can reopen issues via `reopen-github-issue` edge function

### Automated Sync Flow (Cron Jobs)
1. `pg_cron` schedules run on the Supabase database
2. `sync-jstiming` edge function fetches registration data from JS Timing
3. Event registration fields updated automatically
4. `search-uec-livestream` searches YouTube for livestream URLs
5. Livestream URLs attached to matching events

## State Management

### Stores
We use Svelte stores for global state:

- **eventsStore**: Events list, event types, loading state. Includes `upcomingEvents` derived store.
- **authStore**: Current user, authentication state. Derived stores: `isAdmin`, `isTeamManager`, `userTeams`, `userManagedTeams`.
- **filtersStore**: Active filters (type, date range, search, past events toggle).
- **importStore**: Upload progress, import history.
- **selectionStore**: User's selected event IDs, bulk select/deselect by type. Includes `selectedCount` derived store and persistence via `selectionService`.
- **pwa.store**: Install prompt state (`installPromptStore`) and update prompt state (`updateStore`).

### Store Pattern
```typescript
function createStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    setData: (data) => update(state => ({ ...state, data })),
    reset: () => set(initialState),
  };
}
```

## Internationalization (i18n)

The app supports three languages: English (`en`), Dutch (`nl`), and French (`fr`).

- **Locale detection**: Checks localStorage first, then browser language, defaults to English.
- **Translation store**: `locale` writable store + `t` derived store that resolves to the active locale's translations.
- **Translation files**: Located in `src/i18n/locales/`, each exporting a `Translations` object matching the interface in `src/i18n/types.ts`.
- **Interpolation**: `interpolate()` utility replaces `{placeholder}` patterns in translation strings.

## Security

### Row Level Security (RLS)
All database tables use RLS policies:

- **Public read access**: SELECT on events and event_types (for public calendar)
- **Admin write access**: INSERT, UPDATE, DELETE on events (admin role only)
- **Team-scoped access**: Team managers and members can read team-specific events and event types
- **User-owned data**: Users can manage their own event selections, personal calendars, and bug reports
- **Import logs**: Admin-only access

### Authentication
- Supabase Auth for user management (email/password)
- Admin role stored in `app_metadata`
- Team manager role determined via `team_managers` table
- Route guards check authentication state via `authStore`
- Session management automatic via Supabase
- Password reset flow via `send-password-reset` edge function
- Account deletion via `delete-account` edge function

## File Import System

### Supported Formats
1. **CSV** - Parsed with Papa Parse
2. **Excel** (.xlsx, .xls) - Parsed with SheetJS
3. **iCalendar** (.ics) - Custom parser
4. **PDF** - Parsed via `analyze-pdf` edge function

### Import Process
1. File uploaded via drag-and-drop or file picker
2. Format detected by file extension (`file-parser.ts`)
3. Appropriate parser extracts events
4. Events validated (required fields, date format)
5. Event types mapped to database IDs
6. Bulk insert to database
7. Import logged with success/error details

### Validation Rules
- Title is required
- Date is required (YYYY-MM-DD format)
- Location is required
- Event type mapped to existing types (optional)
- Times in HH:MM format (optional)

## PWA Features

- **Service worker** (`public/sw.js`) for offline caching
- **Install prompt** (`InstallPrompt.svelte`) with PWA install detection
- **Update prompt** (`UpdatePrompt.svelte`) with version checking via `version-checker.ts`
- **Web app manifest** (`public/manifest.json`)
- Version config in `src/config/version.ts` (current version, minimum version, force-update flag)

## Calendar Export

- Users can select events and export them as an iCalendar (.ics) file
- `ical-exporter.ts` generates the iCal content and triggers download
- `ExportButton.svelte` provides the UI trigger
- Saved calendars persist in the database via `calendar.service.ts`

## Styling System

### CSS Architecture
- **variables.css**: Design tokens (colors, spacing, typography)
- **reset.css**: Browser normalization
- **layout.css**: Grid and flexbox utilities
- **utilities.css**: Margin, padding, text utilities

### Component Styles
- Scoped styles in each component
- Use CSS custom properties from variables
- No global CSS classes
- No BEM, no Tailwind
- Logical properties (e.g., `margin-inline`, `padding-block`) preferred

### Responsive Design
- Mobile-first approach
- Breakpoints: 768px, 1024px
- Flexible grid layouts
- Touch-friendly targets

## SEO and Analytics

- **Route metadata**: `route-meta.ts` defines per-route title, description, and canonical URL
- **Ad-free routes**: `NO_AD_ROUTES` set excludes auth/profile/admin pages from AdSense
- **Analytics**: `analytics.ts` tracks page views and custom events
- **Sitemap and robots**: `public/sitemap.xml` and `public/robots.txt`
- **Cookie consent**: GDPR-compliant cookie consent via `CookieConsent.svelte` and `cookie-consent.ts`

## Testing Strategy

### Automated Tests
The project uses Vitest with jsdom and axe-core for accessibility testing:

- **Component tests**: Svelte component rendering and behavior (`*.test.ts` in `shared/components/`)
- **Service tests**: Auth service tests (`shared/services/auth-service.test.ts`)
- **Store tests**: Auth store, events store, PWA, install/update prompt tests
- **Utility tests**: Event grouping, event search, registration status, color contrast, cookie consent, permissions, version checker, team expanded state
- **Accessibility tests**: axe-core integration (`axe-components.test.ts`, `a11y-fixes.test.ts`)
- **Edge function tests**: Security tests and livestream search tests
- **Cron job tests**: `data/cron-jobs.test.ts`

Run tests with `npm run test` (single run) or `npm run test:watch` (watch mode).

### Sheriff Verification
Run `npm run sheriff` to verify module boundaries are respected.

## Future Scalability

### Easy to Add
- New event fields (update `database.types.ts` and database schema)
- New file formats (add parser in `shared/utils/`)
- New filters (add to `filtersStore`)
- New languages (add locale file in `i18n/locales/`)
- New pages (add route in `router/index.ts`, feature folder, and route meta)

### Requires Planning
- Tag remaining feature folders in Sheriff config for boundary enforcement
- Real-time event updates
- Event analytics
- Payment processing
- Mobile app

## Best Practices

### When Adding Features
1. Identify if it's a feature or shared component
2. Smart components in `features/`, dumb in `shared/components/`
3. Business logic in `shared/services/`
4. Keep files at a manageable size for readability
5. Run `npm run sheriff` to verify boundaries
6. Write tests for new features
7. Update tests for bug fixes
8. Keep a11y in mind when creating components or pages
9. Use utility functions instead of logic in components
10. Use logical properties in CSS

### Code Style
- No comments unless explaining non-obvious logic
- Descriptive variable names
- Single responsibility per function/component
- Prefer composition over inheritance

### Git Workflow
- Small, focused commits
- Descriptive commit messages
- Feature branches for new features
- Verify build before committing

## Troubleshooting

### Build Errors
- Check TypeScript errors: `npm run check`
- Verify Sheriff boundaries: `npm run sheriff`
- Check linting: `npm run stylelint`
- Clear cache: `rm -rf node_modules dist && npm install`

### Runtime Errors
- Check browser console
- Verify Supabase connection
- Check RLS policies
- Validate environment variables

### Import Issues
- Verify file format matches extension
- Check column names in CSV/Excel
- Validate date format (YYYY-MM-DD)
- Ensure event types exist in database
