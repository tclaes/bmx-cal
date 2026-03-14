/*
  # Fix Function Search Path

  ## Summary
  Set an explicit, immutable search_path on the
  `enforce_registration_status_on_deadline` function to prevent search path
  injection attacks. The function is recreated with `SET search_path = ''` and
  all object references use fully qualified schema names.
*/

CREATE OR REPLACE FUNCTION public.enforce_registration_status_on_deadline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.registration_deadline IS NOT NULL AND NEW.registration_deadline < CURRENT_DATE THEN
    NEW.registration_status := 'closed';
  END IF;
  RETURN NEW;
END;
$$;
