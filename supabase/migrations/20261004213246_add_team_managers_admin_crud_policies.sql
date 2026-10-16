/*
# Add admin CRUD policies for team_managers

## Purpose
Admins need to be able to assign and remove team managers. Currently team_managers
only has a SELECT policy — there is no INSERT or DELETE policy, so no admin can
add or remove managers through the app.

## Changes
1. RLS policies on team_managers:
   - INSERT: only admins (app_metadata.role = 'admin')
   - DELETE: only admins (app_metadata.role = 'admin')
   SELECT is already covered by existing policy.

## Security
- Only admin-role users can insert or delete team_managers rows.
- Team managers themselves cannot add/remove other managers.
- Regular users have no access.
*/

DROP POLICY IF EXISTS "Admins can insert team managers" ON team_managers;
CREATE POLICY "Admins can insert team managers"
ON team_managers FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "Admins can delete team managers" ON team_managers;
CREATE POLICY "Admins can delete team managers"
ON team_managers FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
