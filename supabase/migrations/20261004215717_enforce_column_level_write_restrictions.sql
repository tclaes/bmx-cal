/*
  Column-level restrictions (table-level grants override column revokes, so the
  table grant must be replaced by an explicit column list).

  1. events: browser roles may update every column except created_by.
  2. bug_reports: browser roles may insert only the fields a reporter supplies;
     status and github_issue_url stay under admin/server control.
*/

DO $$
DECLARE
  cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name <> 'created_by';

  EXECUTE 'REVOKE UPDATE ON public.events FROM anon, authenticated';
  EXECUTE format('GRANT UPDATE (%s) ON public.events TO anon, authenticated', cols);
END $$;

REVOKE INSERT ON public.bug_reports FROM anon, authenticated;
GRANT INSERT (description, screenshot_url, reporter_email, user_id)
  ON public.bug_reports TO anon, authenticated;
