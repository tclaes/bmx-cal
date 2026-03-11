# BMX Calendar App - Architecture Documentation

## Overview

This application is a BMX events calendar built with Svelte, TypeScript, and Supabase. It follows clean architecture principles with strict module boundaries enforced by Sheriff.

## Core Principles

### 1. KISS (Keep It Simple, Stupid)
- Components are focused on a single responsibility
- Simple, readable code over clever abstractions
- No premature optimization

### 2. Smart and Dumb Components
- **Smart Components** (in `features/`): Handle data fetching, business logic, and state management
- **Dumb Components** (in `shared/components/`): Pure presentation components that receive data via props

### 3. Module Boundaries (Sheriff)
The application enforces strict boundaries between modules:

```
features/calendar  → can import → [shared/components, shared/services, data, types]
features/admin     → can import → [shared/components, shared/services, data, types]
shared/components  → can import → [types]
shared/services    → can import → [data, types]
data               → can import → [types]
types              → no dependencies
```

## Directory Structure

```
src/
├── features/              # Feature modules (smart components)
│   ├── calendar/         # Calendar viewing features
│   │   ├── CalendarView.svelte      # Main calendar container
│   │   ├── EventList.svelte         # Event list with filtering
│   │   ├── EventCard.svelte         # Individual event display
│   │   └── EventFilters.svelte      # Filter controls
│   └── admin/            # Admin features
│       ├── AdminDashboard.svelte    # Admin dashboard container
│       ├── Login.svelte             # Admin login form
│       └── DocumentUpload.svelte    # File upload and import
│
├── shared/               # Shared code
│   ├── components/      # Dumb components (pure presentation)
│   │   ├── Button.svelte
│   │   ├── Input.svelte
│   │   ├── Select.svelte
│   │   ├── Card.svelte
│   │   ├── Modal.svelte
│   │   ├── LoadingSpinner.svelte
│   │   ├── Alert.svelte
│   │   ├── Badge.svelte
│   │   ├── FileUpload.svelte
│   │   └── Navigation.svelte
│   │
│   ├── services/        # Business logic layer
│   │   ├── events.service.ts    # Event CRUD operations
│   │   ├── auth.service.ts      # Authentication logic
│   │   └── import.service.ts    # Import and validation logic
│   │
│   ├── stores/          # State management (Svelte stores)
│   │   ├── events.store.ts      # Events state
│   │   ├── auth.store.ts        # Auth state
│   │   ├── filters.store.ts     # Filter state
│   │   └── import.store.ts      # Import state
│   │
│   └── utils/           # Utility functions
│       ├── file-parser.ts       # File format detection
│       ├── csv-parser.ts        # CSV parsing
│       ├── excel-parser.ts      # Excel parsing
│       └── ical-parser.ts       # iCalendar parsing
│
├── data/                # Data access layer
│   └── supabase.ts     # Supabase client singleton
│
├── types/               # TypeScript type definitions
│   ├── database.types.ts
│   └── index.ts
│
├── router/              # Client-side routing
│   └── index.ts
│
└── styles/              # CSS system
    ├── variables.css   # CSS custom properties
    ├── reset.css       # CSS reset
    ├── layout.css      # Layout utilities
    └── utilities.css   # Utility classes
```

## Data Flow

### Public User Flow
1. User visits the app
2. `CalendarView` component loads
3. `EventList` fetches events via `EventsService`
4. Events stored in `eventsStore`
5. `EventCard` components render events
6. User can filter via `EventFilters`

### Admin User Flow
1. Admin navigates to `/admin/login`
2. `Login` component authenticates via `AuthService`
3. User redirected to `/admin`
4. `AdminDashboard` renders `DocumentUpload`
5. Admin uploads file
6. File parsed by appropriate parser (CSV/Excel/iCal)
7. `ImportService` validates and imports events
8. Import logged in database
9. Events appear in public calendar

## State Management

### Stores
We use Svelte stores for global state:

- **eventsStore**: Events list, event types, loading state
- **authStore**: Current user, authentication state
- **filtersStore**: Active filters (type, date range, search)
- **importStore**: Upload progress, import history

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

## Security

### Row Level Security (RLS)
All database tables use RLS policies:

- **Public access**: SELECT on events and event_types
- **Admin only**: INSERT, UPDATE, DELETE on events
- **Admin only**: All operations on import_logs

### Authentication
- Supabase Auth for user management
- Admin role stored in `app_metadata`
- Route guards check authentication state
- Session management automatic via Supabase

## File Import System

### Supported Formats
1. **CSV** - Parsed with Papa Parse
2. **Excel** (.xlsx, .xls) - Parsed with SheetJS
3. **iCalendar** (.ics) - Custom parser

### Import Process
1. File uploaded via drag-and-drop or file picker
2. Format detected by file extension
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

### Responsive Design
- Mobile-first approach
- Breakpoints: 768px, 1024px
- Flexible grid layouts
- Touch-friendly targets

## Performance

### Optimizations
- Derived stores for computed values
- Lazy loading of admin features
- Efficient filtering with reactive statements
- Minimal re-renders with Svelte reactivity

### Build Output
- Single bundle for simplicity
- Tree-shaking via Vite
- CSS minification
- Asset optimization

## Testing Strategy

### Manual Testing
- Test event viewing as public user
- Test admin login and logout
- Test file upload with each format
- Test validation error handling
- Test filtering and search

### Sheriff Verification
Run `npm run sheriff` to verify module boundaries are respected.

## Future Scalability

The architecture supports future additions:

### Easy to Add
- New event fields (just update types and database)
- New file formats (add parser in utils/)
- New filters (add to filtersStore)
- User registration for events
- Email notifications
- Multi-language support

### Requires Planning
- Multi-organization support
- Real-time updates
- Event analytics
- Payment processing
- Mobile app

## Best Practices

### When Adding Features
1. Identify if it's a feature or shared component
2. Smart components in `features/`, dumb in `shared/components/`
3. Business logic in `shared/services/`
4. Keep files under 300 lines
5. Run `npm run sheriff` to verify boundaries

### Code Style
- No comments unless explaining complex logic
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
