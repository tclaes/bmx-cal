/*
  # Restrict team events to authenticated users

  ## Changes
  - Drops the existing "Anyone can view events" SELECT policy which allowed all events to be read
    by unauthenticated users.
  - Adds two new SELECT policies:
    1. Public events (team_id IS NULL) remain visible to everyone (anon + authenticated).
    2. Team events (team_id IS NOT NULL) are only visible to authenticated users.

  ## Security
  - Unauthenticated (anonymous) visitors can no longer see team-specific events.
  - All authenticated users can see both public and team events.
*/

DROP POLICY IF EXISTS "Anyone can view events" ON events;

CREATE POLICY "Anyone can view public events"
  ON events
  FOR SELECT
  USING (team_id IS NULL);

CREATE POLICY "Authenticated users can view team events"
  ON events
  FOR SELECT
  TO authenticated
  USING (team_id IS NOT NULL);
