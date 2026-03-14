/*
  # Restrict team event types to team members and managers

  ## Summary
  The previous "Authenticated users can view team event types" policy allowed any logged-in
  user to see team-specific event types. This replaces it with a stricter check: only
  members or managers of the specific team can see that team's event type.

  ## Changes
  - Drops "Authenticated users can view team event types" SELECT policy on event_types
  - Adds a stricter policy checking team_members OR team_managers for the event type's team_id
  - Also allows admins to view all event types
*/

DROP POLICY IF EXISTS "Authenticated users can view team event types" ON event_types;

CREATE POLICY "Team members and managers can view team event types"
  ON event_types FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL AND (
      (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
      OR EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.team_id = event_types.team_id
          AND team_members.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.team_id = event_types.team_id
          AND team_managers.user_id = auth.uid()
      )
    )
  );
