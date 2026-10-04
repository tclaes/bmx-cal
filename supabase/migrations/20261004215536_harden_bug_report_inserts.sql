/*
  Harden anonymous bug report submissions.

  1. Bound the free-text fields so an unauthenticated caller cannot post
     arbitrarily large rows through the Data API.
  2. Take the internal triage fields (status, github_issue_url) out of reach
     of client INSERTs; they are maintained by admins / the GitHub function.
     UPDATE on these columns is unaffected (admin-only UPDATE policy).
*/

ALTER TABLE public.bug_reports
  ADD CONSTRAINT bug_reports_description_length
  CHECK (char_length(description) <= 5000);

ALTER TABLE public.bug_reports
  ADD CONSTRAINT bug_reports_reporter_email_length
  CHECK (reporter_email IS NULL OR char_length(reporter_email) <= 254);

ALTER TABLE public.bug_reports
  ADD CONSTRAINT bug_reports_screenshot_url_length
  CHECK (screenshot_url IS NULL OR char_length(screenshot_url) <= 2048);

REVOKE INSERT (status, github_issue_url) ON public.bug_reports FROM anon;
REVOKE INSERT (status, github_issue_url) ON public.bug_reports FROM authenticated;
