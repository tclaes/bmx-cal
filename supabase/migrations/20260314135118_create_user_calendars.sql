/*
  # Create user_calendars table

  ## Summary
  Allows logged-in users to save a named snapshot of their current event selection.
  Each saved calendar records which events were selected at the time it was saved.

  ## New Tables

  ### user_calendars
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, FK → auth.users) - Owner of the calendar
  - `name` (text) - User-supplied name for the calendar
  - `created_at` (timestamptz) - When the calendar was saved

  ### user_calendar_events
  - `id` (uuid, primary key)
  - `calendar_id` (uuid, FK → user_calendars) - The parent calendar
  - `event_id` (uuid, FK → events) - The selected event
  - Unique constraint on (calendar_id, event_id)

  ## Security
  - RLS enabled on both tables
  - Users can only read/insert/delete their own calendars and their calendar events
*/

CREATE TABLE IF NOT EXISTS user_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendars"
  ON user_calendars FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendars"
  ON user_calendars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendars"
  ON user_calendars FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS user_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES user_calendars(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE(calendar_id, event_id)
);

ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar events"
  ON user_calendar_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_calendars
      WHERE user_calendars.id = user_calendar_events.calendar_id
        AND user_calendars.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own calendar events"
  ON user_calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_calendars
      WHERE user_calendars.id = user_calendar_events.calendar_id
        AND user_calendars.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own calendar events"
  ON user_calendar_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_calendars
      WHERE user_calendars.id = user_calendar_events.calendar_id
        AND user_calendars.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_user_calendars_user_id ON user_calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_calendar_id ON user_calendar_events(calendar_id);
