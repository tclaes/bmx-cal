/*
  # Create admin-only user lookup functions

  ## Summary
  Adds two security-definer functions so the service role can look up user emails
  from auth.users without exposing the table directly.

  ## New Functions
  - `get_all_users()` — returns id + email for all auth users (admin only)
  - `get_users_by_ids(user_ids uuid[])` — returns id + email for a specific set of user IDs

  ## Security
  - Both functions use SECURITY DEFINER so they run with elevated privileges
  - Both check that the calling user is an admin via app_metadata before returning data
  - `search_path` is explicitly set to prevent search-path injection
*/

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (((auth.jwt() -> 'app_metadata') ->> 'role') != 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::text
  FROM auth.users u
  ORDER BY u.email;
END;
$$;

CREATE OR REPLACE FUNCTION get_users_by_ids(user_ids uuid[])
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (((auth.jwt() -> 'app_metadata') ->> 'role') != 'admin')
    AND NOT EXISTS (
      SELECT 1 FROM team_managers WHERE team_managers.user_id = auth.uid()
    )
  THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.id = ANY(user_ids)
  ORDER BY u.email;
END;
$$;
