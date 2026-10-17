-- Harden EXECUTE grants on user-lookup functions (SECURITY DEFINER by design;
-- both functions verify admin/team-manager authorization internally).
REVOKE ALL ON FUNCTION public.get_all_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;

REVOKE ALL ON FUNCTION public.get_users_by_ids(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_users_by_ids(uuid[]) TO authenticated;

-- cron_auth_tokens stores secrets used by cron jobs; no client should read or
-- write it. RLS has no policies (deny all) - also strip table privileges so
-- the Data API never touches it.
REVOKE ALL ON public.cron_auth_tokens FROM anon, authenticated;
REVOKE ALL ON public.cron_auth_tokens FROM PUBLIC;
