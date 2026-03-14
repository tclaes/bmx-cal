/*
  # Fix RLS Auth Initialization Plan

  ## Summary
  Replace bare `auth.uid()` calls with `(select auth.uid())` in RLS policies
  to avoid per-row re-evaluation. This improves query performance at scale by
  evaluating the auth function once per query instead of once per row.

  ## Affected Tables
  - `public.locations`: insert, update, delete policies
  - `public.user_event_selections`: select, insert, delete policies

  ## Changes
  All affected policies are dropped and recreated with the optimized pattern.
*/

-- locations: drop and recreate affected policies
DROP POLICY IF EXISTS "Authenticated admins can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated admins can update locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated admins can delete locations" ON public.locations;

CREATE POLICY "Authenticated admins can insert locations"
  ON public.locations
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated admins can update locations"
  ON public.locations
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated admins can delete locations"
  ON public.locations
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- user_event_selections: drop and recreate affected policies
DROP POLICY IF EXISTS "Users can view own selections" ON public.user_event_selections;
DROP POLICY IF EXISTS "Users can insert own selections" ON public.user_event_selections;
DROP POLICY IF EXISTS "Users can delete own selections" ON public.user_event_selections;

CREATE POLICY "Users can view own selections"
  ON public.user_event_selections
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own selections"
  ON public.user_event_selections
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own selections"
  ON public.user_event_selections
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
