/*
  # App release policy

  Single-row table with an optional minimum app version that admins can raise
  after a deploy, without rebuilding the frontend. The client combines it with
  the minimum published in /version.json (the highest wins).

  - Anyone (anon + authenticated) can read the policy.
  - Only admins (app_metadata.role = 'admin') can change it.
  - There is exactly one row (id = 1); it cannot be inserted or deleted via the API.
*/

CREATE TABLE IF NOT EXISTS public.app_release_policy (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  -- At most 9 digits per part, so the client compares every part exactly.
  min_version text CHECK (min_version IS NULL OR min_version ~ '^\d{1,9}\.\d{1,9}\.\d{1,9}$'),
  message jsonb CHECK (message IS NULL OR jsonb_typeof(message) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_release_policy (id, min_version, message)
VALUES (1, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_release_policy ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.app_release_policy FROM anon, authenticated;
GRANT SELECT ON public.app_release_policy TO anon, authenticated;
GRANT UPDATE (min_version, message) ON public.app_release_policy TO authenticated;

DROP POLICY IF EXISTS "read_app_release_policy" ON public.app_release_policy;
CREATE POLICY "read_app_release_policy"
  ON public.app_release_policy
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_update_app_release_policy" ON public.app_release_policy;
CREATE POLICY "admin_update_app_release_policy"
  ON public.app_release_policy
  FOR UPDATE TO authenticated
  USING (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin')
  WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION public.touch_app_release_policy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_app_release_policy ON public.app_release_policy;
CREATE TRIGGER touch_app_release_policy
  BEFORE UPDATE ON public.app_release_policy
  FOR EACH ROW EXECUTE FUNCTION public.touch_app_release_policy();
