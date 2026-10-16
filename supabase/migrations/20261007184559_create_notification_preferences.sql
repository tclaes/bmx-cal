/*
  # Notification preferences

  Let each signed-in user choose which national race types they want
  registration-deadline push notifications for. Fully opt-in: no rows
  means no notifications.

  1. New table: notification_preferences
     - user_id  — the user who owns the preference (defaults to auth.uid())
     - event_type_id — which race type they want reminders for
     - created_at — when the preference was saved
     - Primary key (user_id, event_type_id) prevents duplicates.
     - Foreign keys to auth.users (cascade on delete) and event_types.

  2. Security
     - RLS enabled.
     - 4 owner-scoped policies (SELECT/INSERT/DELETE) so a user can only
       read and manage their own rows. No UPDATE is granted — toggling
       is done by inserting or deleting rows.
*/

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type_id uuid NOT NULL REFERENCES public.event_types(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_type_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notification_preferences" ON public.notification_preferences;
CREATE POLICY "select_own_notification_preferences"
  ON public.notification_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notification_preferences" ON public.notification_preferences;
CREATE POLICY "insert_own_notification_preferences"
  ON public.notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notification_preferences" ON public.notification_preferences;
CREATE POLICY "delete_own_notification_preferences"
  ON public.notification_preferences
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
