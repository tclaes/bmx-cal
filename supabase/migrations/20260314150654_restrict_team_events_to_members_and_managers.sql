/*
  # Restrict team events to team members and managers

  ## Summary
  The previous "Authenticated users can view team events" policy allowed ANY logged-in user
  to see team events. This migration replaces it with a stricter policy: only users who are
  a member OR a manager of the specific team can view that team's events.

  ## Changes
  - Drops "Authenticated users can view team events" SELECT policy on events
  - Adds "Team members and managers can view team events" SELECT policy that checks
    membership in team_members OR team_managers tables for the specific team_id

  ## Security
  - Public events (team_id IS NULL) remain visible to everyone
  - Team events are now only visible to users who belong to that team (as member or manager)
*/

DROP POLICY IF EXISTS "Authenticated users can view team events" ON events;

CREATE POLICY "Team members and managers can view team events"
  ON events FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.team_id = events.team_id
          AND team_members.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.team_id = events.team_id
          AND team_managers.user_id = auth.uid()
      )
    )
  );
