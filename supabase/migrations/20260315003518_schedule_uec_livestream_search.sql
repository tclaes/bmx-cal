/*
  # Schedule UEC Livestream Search

  Schedules the `search-uec-livestream` edge function to run daily at 08:00 UTC.
  The function itself checks whether any UEC events fall on today's date before
  doing any work, so running it every day is cheap — it exits immediately on
  non-event days.

  1. Extensions
     - pg_cron and pg_net are already enabled; using IF NOT EXISTS for safety.

  2. Cron Job
     - Name: `search-uec-livestream-daily`
     - Schedule: every day at 08:00 UTC (`0 8 * * *`)
     - Calls the `search-uec-livestream` edge function via HTTP POST using the
       service-role key so it can write back the discovered `livestream_url`.

  3. Notes
     - Any existing job with the same name is removed first to prevent duplicates.
     - The function returns early with `{ updated: 0 }` on days with no UEC events,
       so there is no performance concern with a daily schedule.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('search-uec-livestream-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'search-uec-livestream-daily'
);

SELECT cron.schedule(
  'search-uec-livestream-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/search-uec-livestream',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);
