/*
  # Remove anonymous access to the user lookup functions

  1. Problem
     - `get_all_users()` and `get_users_by_ids(uuid[])` are SECURITY DEFINER and
       had EXECUTE granted to the `anon` role, exposing them through the Data API
       to callers who are not signed in.

  2. Change
     - Revoke EXECUTE from `anon` and from PUBLIC; keep it for `authenticated`,
       where the functions enforce their own admin / team-manager checks.
*/

REVOKE EXECUTE ON FUNCTION public.get_all_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_all_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_users_by_ids(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_users_by_ids(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_users_by_ids(uuid[]) TO authenticated;
