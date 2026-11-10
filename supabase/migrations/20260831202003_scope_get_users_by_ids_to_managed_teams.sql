/*
  # Scope get_users_by_ids to the caller's own teams

  1. Problem
     - The non-admin branch only checked that the caller manages *some* team,
       so any team manager could resolve arbitrary user ids to the email
       address stored in auth.users.

  2. Change
     - Admins keep full lookup. A team manager now only receives rows for users
       who are members or managers of a team that caller manages, plus their
       own row.
*/

CREATE OR REPLACE FUNCTION public.get_users_by_ids(user_ids uuid[])
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin boolean;
  is_manager boolean;
BEGIN
  is_admin := (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');
  is_manager := EXISTS (
    SELECT 1 FROM team_managers WHERE team_managers.user_id = auth.uid()
  );

  IF NOT is_admin AND NOT is_manager THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF is_admin THEN
    RETURN QUERY
    SELECT u.id, u.email::text
    FROM auth.users u
    WHERE u.id = ANY(user_ids)
    ORDER BY u.email;
  ELSE
    RETURN QUERY
    SELECT u.id, u.email::text
    FROM auth.users u
    WHERE u.id = ANY(user_ids)
      AND (
        u.id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM team_members tm
          JOIN team_managers mg ON mg.team_id = tm.team_id
          WHERE tm.user_id = u.id AND mg.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1
          FROM team_managers other
          JOIN team_managers mg ON mg.team_id = other.team_id
          WHERE other.user_id = u.id AND mg.user_id = auth.uid()
        )
      )
    ORDER BY u.email;
  END IF;
END;
$function$;
