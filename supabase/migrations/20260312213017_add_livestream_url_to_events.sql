/*
  # Add livestream_url to events

  1. Changes
    - Adds `livestream_url` (text, nullable) column to the `events` table
      for storing YouTube or other video livestream links
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'livestream_url'
  ) THEN
    ALTER TABLE events ADD COLUMN livestream_url text;
  END IF;
END $$;
