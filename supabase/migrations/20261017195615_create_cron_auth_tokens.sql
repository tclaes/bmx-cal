/*
  # Shared cron auth token for scheduled edge function calls

  ## Problem
  The scheduled (pg_cron) calls to edge functions authenticate with a bearer
  token that must match the service role key inside the function runtime.
  That key was rotated on the platform, so the cron's token no longer matches
  and every scheduled call is rejected with 401.

  ## Solution
  1. New table `cron_auth_tokens` (name, token). RLS enabled with NO policies,
     so only the service role can read it. Holds a shared secret per scheduled
     job.
  2. The cron command reads the token from this table at fire time and sends
     it as the bearer.
  3. The edge functions accept the service role key OR this cron token.

  ## Security
  - Table has RLS enabled and zero policies: anon/authenticated can never
    read or write it; only the service role (edge functions, SQL admin) can.
*/

CREATE TABLE IF NOT EXISTS cron_auth_tokens (
  name text PRIMARY KEY,
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cron_auth_tokens ENABLE ROW LEVEL SECURITY;

INSERT INTO cron_auth_tokens (name, token)
VALUES
  ('send-push-notifications', gen_random_uuid()::text),
  ('sync-jstiming', gen_random_uuid()::text),
  ('search-uec-livestream', gen_random_uuid()::text)
ON CONFLICT (name) DO NOTHING;
