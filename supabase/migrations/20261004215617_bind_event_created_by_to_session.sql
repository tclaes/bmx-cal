/*
  Bind events.created_by to the session.

  The column was unconstrained, so a client could claim another account as the
  creator of an event. Default it to the caller and require any supplied value
  to be null or the caller's own id. Admin and team-manager scoping is
  unchanged; service-role writes (cron sync) bypass policies as before.
*/

ALTER TABLE public.events ALTER COLUMN created_by SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "Admins or team managers can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins or team managers can update events" ON public.events;

CREATE POLICY "Admins or team managers can insert events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (created_by IS NULL OR created_by = (SELECT auth.uid()))
    AND (
      ((((SELECT auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
      OR (
        team_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM team_managers
          WHERE team_managers.user_id = (SELECT auth.uid())
            AND team_managers.team_id = events.team_id
        )
      )
    )
  );

CREATE POLICY "Admins or team managers can update events"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    ((((SELECT auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.user_id = (SELECT auth.uid())
          AND team_managers.team_id = events.team_id
      )
    )
  )
  WITH CHECK (
    ((((SELECT auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.user_id = (SELECT auth.uid())
          AND team_managers.team_id = events.team_id
      )
    )
  );
