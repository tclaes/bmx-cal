/*
# Harden feature_flags grants

## Purpose
Supabase's default privileges also hand `authenticated` TRUNCATE, REFERENCES and
TRIGGER on new tables. TRUNCATE is not subject to row level security, so any
signed-in user could empty feature_flags. Only the privileges the app needs are
kept: SELECT for everyone, INSERT/UPDATE/DELETE for authenticated (RLS then limits
those to admins).
*/

REVOKE TRUNCATE, REFERENCES, TRIGGER ON feature_flags FROM authenticated;
REVOKE ALL ON feature_flags FROM anon;
GRANT SELECT ON feature_flags TO anon;
