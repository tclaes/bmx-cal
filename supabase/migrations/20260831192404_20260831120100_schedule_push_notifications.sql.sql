CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('send-push-notifications-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-push-notifications-daily'
);

SELECT cron.schedule(
  'send-push-notifications-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/send-push-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body    := '{"daysBefore": [7, 1], "eventTypes": ["European Cup", "3 Nations Cup"]}'::jsonb
  );
  $$
);