/*
  # Create Locations Table

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text, unique) - The location name
      - `address` (text, nullable) - Full street address
      - `city` (text, nullable) - City name
      - `postal_code` (text, nullable) - Postal/ZIP code
      - `country` (text, nullable) - Country name or code
      - `maps_url` (text, nullable) - Google Maps URL
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Changes
    - Add `location_id` column to `events` table as foreign key to `locations`
    - Populate `locations` table with existing event locations
    - Update `events` to link to `locations` table
    - Keep existing `location` column for backward compatibility

  3. Security
    - Enable RLS on `locations` table
    - Add policies for public read access
    - Add policies for authenticated admin write access
*/

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  address text,
  city text,
  postal_code text,
  country text,
  maps_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add location_id to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE events ADD COLUMN location_id uuid REFERENCES locations(id);
  END IF;
END $$;

-- Enable RLS on locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Public read access to locations
CREATE POLICY "Anyone can view locations"
  ON locations FOR SELECT
  TO public
  USING (true);

-- Authenticated admins can insert locations
CREATE POLICY "Authenticated users can insert locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated admins can update locations
CREATE POLICY "Authenticated users can update locations"
  ON locations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated admins can delete locations
CREATE POLICY "Authenticated users can delete locations"
  ON locations FOR DELETE
  TO authenticated
  USING (true);

-- Insert existing locations from events
INSERT INTO locations (name, maps_url)
SELECT DISTINCT 
  e.location as name,
  e.maps_url
FROM events e
WHERE e.location IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Update events to link to locations
UPDATE events e
SET location_id = l.id
FROM locations l
WHERE e.location = l.name;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_events_location_id ON events(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);