/*
  # Restrict locations UPDATE and DELETE

  1. Problem
     - UPDATE and DELETE policies on `locations` used `auth.uid() IS NOT NULL`,
       so any signed-in user could rewrite or remove any venue.

  2. Change
     - Align them with the table's existing INSERT policy: platform admins or
       any team manager.
*/

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'locations'
      AND cmd IN ('UPDATE', 'DELETE')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.locations', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins and team managers can update locations"
  ON locations FOR UPDATE TO authenticated
  USING (
    (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
    OR EXISTS (SELECT 1 FROM team_managers WHERE team_managers.user_id = auth.uid())
  )
  WITH CHECK (
    (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
    OR EXISTS (SELECT 1 FROM team_managers WHERE team_managers.user_id = auth.uid())
  );

CREATE POLICY "Admins and team managers can delete locations"
  ON locations FOR DELETE TO authenticated
  USING (
    (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
    OR EXISTS (SELECT 1 FROM team_managers WHERE team_managers.user_id = auth.uid())
  );
