/*
  # Allow admins to view all team events

  ## Summary
  Adds a SELECT policy on the events table so that admin users (identified by
  app_metadata role = 'admin') can read events belonging to any team.

  ## Changes
  - New SELECT policy: "Admins can view all team events"

  ## Security
  - Uses auth.jwt() -> app_metadata -> role check, consistent with all other
    admin checks in this project
*/

CREATE POLICY "Admins can view all team events"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  );
