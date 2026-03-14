/*
  # Add created_by to events and fix RLS update/delete policies

  ## Summary
  This migration enforces proper role-based access control for event editing:

  1. Changes
     - Add `created_by` column to `events` (uuid, nullable, references auth.users)
     - Back-fill existing events with NULL (no known creator)

  2. RLS Policy Changes
     - DROP overly-permissive "Authenticated admins can update/delete events" policies
       (they allowed ANY authenticated user to update/delete ANY event)
     - ADD proper admin-only update/delete policies using app_metadata role check
     - KEEP team manager update/delete policies (already scoped to team_id)
     - Team managers can only update/delete events that belong to their team

  3. Security Notes
     - Plain authenticated users (no admin role, no team manager entry) can no longer
       update or delete any events
     - Admin users (app_metadata.role = 'admin') can update/delete all events
     - Team managers can update/delete events where team_id matches their managed team
*/

-- Add created_by column to events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'created_by' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.events ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop the overly permissive policies that allowed any authenticated user to modify events
DROP POLICY IF EXISTS "Authenticated admins can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Authenticated admins can insert events" ON public.events;

-- Admin-only insert policy
CREATE POLICY "Admins can insert events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  );

-- Admin-only update policy (admins can edit all events)
CREATE POLICY "Admins can update all events"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  )
  WITH CHECK (
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  );

-- Admin-only delete policy
CREATE POLICY "Admins can delete all events"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  );
