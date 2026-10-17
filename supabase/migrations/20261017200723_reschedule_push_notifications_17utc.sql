/*
  # Move push notification check to 19:00 Belgian time

  ## Change
  Reschedules the send-push-notifications-daily job from 07:00 UTC
  (09:00 Belgian time) to 17:00 UTC (19:00 Belgian time, CEST = UTC+2).
  All other schedules are unchanged.
*/

SELECT cron.unschedule('send-push-notifications-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-push-notifications-daily');

SELECT cron.schedule(
  'send-push-notifications-daily',
  '0 17 * * *',
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
