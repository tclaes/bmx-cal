/*
  # Fix push-notifications cron: inline service role key

  ## Problem
  The cron job used `current_setting('app.supabase_service_role_key')` to
  build the Authorization header, but that custom GUC was never set and
  `ALTER DATABASE ... SET` is not permitted for it. The cron was firing
  with an empty bearer token, so the edge function rejected every call.

  ## Fix
  Inline the service role key directly in the cron command. Also drop the
  `eventTypes` filter from the body since the edge function doesn't use it
  (it already filters by user_event_selections).
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
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdGVhd2FlY2t0eXd0bGZob21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI1NDAyNiwiZXhwIjoyMDg4ODMwMDI2fQ.NeLhXnz3w1hav5mysLNmHzYA2rVE_qI9_Ut7s-_PUZM'
    ),
    body    := '{"daysBefore": [7, 1]}'::jsonb
  );
  $$
);
