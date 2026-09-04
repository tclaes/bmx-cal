/*
  # Restrict event_types writes

  1. Problem
     - INSERT/UPDATE/DELETE policies on `event_types` used the predicate
       `auth.uid() IS NOT NULL`, so any signed-in user could create, rename or
       delete shared event categories through the Data API.

  2. Change
     - Replace the three write policies with the same authority model already
       used by `events`: platform admins, or the manager of the team the row
       belongs to. Global rows (team_id IS NULL) are admin-only.

  3. Notes
     - SELECT policy is unchanged; the client never writes this table.
*/

DROP POLICY IF EXISTS "Authenticated users can insert event types" ON event_types;
DROP POLICY IF EXISTS "Authenticated users can update event types" ON event_types;
DROP POLICY IF EXISTS "Authenticated users can delete event types" ON event_types;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'event_types'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.event_types', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins and team managers can insert event types"
  ON event_types FOR INSERT TO authenticated
  WITH CHECK (
    (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.team_id = event_types.team_id
          AND team_managers.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins and team managers can update event types"
  ON event_types FOR UPDATE TO authenticated
  USING (
    (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.team_id = event_types.team_id
          AND team_managers.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.team_id = event_types.team_id
          AND team_managers.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins and team managers can delete event types"
  ON event_types FOR DELETE TO authenticated
  USING (
    (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.team_id = event_types.team_id
          AND team_managers.user_id = auth.uid()
      )
    )
  );
