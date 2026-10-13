/*
  # Fix remaining cron jobs: inline URL and service role key

  ## Problem
  The sync-jstiming and search-uec-livestream cron jobs also use
  `current_setting('app.supabase_url')` and
  `current_setting('app.supabase_service_role_key')` which are NULL.
  Same root cause as the push-notifications job.

  ## Fix
  Reschedule both with the URL and service role key inlined.
*/

SELECT cron.unschedule('sync-jstiming-weekly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-jstiming-weekly');

SELECT cron.schedule(
  'sync-jstiming-weekly',
  '0 6 * * 2',
  $$
  SELECT net.http_post(
    url    := 'https://wateawaecktywtlfhomn.supabase.co/functions/v1/sync-jstiming',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdGVhd2FlY2t0eXd0bGZob21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI1NDAyNiwiZXhwIjoyMDg4ODMwMDI2fQ.NeLhXnz3w1hav5mysLNmHzYA2rVE_qI9_Ut7s-_PUZM'
    ),
    body   := '{}'::jsonb
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
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdGVhd2FlY2t0eXd0bGZob21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI1NDAyNiwiZXhwIjoyMDg4ODMwMDI2fQ.NeLhXnz3w1hav5mysLNmHzYA2rVE_qI9_Ut7s-_PUZM'
    ),
    body    := '{}'::jsonb
  );
  $$
);
