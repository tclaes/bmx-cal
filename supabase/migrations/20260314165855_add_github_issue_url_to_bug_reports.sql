/*
  # Add github_issue_url to bug_reports

  ## Changes
  - Adds `github_issue_url` column to `bug_reports` table to store the URL of the
    automatically created GitHub issue after a report is submitted.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bug_reports' AND column_name = 'github_issue_url'
  ) THEN
    ALTER TABLE bug_reports ADD COLUMN github_issue_url text;
  END IF;
END $$;
