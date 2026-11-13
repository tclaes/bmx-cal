/*
# Create feature_flags table

## Purpose
Named on/off switches so an admin can turn unfinished features on and off
without a deploy. The first flag is `notifications` (deadline push
notifications on the personal calendar), off by default.

## New Tables
- `feature_flags`
  - `key` (text, PK) — flag name, e.g. 'notifications'
  - `enabled` (boolean, default false)
  - `updated_at` (timestamptz) — set by trigger
  - `updated_by` (uuid, references auth.users) — set by trigger

## Security
- RLS enabled.
- SELECT: everyone (anon + authenticated) can read the flags.
- INSERT/UPDATE/DELETE: admins only (app_metadata.role = 'admin').
- anon has no write privileges at all (see 20261112230645_revoke_anon_write_grants).
- updated_at / updated_by are set by a trigger so clients cannot spoof them.
*/

CREATE TABLE IF NOT EXISTS feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON feature_flags FROM anon;
GRANT SELECT ON feature_flags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON feature_flags TO authenticated;

DROP POLICY IF EXISTS "Anyone can read feature flags" ON feature_flags;
CREATE POLICY "Anyone can read feature flags"
ON feature_flags FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can insert feature flags" ON feature_flags;
CREATE POLICY "Admins can insert feature flags"
ON feature_flags FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can update feature flags" ON feature_flags;
CREATE POLICY "Admins can update feature flags"
ON feature_flags FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can delete feature flags" ON feature_flags;
CREATE POLICY "Admins can delete feature flags"
ON feature_flags FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION set_feature_flag_audit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feature_flags_audit ON feature_flags;
CREATE TRIGGER feature_flags_audit
BEFORE INSERT OR UPDATE ON feature_flags
FOR EACH ROW EXECUTE FUNCTION set_feature_flag_audit();

INSERT INTO feature_flags (key, enabled) VALUES ('notifications', false)
ON CONFLICT (key) DO NOTHING;
