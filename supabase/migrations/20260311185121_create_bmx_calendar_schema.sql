/*
  # BMX Calendar Database Schema

  ## New Tables
  
  1. `event_types`
    - `id` (uuid, primary key)
    - `name` (text) - Type of BMX event (race, freestyle, park, street, etc.)
    - `color_code` (text) - Hex color for display purposes
    - `created_at` (timestamptz)
  
  2. `events`
    - `id` (uuid, primary key)
    - `title` (text) - Event name
    - `description` (text) - Event details
    - `date` (date) - Event date
    - `start_time` (time) - Event start time
    - `end_time` (time) - Event end time
    - `location` (text) - Event venue/location
    - `event_type_id` (uuid, foreign key) - Reference to event_types
    - `status` (text) - Event status (upcoming, completed, cancelled)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  3. `admin_users`
    - Created via Supabase Auth, using auth.users table
    - We'll use app_metadata to mark admin users
  
  4. `import_logs`
    - `id` (uuid, primary key)
    - `filename` (text) - Name of uploaded file
    - `imported_by` (uuid, foreign key) - Reference to auth.users
    - `imported_at` (timestamptz) - Import timestamp
    - `events_count` (integer) - Number of events imported
    - `status` (text) - Import status (success, partial, failed)
    - `error_log` (jsonb) - Any errors encountered during import
    - `created_at` (timestamptz)

  ## Security
  
  - Enable RLS on all tables
  - Public users can read events and event_types (upcoming events only)
  - Only authenticated admin users can write to events and event_types
  - Only authenticated admin users can read/write import_logs
*/

-- Create event_types table
CREATE TABLE IF NOT EXISTS event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color_code text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  date date NOT NULL,
  start_time time,
  end_time time,
  location text NOT NULL,
  event_type_id uuid REFERENCES event_types(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create import_logs table
CREATE TABLE IF NOT EXISTS import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  imported_at timestamptz DEFAULT now(),
  events_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_user ON import_logs(imported_by);

-- Enable Row Level Security
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_types
CREATE POLICY "Anyone can view event types"
  ON event_types FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated admins can insert event types"
  ON event_types FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Authenticated admins can update event types"
  ON event_types FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Authenticated admins can delete event types"
  ON event_types FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

-- RLS Policies for events
CREATE POLICY "Anyone can view upcoming events"
  ON events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Authenticated admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Authenticated admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

-- RLS Policies for import_logs
CREATE POLICY "Authenticated admins can view import logs"
  ON import_logs FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

CREATE POLICY "Authenticated admins can insert import logs"
  ON import_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

-- Insert default event types
INSERT INTO event_types (name, color_code) VALUES
  ('Race', '#ef4444'),
  ('Freestyle', '#f59e0b'),
  ('Park', '#10b981'),
  ('Street', '#3b82f6'),
  ('Dirt', '#8b5cf6'),
  ('Flatland', '#ec4899')
ON CONFLICT (name) DO NOTHING;
