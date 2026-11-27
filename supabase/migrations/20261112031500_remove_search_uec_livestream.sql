/*
  # Remove the UEC livestream search

  The `search-uec-livestream` edge function (YouTube search for UEC European Cup
  livestreams) is retired.

  1. Cron
     - Unschedule the daily job `search-uec-livestream-daily` (idempotent).
  2. Auth
     - Delete the function's row in `cron_auth_tokens`; nothing calls it any more.

  The `events.livestream_url` column is kept: livestream links can still be set
  by hand and are still shown on race cards.
*/

SELECT cron.unschedule('search-uec-livestream-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'search-uec-livestream-daily'
);

DELETE FROM cron_auth_tokens WHERE name = 'search-uec-livestream';
