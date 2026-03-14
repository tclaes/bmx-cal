/*
  # Restrict team event types to authenticated users

  ## Changes
  - Drops the "Anyone can view event types" SELECT policy which exposed all event types,
    including team-specific ones, to unauthenticated visitors.
  - Adds two new SELECT policies:
    1. Public event types (team_id IS NULL) remain visible to everyone.
    2. Team event types (team_id IS NOT NULL) are only visible to authenticated users.

  ## Security
  - Unauthenticated visitors can no longer see team-specific event types (e.g. dare2race).
  - Authenticated users can see all event types.
*/

DROP POLICY IF EXISTS "Anyone can view event types" ON event_types;

CREATE POLICY "Anyone can view public event types"
  ON event_types
  FOR SELECT
  USING (team_id IS NULL);

CREATE POLICY "Authenticated users can view team event types"
  ON event_types
  FOR SELECT
  TO authenticated
  USING (team_id IS NOT NULL);
