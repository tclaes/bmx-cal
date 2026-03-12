/*
  # Add Registration Opens Field to Events Table

  1. Changes
    - Add `registration_opens` column (date, nullable) to store when registration opens for each event

  2. Notes
    - Nullable to support existing events without this data
    - Pairs with registration_deadline to show the full registration window
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'registration_opens'
  ) THEN
    ALTER TABLE events ADD COLUMN registration_opens date;
  END IF;
END $$;
