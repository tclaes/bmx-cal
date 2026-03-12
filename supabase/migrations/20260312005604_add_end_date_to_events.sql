/*
  # Add end_date to events table

  1. Changes
    - Add `end_date` column to `events` table to support multi-day events
    - Set end_date to be nullable (single-day events won't have an end_date)
    - Add check constraint to ensure end_date is always after or equal to date
  
  2. Notes
    - This allows European Cup rounds, World Championships, and other multi-day events to display correct date ranges
    - Single-day events will have NULL end_date and display as before
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE events ADD COLUMN end_date date;
    
    ALTER TABLE events ADD CONSTRAINT end_date_after_start 
      CHECK (end_date IS NULL OR end_date >= date);
  END IF;
END $$;