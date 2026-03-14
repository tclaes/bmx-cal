/*
  # Add related_event_type_id to events

  ## Summary
  Team managers can now specify which competition category (e.g. World Cup, European Cup)
  a training event is preparing for. This is stored as a separate FK from the event's own type.

  ## Changes
  ### Modified Tables
  - `events`: Added `related_event_type_id` (nullable uuid FK to event_types)
    - Null means no specific competition association
    - Non-null links the training to a competition event type
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'related_event_type_id'
  ) THEN
    ALTER TABLE events ADD COLUMN related_event_type_id uuid REFERENCES event_types(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_related_event_type_id ON events(related_event_type_id);
