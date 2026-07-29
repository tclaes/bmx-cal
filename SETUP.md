# BMX Calendar App - Setup Guide

This is a BMX events calendar application built with Svelte, TypeScript, and Supabase.

## Architecture

The application follows a clean, modular architecture with Sheriff enforcing module boundaries:

- **features/** - Feature modules (calendar, admin)
- **shared/** - Reusable components, services, stores, and utilities
- **data/** - Supabase client and data layer
- **types/** - TypeScript type definitions
- **router/** - Client-side routing

### Design Principles

- **KISS (Keep It Simple, Stupid)** - Simple, focused components
- **Smart/Dumb Components** - Smart components handle logic, dumb components are pure presentation
- **Sheriff Boundaries** - Enforced module dependencies prevent circular imports

## Prerequisites

- Node.js 22 or higher
- A Supabase account and project

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Database Setup

The database schema has been automatically created with the following tables:

- **event_types** - Categories for BMX events (Race, Freestyle, Park, etc.)
- **events** - Event information (title, date, location, etc.)
- **import_logs** - Track file imports

## Creating an Admin User

To access the admin dashboard, you need to create a user with admin privileges:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Create a new user with email and password
4. Go to SQL Editor and run:

```sql
UPDATE auth.users
SET raw_app_metadata = raw_app_metadata || '{"role": "admin"}'::jsonb
WHERE email = 'your-admin@email.com';
```

## Running the Application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

Verify Sheriff boundaries:
```bash
npm run sheriff
```

## Features

### Public Features

- View upcoming BMX events
- Filter events by type, date range
- Responsive design for all devices

### Admin Features

- Secure login with Supabase Auth
- Upload event calendars (CSV, Excel, iCalendar)
- Bulk import events from files
- View import history

## Supported File Formats

The admin can upload event calendars in the following formats:

### CSV Format
```csv
title,date,location,event_type,description,start_time,end_time
BMX Race Championship,2024-06-15,New York,Race,Annual championship,10:00,16:00
```

### Excel Format
Same columns as CSV, in .xlsx or .xls format

### iCalendar Format (.ics)
Standard iCalendar format with VEVENT entries

## File Upload Column Mapping

The parser accepts flexible column names:

- **Title**: title, Title, event, Event
- **Date**: date, Date (YYYY-MM-DD format)
- **Location**: location, Location, venue, Venue
- **Event Type**: event_type, Event_Type, type, Type
- **Description**: description, Description
- **Start Time**: start_time, Start_Time, time, Time
- **End Time**: end_time, End_Time

## Security

- Row Level Security (RLS) enabled on all tables
- Public users can only view events
- Admin users can create, update, and delete events
- Authentication state managed securely with Supabase Auth

## Technology Stack

- **Svelte 4** - Reactive UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Supabase** - Backend and database
- **Sheriff** - Module boundary enforcement
- **Navaid** - Client-side routing
- **Papa Parse** - CSV parsing
- **SheetJS** - Excel parsing

## Project Structure

```
src/
├── features/           # Feature modules
│   ├── calendar/      # Calendar views
│   └── admin/         # Admin dashboard
├── shared/            # Shared code
│   ├── components/   # Dumb components
│   ├── services/     # Business logic
│   ├── stores/       # State management
│   └── utils/        # Utility functions
├── data/             # Data layer
├── types/            # TypeScript types
├── router/           # Routing
└── styles/           # CSS system
```

## Contributing

When adding new features:

1. Follow the smart/dumb component pattern
2. Place components in the appropriate feature or shared folder
3. Run `npm run sheriff` to verify boundaries
4. Keep files focused and under 200-300 lines when possible

## License

MIT
