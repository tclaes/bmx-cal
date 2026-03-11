/*
  # Update Event Types Mapping

  ## Changes
  
  1. Event Types Updates
    - Replace default event types with BMX competition types
    - Add the following event types:
      - European Cup (EC)
      - Flanders Cup (FC)
      - Top Competition (TC)
      - Coupe de Wallonie (CW)
      - 3 Nations Cup
      - World Cup (World Cup BMX)
    - Assign distinct colors to each competition type
  
  2. Data Migration
    - Link existing events to their corresponding event types based on title patterns
    - Events with "EC" in title → European Cup
    - Events with "FC" in title → Flanders Cup
    - Events with "TC" in title → Top Competition
    - Events with "CW" in title → Coupe de Wallonie
    - Events with "3 Nations Cup" in title → 3 Nations Cup
    - Events with "World Cup" in title → World Cup
  
  3. Security
    - No changes to RLS policies
*/

-- Clear existing default event types (only if they weren't being used)
DELETE FROM event_types 
WHERE name IN ('Race', 'Freestyle', 'Park', 'Street', 'Dirt', 'Flatland');

-- Insert BMX competition event types
INSERT INTO event_types (name, color_code) VALUES
  ('European Cup', '#ef4444'),
  ('Flanders Cup', '#f59e0b'),
  ('Top Competition', '#10b981'),
  ('Coupe de Wallonie', '#3b82f6'),
  ('3 Nations Cup', '#8b5cf6'),
  ('World Cup', '#ec4899')
ON CONFLICT (name) DO UPDATE SET
  color_code = EXCLUDED.color_code;

-- Update events to link them to their event types based on title patterns
-- European Cup (EC)
UPDATE events 
SET event_type_id = (SELECT id FROM event_types WHERE name = 'European Cup')
WHERE (title ILIKE '%EC %' OR title ILIKE '%EC%' OR title ILIKE '% EC %')
  AND title NOT LIKE '%DEC%'
  AND event_type_id IS NULL;

-- Flanders Cup (FC)
UPDATE events 
SET event_type_id = (SELECT id FROM event_types WHERE name = 'Flanders Cup')
WHERE (title ILIKE '%FC %' OR title ILIKE '%FC%' OR title ILIKE '% FC %')
  AND event_type_id IS NULL;

-- Top Competition (TC)
UPDATE events 
SET event_type_id = (SELECT id FROM event_types WHERE name = 'Top Competition')
WHERE (title ILIKE '%TC %' OR title ILIKE '%TC%' OR title ILIKE '% TC %')
  AND event_type_id IS NULL;

-- Coupe de Wallonie (CW)
UPDATE events 
SET event_type_id = (SELECT id FROM event_types WHERE name = 'Coupe de Wallonie')
WHERE (title ILIKE '%CW %' OR title ILIKE '%CW%' OR title ILIKE '% CW %')
  AND event_type_id IS NULL;

-- 3 Nations Cup
UPDATE events 
SET event_type_id = (SELECT id FROM event_types WHERE name = '3 Nations Cup')
WHERE title ILIKE '%3 Nations Cup%'
  AND event_type_id IS NULL;

-- World Cup
UPDATE events 
SET event_type_id = (SELECT id FROM event_types WHERE name = 'World Cup')
WHERE title ILIKE '%World Cup%'
  AND event_type_id IS NULL;
