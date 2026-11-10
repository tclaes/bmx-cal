INSERT INTO event_types (name, color_code, team_id)
VALUES ('Training', '#06b6d4', NULL)
ON CONFLICT DO NOTHING;