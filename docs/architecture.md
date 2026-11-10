## Architecture

### Module Boundaries (Sheriff)

Sheriff enforces strict import boundaries between modules to prevent circular dependencies:

```
features/calendar   → can import → [ui, components, services, stores, data, types]
features/admin      → can import → [ui, components, services, stores, data, types]
shared/components   → can import → [ui, services, stores, types]
lib/core/services   → can import → [data, types]
lib/core/stores     → can import → [services, utils, types]
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
├── lib/                     # Reusable libraries
│   ├── ui/                 # Dumb/presentational components (Button, Input, Modal, etc.)
│   └── core/               # App-wide services and stores
│       ├── services/       # Business logic (events, auth, import, calendar, team, selection)
│       └── stores/         # Svelte stores (auth, events, filters, import, pwa, selection)
│
├── shared/                  # Shared code across features
│   ├── components/         # App-specific widgets (Navigation, InstallPrompt, LocationPicker, etc.)
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