/*
  # Create bug_reports table

  ## Summary
  Creates a table for users to submit bug reports from the application.

  ## New Tables

  ### `bug_reports`
  - `id` (uuid, primary key) — unique identifier
  - `description` (text, not null) — description of the bug
  - `screenshot_url` (text, nullable) — optional URL to an uploaded screenshot
  - `reporter_email` (text, nullable) — email of the reporter (optional, for anonymous support)
  - `user_id` (uuid, nullable, references auth.users) — linked user if authenticated
  - `status` (text, default 'open') — status of the report: open, in_progress, resolved
  - `created_at` (timestamptz) — when the report was submitted

  ## Security
  - RLS enabled
  - Anyone (including anonymous) can INSERT a bug report
  - Only authenticated admins can SELECT all reports
  - Users can SELECT their own reports
*/

CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  screenshot_url text,
  reporter_email text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a bug report"
  ON bug_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own bug reports"
  ON bug_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bug reports"
  ON bug_reports
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update bug report status"
  ON bug_reports
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
