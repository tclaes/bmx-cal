/*
  # Fix Auth RLS Initialization Plan and drop unused index

  ## Changes

  1. Drop unused index
     - `idx_events_related_event_type_id` on `events` has never been used

  2. Fix Auth RLS Initialization Plan on all affected policies
     Replace bare `auth.uid()` / `auth.jwt()` calls with `(select auth.uid())`
     / `(select auth.jwt())` so Postgres evaluates them once per statement
     rather than once per row. Affected tables:
     - user_calendars (3 policies)
     - user_calendar_events (3 policies)
     - teams (3 policies)
     - team_managers (4 policies)
     - team_members (5 policies)
     - events (8 policies)
     - event_types (1 policy)
     - locations (1 policy)
     - bug_reports (3 policies)
*/

DROP INDEX IF EXISTS public.idx_events_related_event_type_id;

-- ── user_calendars ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own calendars" ON public.user_calendars;
CREATE POLICY "Users can view own calendars"
  ON public.user_calendars FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own calendars" ON public.user_calendars;
CREATE POLICY "Users can insert own calendars"
  ON public.user_calendars FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own calendars" ON public.user_calendars;
CREATE POLICY "Users can delete own calendars"
  ON public.user_calendars FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ── user_calendar_events ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own calendar events" ON public.user_calendar_events;
CREATE POLICY "Users can view own calendar events"
  ON public.user_calendar_events FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_calendars
    WHERE user_calendars.id = user_calendar_events.calendar_id
      AND user_calendars.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert own calendar events" ON public.user_calendar_events;
CREATE POLICY "Users can insert own calendar events"
  ON public.user_calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_calendars
    WHERE user_calendars.id = user_calendar_events.calendar_id
      AND user_calendars.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete own calendar events" ON public.user_calendar_events;
CREATE POLICY "Users can delete own calendar events"
  ON public.user_calendar_events FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_calendars
    WHERE user_calendars.id = user_calendar_events.calendar_id
      AND user_calendars.user_id = (select auth.uid())
  ));

-- ── teams ──────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can insert teams" ON public.teams;
CREATE POLICY "Admins can insert teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can update teams" ON public.teams;
CREATE POLICY "Admins can update teams"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can delete teams" ON public.teams;
CREATE POLICY "Admins can delete teams"
  ON public.teams FOR DELETE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- ── team_managers ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own team manager rows" ON public.team_managers;
CREATE POLICY "Users can view own team manager rows"
  ON public.team_managers FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all team manager rows" ON public.team_managers;
CREATE POLICY "Admins can view all team manager rows"
  ON public.team_managers FOR SELECT
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can insert team managers" ON public.team_managers;
CREATE POLICY "Admins can insert team managers"
  ON public.team_managers FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can delete team managers" ON public.team_managers;
CREATE POLICY "Admins can delete team managers"
  ON public.team_managers FOR DELETE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- ── team_members ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all team members" ON public.team_members;
CREATE POLICY "Admins can view all team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can insert team members" ON public.team_members;
CREATE POLICY "Admins can insert team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can delete team members" ON public.team_members;
CREATE POLICY "Admins can delete team members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Team managers can view members of their teams" ON public.team_members;
CREATE POLICY "Team managers can view members of their teams"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_managers
    WHERE team_managers.team_id = team_members.team_id
      AND team_managers.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Team managers can remove members from their teams" ON public.team_members;
CREATE POLICY "Team managers can remove members from their teams"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_managers
    WHERE team_managers.team_id = team_members.team_id
      AND team_managers.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Members can view own membership" ON public.team_members;
CREATE POLICY "Members can view own membership"
  ON public.team_members FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ── events ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can update all events" ON public.events;
CREATE POLICY "Admins can update all events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can delete all events" ON public.events;
CREATE POLICY "Admins can delete all events"
  ON public.events FOR DELETE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can view all team events" ON public.events;
CREATE POLICY "Admins can view all team events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Team managers can insert team events" ON public.events;
CREATE POLICY "Team managers can insert team events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.user_id = (select auth.uid())
        AND team_managers.team_id = events.team_id
    )
  );

DROP POLICY IF EXISTS "Team managers can update team events" ON public.events;
CREATE POLICY "Team managers can update team events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.user_id = (select auth.uid())
        AND team_managers.team_id = events.team_id
    )
  )
  WITH CHECK (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.user_id = (select auth.uid())
        AND team_managers.team_id = events.team_id
    )
  );

DROP POLICY IF EXISTS "Team managers can delete team events" ON public.events;
CREATE POLICY "Team managers can delete team events"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.user_id = (select auth.uid())
        AND team_managers.team_id = events.team_id
    )
  );

DROP POLICY IF EXISTS "Team members and managers can view team events" ON public.events;
CREATE POLICY "Team members and managers can view team events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.team_id = events.team_id
          AND team_members.user_id = (select auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.team_id = events.team_id
          AND team_managers.user_id = (select auth.uid())
      )
    )
  );

-- ── event_types ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Team members and managers can view team event types" ON public.event_types;
CREATE POLICY "Team members and managers can view team event types"
  ON public.event_types FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND (
      ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
      OR EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.team_id = event_types.team_id
          AND team_members.user_id = (select auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.team_id = event_types.team_id
          AND team_managers.user_id = (select auth.uid())
      )
    )
  );

-- ── locations ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Team managers can insert locations" ON public.locations;
CREATE POLICY "Team managers can insert locations"
  ON public.locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.user_id = (select auth.uid())
    )
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── bug_reports ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own bug reports" ON public.bug_reports;
CREATE POLICY "Users can view their own bug reports"
  ON public.bug_reports FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all bug reports" ON public.bug_reports;
CREATE POLICY "Admins can view all bug reports"
  ON public.bug_reports FOR SELECT
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can update bug report status" ON public.bug_reports;
CREATE POLICY "Admins can update bug report status"
  ON public.bug_reports FOR UPDATE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
