/*
  # Fix Security and Performance Issues

  ## Changes

  ### 1. Add missing index for unindexed foreign key
  - `events.related_event_type_id` foreign key lacked a covering index, causing slow lookups

  ### 2. Remove unused indexes
  - `idx_bug_reports_user_id` on `public.bug_reports` - never used by query planner
  - `idx_events_created_by` on `public.events` - never used by query planner
  - `idx_events_event_type_id` on `public.events` - never used by query planner
  - `idx_import_logs_imported_by` on `public.import_logs` - never used by query planner
  - `idx_user_calendar_events_event_id` on `public.user_calendar_events` - never used by query planner
  - `idx_user_event_selections_event_id` on `public.user_event_selections` - never used by query planner

  ### 3. Move pg_net extension to extensions schema
  - pg_net was installed in public schema, which is a security risk
  - Moved to the dedicated extensions schema
*/

-- Add index for the unindexed foreign key
CREATE INDEX IF NOT EXISTS idx_events_related_event_type_id
  ON public.events (related_event_type_id);

-- Remove unused indexes
DROP INDEX IF EXISTS public.idx_bug_reports_user_id;
DROP INDEX IF EXISTS public.idx_events_created_by;
DROP INDEX IF EXISTS public.idx_events_event_type_id;
DROP INDEX IF EXISTS public.idx_import_logs_imported_by;
DROP INDEX IF EXISTS public.idx_user_calendar_events_event_id;
DROP INDEX IF EXISTS public.idx_user_event_selections_event_id;

-- Move pg_net extension from public schema to extensions schema
-- First ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop and recreate pg_net in the extensions schema
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
