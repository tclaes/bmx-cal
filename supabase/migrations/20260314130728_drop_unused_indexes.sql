/*
  # Drop Unused Indexes

  ## Summary
  Remove indexes that have not been used and add overhead on writes without
  providing query performance benefits.

  ## Dropped Indexes
  - `idx_user_event_selections_user_id` on `public.user_event_selections`
  - `idx_user_event_selections_event_id` on `public.user_event_selections`
  - `idx_events_event_type_id` on `public.events`
  - `idx_import_logs_imported_by` on `public.import_logs`
*/

DROP INDEX IF EXISTS public.idx_user_event_selections_user_id;
DROP INDEX IF EXISTS public.idx_user_event_selections_event_id;
DROP INDEX IF EXISTS public.idx_events_event_type_id;
DROP INDEX IF EXISTS public.idx_import_logs_imported_by;
