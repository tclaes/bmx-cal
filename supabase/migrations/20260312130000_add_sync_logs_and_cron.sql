/*
  # Add Sync Logs Table and Weekly Cron Job

  1. New Tables
    - `sync_logs` — stores a log entry each time the sync-jstiming edge function runs,
      including a full JSON snapshot of what was scraped.

  2. Cron Job
    - Runs `sync-jstiming` edge function every Sunday at 06:00 UTC via pg_cron.

  3. Security
    - RLS enabled; only authenticated admins can read sync logs.
*/

-- Enable pg_cron extension (required for scheduling)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http extension (required to call edge functions from cron)
CREATE EXTENSION IF NOT EXISTS http;

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_url text NOT NULL,
  organizer_name text,
  scraped_at    timestamptz NOT NULL,
  events_found  integer DEFAULT 0,
  events_updated integer DEFAULT 0,
  events_unchanged integer DEFAULT 0,
  errors        jsonb DEFAULT '[]'::jsonb,
  snapshot      jsonb,
  created_at    timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read sync logs
CREATE POLICY "Authenticated admins can view sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

-- Index for querying by organizer and time
CREATE INDEX IF NOT EXISTS idx_sync_logs_organizer ON sync_logs(organizer_url);
CREATE INDEX IF NOT EXISTS idx_sync_logs_scraped_at ON sync_logs(scraped_at DESC);

-- Schedule the sync-jstiming edge function every Tuesday at 06:00 UTC
-- pg_cron syntax: minute hour day-of-month month day-of-week
SELECT cron.schedule(
  'sync-jstiming-weekly',            -- job name (unique)
  '0 6 * * 2',                       -- every Tuesday at 06:00 UTC
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
