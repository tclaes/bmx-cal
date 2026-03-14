/*
  # Create Teams and Team Managers

  ## Summary
  Introduces the concept of teams and team managers into the BMX calendar system.

  ## New Tables

  ### 1. `teams`
  Stores teams that can be associated with events.
  - `id` (uuid): Primary key
  - `name` (text, unique): Team name (e.g. "Dare2Race")
  - `created_at` (timestamptz): Creation timestamp

  ### 2. `team_managers`
  Links users to teams with a team manager role.
  - `id` (uuid): Primary key
  - `user_id` (uuid, FK to auth.users): The manager's user account
  - `team_id` (uuid, FK to teams): The team they manage
  - `created_at` (timestamptz): When the role was assigned
  - Unique constraint on (user_id, team_id) — one user can only manage a team once

  ## Security
  - RLS enabled on both tables
  - Anyone can read teams (public)
  - Only admins can insert/update/delete teams
  - Users can read their own team_manager rows
  - Only admins can manage team_manager assignments
*/

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams"
  ON teams FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete teams"
  ON teams FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');


CREATE TABLE IF NOT EXISTS team_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, team_id)
);

ALTER TABLE team_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team manager rows"
  ON team_managers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all team manager rows"
  ON team_managers FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert team managers"
  ON team_managers FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete team managers"
  ON team_managers FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE INDEX IF NOT EXISTS idx_team_managers_user_id ON team_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_team_managers_team_id ON team_managers(team_id);
