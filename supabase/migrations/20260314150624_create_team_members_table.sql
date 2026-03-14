/*
  # Create team_members table

  ## Summary
  Introduces a distinct "member" role for teams, separate from "team managers".
  A team member can view team-specific events but cannot manage them.
  Only admins can add members to teams. Team managers can remove members from their own team.

  ## New Tables
  - `team_members`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users) — the member
    - `team_id` (uuid, references teams) — the team they belong to
    - `created_at` (timestamptz)
    - Unique constraint on (user_id, team_id) to prevent duplicates

  ## Security
  - RLS enabled
  - Admins can view all rows, insert, update, and delete
  - Team managers can view members of their own team(s)
  - Team managers can delete members of their own team(s)
  - Members can view their own row (so the app can load their team memberships)

  ## Notes
  1. This table does NOT replace team_managers. team_managers = people who manage/create events. team_members = riders/participants.
  2. The events RLS SELECT policy will be updated separately to allow team members to see team events.
*/

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, team_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON team_members(team_id);

CREATE POLICY "Admins can view all team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');

CREATE POLICY "Admins can insert team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');

CREATE POLICY "Admins can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');

CREATE POLICY "Team managers can view members of their teams"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.team_id = team_members.team_id
        AND team_managers.user_id = auth.uid()
    )
  );

CREATE POLICY "Team managers can remove members from their teams"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.team_id = team_members.team_id
        AND team_managers.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view own membership"
  ON team_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
