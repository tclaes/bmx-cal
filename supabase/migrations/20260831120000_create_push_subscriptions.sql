/*
  # Create push_subscriptions table for web push notifications

  1. Purpose
     - Stores browser push subscription endpoints for each authenticated user
     - Used by the send-push-notifications edge function to deliver deadline reminders
     - Only European Cup and 3 Nations Cup events trigger notifications

  2. New Tables
     - `push_subscriptions`
       - `id` (uuid, primary key)
       - `user_id` (uuid, not null, references auth.users, cascade delete)
       - `endpoint` (text, not null) — browser push service URL
       - `p256dh` (text, not null) — public key from browser subscription
       - `auth` (text, not null) — auth secret from browser subscription
       - `created_at` (timestamptz, default now)
       - `updated_at` (timestamptz, default now)

  3. Security
     - RLS enabled
     - Users can only CRUD their own subscriptions (owner-scoped via auth.uid())
     - user_id defaults to auth.uid() so inserts omitting it still work

  4. Notes
     - One user can have multiple subscriptions (different devices/browsers)
     - Unique constraint on (user_id, endpoint) prevents duplicate subscriptions
*/

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_push_subscriptions" ON push_subscriptions;
CREATE POLICY "select_own_push_subscriptions" ON push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_push_subscriptions" ON push_subscriptions;
CREATE POLICY "insert_own_push_subscriptions" ON push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_push_subscriptions" ON push_subscriptions;
CREATE POLICY "update_own_push_subscriptions" ON push_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_push_subscriptions" ON push_subscriptions;
CREATE POLICY "delete_own_push_subscriptions" ON push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
