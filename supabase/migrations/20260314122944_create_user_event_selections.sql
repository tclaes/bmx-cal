/*
  # User Event Selections

  1. New Tables
    - `user_event_selections`
      - `id` (uuid, primary key) - Unique identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `event_id` (uuid, foreign key) - References events
      - `created_at` (timestamptz) - When selection was made
      - Unique constraint on (user_id, event_id) to prevent duplicates

  2. Security
    - Enable RLS on `user_event_selections` table
    - Users can view their own selections
    - Users can insert their own selections
    - Users can delete their own selections

  3. Performance
    - Index on user_id for fast lookups
    - Index on event_id for joins
*/

CREATE TABLE IF NOT EXISTS user_event_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE user_event_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own selections"
  ON user_event_selections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own selections"
  ON user_event_selections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own selections"
  ON user_event_selections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_event_selections_user_id ON user_event_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_selections_event_id ON user_event_selections(event_id);
