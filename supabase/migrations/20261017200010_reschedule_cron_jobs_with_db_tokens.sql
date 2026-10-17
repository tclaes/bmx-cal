/*
  # Reschedule all cron jobs to authenticate via cron_auth_tokens

  ## Problem
  The scheduled jobs embedded a bearer token in the command. That token was
  the service-role key at the time, but the platform's service-role key has
  since been rotated, so the edge functions reject every scheduled call
  with 401 Unauthorized and the jobs silently do nothing.

  ## Fix
  Each cron command now reads its shared token from the `cron_auth_tokens`
  table at fire time and sends it as the bearer. The edge functions accept
  that token for scheduled runs. Token rotation no longer breaks schedules:
  update the row in cron_auth_tokens and the next run works.

  Schedules are unchanged:
  - send-push-notifications-daily: 07:00 UTC daily
  - sync-jstiming-weekly: 06:00 UTC every Tuesday
  - search-uec-livestream-daily: 08:00 UTC daily
*/

SELECT cron.unschedule('send-push-notifications-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-push-notifications-daily');

SELECT cron.schedule(
  'send-push-notifications-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://wateawaecktywtlfhomn.supabase.co/functions/v1/send-push-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT token FROM cron_auth_tokens WHERE name = 'send-push-notifications')
    ),
    body    := '{"daysBefore": [7, 1]}'::jsonb
  );
  $$
);

SELECT cron.unschedule('sync-jstiming-weekly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-jstiming-weekly');

SELECT cron.schedule(
  'sync-jstiming-weekly',
  '0 6 * * 2',
  $$
  SELECT net.http_post(
    url     := 'https://wateawaecktywtlfhomn.supabase.co/functions/v1/sync-jstiming',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT token FROM cron_auth_tokens WHERE name = 'sync-jstiming')
    ),
    body    := '{}'::jsonb
  );
  $$
);

SELECT cron.unschedule('search-uec-livestream-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'search-uec-livestream-daily');

SELECT cron.schedule(
  'search-uec-livestream-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://wateawaecktywtlfhomn.supabase.co/functions/v1/search-uec-livestream',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT token FROM cron_auth_tokens WHERE name = 'search-uec-livestream')
    ),
    body    := '{}'::jsonb
  );
  $$
);
