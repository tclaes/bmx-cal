/*
  # Add Registration Fields to Events Table

  1. Changes
    - Add `registration_url` column (text, nullable) to store JSTiming or other registration links
    - Add `registration_deadline` column (date, nullable) to track when registration closes
    - Add `registration_status` column (text, nullable) to track registration state (open, closed, upcoming)
  
  2. Notes
    - All columns are nullable to support existing events without registration info
    - registration_url will typically point to registration.jstiming.com for European Cup events
    - registration_deadline helps show countdown timers and status
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'registration_url'
  ) THEN
    ALTER TABLE events ADD COLUMN registration_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'registration_deadline'
  ) THEN
    ALTER TABLE events ADD COLUMN registration_deadline date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'registration_status'
  ) THEN
    ALTER TABLE events ADD COLUMN registration_status text;
  END IF;
END $$;