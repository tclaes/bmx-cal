/*
  # Add team_id to event_types and create team event types

  ## Summary
  Each team gets its own event type, scoped to that team.
  Team managers will always use their team's event type when creating events.

  ## Changes

  ### Modified Tables
  - `event_types`: Added `team_id` (nullable uuid FK to teams)
    - NULL means it's a general/global event type (visible to everyone)
    - Non-null means it's a team-specific event type (only visible when managing that team)

  ## Data
  - Creates a "Dare2Race" event type linked to the Dare2Race team

  ## Security
  - Team-specific event types are readable by authenticated users (team managers will filter client-side)
  - Only admins can create/update/delete event types
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_types' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE event_types ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_types_team_id ON event_types(team_id);

-- Insert the Dare2Race event type linked to the Dare2Race team
INSERT INTO event_types (name, color_code, team_id)
SELECT 'Dare2Race', '#f97316', id
FROM teams
WHERE name = 'Dare2Race'
ON CONFLICT (name) DO UPDATE SET
  team_id = EXCLUDED.team_id,
  color_code = EXCLUDED.color_code;
