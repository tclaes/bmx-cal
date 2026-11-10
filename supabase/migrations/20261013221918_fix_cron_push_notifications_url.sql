/*
  # Fix cron jobs: app.supabase_url and app.supabase_service_role_key were never set

  ## Problem
  All three cron jobs use `current_setting('app.supabase_url')` and
  `current_setting('app.supabase_service_role_key')` to build the HTTP POST
  URL and Authorization header. These custom GUC settings were never set,
  so `current_setting(...)` returns NULL — the cron fires but the request
  goes to a malformed URL with no auth, silently failing.

  ## Fix
  Reschedule all three cron jobs with the URL and service-role key inlined
  directly in the command, so they no longer depend on custom GUC settings.
*/

-- Unschedule broken push-notifications job
SELECT cron.unschedule('send-push-notifications-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-push-notifications-daily');

-- Reschedule with URL and key inlined
SELECT cron.schedule(
  'send-push-notifications-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://wateawaecktywtlfhomn.supabase.co/functions/v1/send-push-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body    := '{"daysBefore": [7, 1]}'::jsonb
  );
  $$
);
