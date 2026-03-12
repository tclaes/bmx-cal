/*
  # Auto-close registration when deadline is in the past

  1. Immediately updates any event where registration_deadline < today to 'closed'
  2. Creates a function that automatically sets registration_status to 'closed'
     whenever registration_deadline is set and is in the past
  3. Creates a trigger that fires on INSERT or UPDATE to enforce this rule
*/

-- Immediately close any events whose deadline has already passed
UPDATE events
SET registration_status = 'closed'
WHERE registration_deadline IS NOT NULL
  AND registration_deadline < CURRENT_DATE
  AND registration_status != 'closed';

-- Function that enforces closed status when deadline is past
CREATE OR REPLACE FUNCTION enforce_registration_status_on_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.registration_deadline IS NOT NULL AND NEW.registration_deadline < CURRENT_DATE THEN
    NEW.registration_status := 'closed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on events table
DROP TRIGGER IF EXISTS trg_enforce_registration_status ON events;

CREATE TRIGGER trg_enforce_registration_status
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION enforce_registration_status_on_deadline();
