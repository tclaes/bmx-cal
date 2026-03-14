/*
  # Add team_id to events

  ## Summary
  Links events to a team so team managers can create and manage events on behalf of their team.

  ## Changes

  ### Modified Tables
  - `events`: Added `team_id` (nullable uuid FK to teams) — null means it's a general/admin event

  ## Security
  - New RLS policy: team managers can insert events for their own team
  - New RLS policy: team managers can update/delete events for their own team
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE events ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_team_id ON events(team_id);

-- Team managers can insert events for teams they manage
CREATE POLICY "Team managers can insert team events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.user_id = auth.uid()
      AND team_managers.team_id = events.team_id
    )
  );

-- Team managers can update events for teams they manage
CREATE POLICY "Team managers can update team events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.user_id = auth.uid()
      AND team_managers.team_id = events.team_id
    )
  )
  WITH CHECK (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.user_id = auth.uid()
      AND team_managers.team_id = events.team_id
    )
  );

-- Team managers can delete events for teams they manage
CREATE POLICY "Team managers can delete team events"
  ON events FOR DELETE
  TO authenticated
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.user_id = auth.uid()
      AND team_managers.team_id = events.team_id
    )
  );
