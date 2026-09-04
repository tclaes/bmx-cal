/*
  # Restrict import_logs access

  1. Problem
     - SELECT and INSERT policies used `auth.uid() IS NOT NULL`, exposing the
       admin import history (file names, counts, error text) to every signed-in
       user and letting anyone insert fabricated log rows.

  2. Change
     - Restrict both to platform admins or team managers, who are the only
       people who can run an import.
*/

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'import_logs'
      AND cmd IN ('SELECT', 'INSERT')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.import_logs', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins and team managers can view import logs"
  ON import_logs FOR SELECT TO authenticated
  USING (
    (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
    OR EXISTS (SELECT 1 FROM team_managers WHERE team_managers.user_id = auth.uid())
  );

CREATE POLICY "Admins and team managers can insert import logs"
  ON import_logs FOR INSERT TO authenticated
  WITH CHECK (
    (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
    OR EXISTS (SELECT 1 FROM team_managers WHERE team_managers.user_id = auth.uid())
  );
