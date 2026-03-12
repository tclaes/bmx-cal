/*
  # Enable pg_cron and schedule sync-jstiming on Tuesdays

  Enables the pg_cron and pg_net extensions, then schedules the
  sync-jstiming edge function to run every Tuesday at 06:00 UTC.
  Removes any existing job with the same name first to avoid duplicates.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

SELECT cron.unschedule('sync-jstiming-weekly')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'sync-jstiming-weekly'
);

SELECT cron.schedule(
  'sync-jstiming-weekly',
  '0 6 * * 2',
  $$
  SELECT net.http_post(
    url    := current_setting('app.supabase_url') || '/functions/v1/sync-jstiming',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body   := '{}'::jsonb
  );
  $$
);
