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