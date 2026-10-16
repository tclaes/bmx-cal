/*
  Restrict venue (locations) modification to platform admins.

  The previous UPDATE and DELETE policies allowed any user holding a row in
  team_managers to modify or delete ANY location row, because the EXISTS
  subquery was not correlated to the row being written. SELECT (public) and
  INSERT (admins + team managers, used by the venue picker) are unchanged.
*/

DROP POLICY IF EXISTS "Admins and team managers can update locations" ON public.locations;
DROP POLICY IF EXISTS "Admins and team managers can delete locations" ON public.locations;

CREATE POLICY "Admins can update locations"
  ON public.locations
  FOR UPDATE
  TO authenticated
  USING ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'))
  WITH CHECK ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));

CREATE POLICY "Admins can delete locations"
  ON public.locations
  FOR DELETE
  TO authenticated
  USING ((((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'));
