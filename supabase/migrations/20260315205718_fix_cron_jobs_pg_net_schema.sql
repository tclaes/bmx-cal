/*
  # Fix Cron Jobs to Use Correct pg_net Schema

  ## Problem
  Previous migration moved pg_net extension to extensions schema, but cron jobs
  still reference `net.http_post()` which no longer exists. They need to use
  `extensions.http_post()` instead.

  ## Changes
  1. Unschedule existing broken cron jobs
  2. Reschedule with correct schema reference: `extensions.http_post()`
  3. Add helper functions to verify cron job status
*/

-- Unschedule existing jobs (they're broken anyway)
SELECT cron.unschedule('sync-jstiming-weekly')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-jstiming-weekly'
);

SELECT cron.unschedule('search-uec-livestream-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'search-uec-livestream-daily'
);

-- Reschedule sync-jstiming with correct schema
SELECT cron.schedule(
  'sync-jstiming-weekly',
  '0 6 * * 2',  -- Every Tuesday at 06:00 UTC
  $$
  SELECT extensions.http_post(
    url    := current_setting('app.supabase_url') || '/functions/v1/sync-jstiming',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body   := '{}'::jsonb
  );
  $$
);

-- Reschedule search-uec-livestream with correct schema
SELECT cron.schedule(
  'search-uec-livestream-daily',
  '0 8 * * *',  -- Every day at 08:00 UTC
  $$
  SELECT extensions.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/search-uec-livestream',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Helper function to check if pg_cron is enabled
CREATE OR REPLACE FUNCTION check_pg_cron_enabled()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  );
END;
$$;

-- Helper function to check pg_net schema location
CREATE OR REPLACE FUNCTION check_pg_net_schema()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schema_name text;
BEGIN
  SELECT n.nspname INTO schema_name
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE e.extname = 'pg_net';

  RETURN schema_name;
END;
$$;

-- Helper function to list active cron jobs
CREATE OR REPLACE FUNCTION list_cron_jobs()
RETURNS TABLE (
  jobname text,
  schedule text,
  active boolean,
  command text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.jobname::text,
    j.schedule::text,
    j.active,
    j.command::text
  FROM cron.job j
  ORDER BY j.jobname;
END;
$$;
