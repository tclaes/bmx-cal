/*
  # Add Google Maps URL Column to Events

  1. Changes
    - Add `maps_url` column to `events` table to store exact Google Maps links for BMX tracks
    - This allows storing precise location URLs instead of relying on generic search
  
  2. Details
    - Column is nullable to support events without exact locations (TBC locations)
    - Text type to store full Google Maps URLs
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'maps_url'
  ) THEN
    ALTER TABLE events ADD COLUMN maps_url text;
  END IF;
END $$;