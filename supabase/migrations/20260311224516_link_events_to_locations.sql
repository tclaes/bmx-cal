/*
  # Link Events to Locations Table

  1. Changes
    - Add `location_id` foreign key column to `events` table
    - Update existing events to link to their corresponding locations
    - Remove redundant `maps_url` column from `events` table
    - Keep `location` text column for display purposes and flexibility
  
  2. Benefits
    - Single source of truth for location data (address, maps URL)
    - Easier to update location details in one place
    - Maintains data consistency across events
  
  3. Migration Steps
    - Add location_id column with foreign key constraint
    - Update all events to link to matching locations
    - Drop maps_url column from events
*/

-- Add location_id foreign key to events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE events ADD COLUMN location_id uuid REFERENCES locations(id);
  END IF;
END $$;

-- Update events to link to their locations based on matching names
UPDATE events e
SET location_id = l.id
FROM locations l
WHERE LOWER(TRIM(e.location)) = LOWER(TRIM(l.name))
  AND e.location_id IS NULL;

-- Remove redundant maps_url column from events
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'maps_url'
  ) THEN
    ALTER TABLE events DROP COLUMN maps_url;
  END IF;
END $$;

-- Add index for faster location lookups
CREATE INDEX IF NOT EXISTS idx_events_location_id ON events(location_id);
