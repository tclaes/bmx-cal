/*
  # Fix multiple permissive policies and bug_reports INSERT

  ## Changes

  1. Merge multiple permissive SELECT policies into single combined policies
     - bug_reports SELECT: merge "Users can view their own bug reports" + "Admins can view all bug reports"
     - event_types SELECT (team): merge "Anyone can view public event types" + "Team members and managers can view team event types"
     - events SELECT: merge "Anyone can view public events" + "Admins can view all team events" + "Team members and managers can view team events"
     - events DELETE: merge "Admins can delete all events" + "Team managers can delete team events"
     - events INSERT: merge "Admins can insert events" + "Team managers can insert team events"
     - events UPDATE: merge "Admins can update all events" + "Team managers can update team events"
     - locations INSERT: merge "Authenticated admins can insert locations" + "Team managers can insert locations"
     - team_managers SELECT: merge "Admins can view all team manager rows" + "Users can view own team manager rows"
     - team_members SELECT: merge "Admins can view all team members" + "Members can view own membership" + "Team managers can view members of their teams"
     - team_members DELETE: merge "Admins can delete team members" + "Team managers can remove members from their teams"

  2. Fix bug_reports INSERT always-true policy
     - Remove the unrestricted "Anyone can submit a bug report" policy
     - Replace with two scoped policies: one for anonymous users (no user_id claim check),
       one for authenticated users ensuring they can only set their own user_id
*/

-- ── bug_reports SELECT (merge) ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Admins can view all bug reports" ON public.bug_reports;
CREATE POLICY "Users and admins can view bug reports"
  ON public.bug_reports FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── bug_reports INSERT (fix always-true) ─────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can submit a bug report" ON public.bug_reports;

CREATE POLICY "Authenticated users can submit bug reports with own user_id"
  ON public.bug_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR user_id = (select auth.uid())
  );

CREATE POLICY "Anonymous users can submit bug reports"
  ON public.bug_reports FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- ── event_types SELECT (merge) ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view public event types" ON public.event_types;
DROP POLICY IF EXISTS "Team members and managers can view team event types" ON public.event_types;
CREATE POLICY "Anyone can view public event types or own team types"
  ON public.event_types FOR SELECT
  USING (
    team_id IS NULL
    OR (
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
    )
  );

-- ── events SELECT (merge) ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view public events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all team events" ON public.events;
DROP POLICY IF EXISTS "Team members and managers can view team events" ON public.events;
CREATE POLICY "View public events or authorised team events"
  ON public.events FOR SELECT
  USING (
    team_id IS NULL
    OR (
      team_id IS NOT NULL
      AND (
        ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
        OR EXISTS (
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
    )
  );

-- ── events INSERT (merge) ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Team managers can insert team events" ON public.events;
CREATE POLICY "Admins or team managers can insert events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.user_id = (select auth.uid())
          AND team_managers.team_id = events.team_id
      )
    )
  );

-- ── events UPDATE (merge) ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can update all events" ON public.events;
DROP POLICY IF EXISTS "Team managers can update team events" ON public.events;
CREATE POLICY "Admins or team managers can update events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.user_id = (select auth.uid())
          AND team_managers.team_id = events.team_id
      )
    )
  )
  WITH CHECK (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.user_id = (select auth.uid())
          AND team_managers.team_id = events.team_id
      )
    )
  );

-- ── events DELETE (merge) ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can delete all events" ON public.events;
DROP POLICY IF EXISTS "Team managers can delete team events" ON public.events;
CREATE POLICY "Admins or team managers can delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM team_managers
        WHERE team_managers.user_id = (select auth.uid())
          AND team_managers.team_id = events.team_id
      )
    )
  );

-- ── locations INSERT (merge) ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated admins can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Team managers can insert locations" ON public.locations;
CREATE POLICY "Admins or team managers can insert locations"
  ON public.locations FOR INSERT
  TO authenticated
  WITH CHECK (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.user_id = (select auth.uid())
    )
  );

-- ── team_managers SELECT (merge) ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own team manager rows" ON public.team_managers;
DROP POLICY IF EXISTS "Admins can view all team manager rows" ON public.team_managers;
CREATE POLICY "Users can view own or admins can view all team manager rows"
  ON public.team_managers FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── team_members SELECT (merge) ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Members can view own membership" ON public.team_members;
DROP POLICY IF EXISTS "Team managers can view members of their teams" ON public.team_members;
CREATE POLICY "Authorised users can view team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.team_id = team_members.team_id
        AND team_managers.user_id = (select auth.uid())
    )
  );

-- ── team_members DELETE (merge) ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can delete team members" ON public.team_members;
DROP POLICY IF EXISTS "Team managers can remove members from their teams" ON public.team_members;
CREATE POLICY "Admins or team managers can remove team members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM team_managers
      WHERE team_managers.team_id = team_members.team_id
        AND team_managers.user_id = (select auth.uid())
    )
  );
