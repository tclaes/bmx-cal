/*
  # Schedule daily push notification deadline check

  1. Purpose
     - Runs the send-push-notifications edge function daily at 07:00 UTC
     - The function checks for European Cup and 3 Nations Cup events with
       registration deadlines falling 7 days or 1 day from today
     - Sends web push notifications to all subscribed users

  2. Cron Job
     - Name: `send-push-notifications-daily`
     - Schedule: every day at 07:00 UTC (`0 7 * * *`)
     - Calls the edge function via HTTP POST with the service-role key

  3. Notes
     - The function itself filters events and returns early if no events match,
       so a daily schedule is cheap
     - Any existing job with the same name is removed first to prevent duplicates
*/

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
