/*
  # Allow team managers to insert locations

  ## Summary
  Team managers need to be able to add new locations when creating events.
  This migration adds an INSERT policy on the locations table for users who manage at least one team.

  ## Changes
  - New RLS policy: team managers can insert locations
*/

CREATE POLICY "Team managers can insert locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.user_id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
