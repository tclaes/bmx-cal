/*
  # Fix unindexed foreign keys

  ## Changes
  Adds covering indexes for foreign key columns that were missing them:
  - bug_reports.user_id -> auth.users
  - events.created_by -> auth.users
  - events.event_type_id -> event_types
  - import_logs.imported_by -> auth.users
  - user_calendar_events.event_id -> events
  - user_event_selections.event_id -> events

  These indexes prevent sequential scans when joining or filtering on these columns.
*/

CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON public.bug_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events (created_by);
CREATE INDEX IF NOT EXISTS idx_events_event_type_id ON public.events (event_type_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_imported_by ON public.import_logs (imported_by);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_event_id ON public.user_calendar_events (event_id);
CREATE INDEX IF NOT EXISTS idx_user_event_selections_event_id ON public.user_event_selections (event_id);
