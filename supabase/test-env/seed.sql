-- Test-environment seed data. Applied only to the local stack (never production).
-- Dates are relative to "today" so the calendar always shows upcoming events.

INSERT INTO teams (id, name) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'Test Team')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events (id, title, date, end_date, location, location_id, event_type_id, status,
                    registration_url, registration_opens, registration_deadline, registration_status)
VALUES
  ('00000000-0000-4000-8000-0000000000e1', 'Test Cup Zolder',
   current_date + 14, NULL, 'Zolder', '24ee184d-147d-4ce4-a550-326cdb8ce53a',
   '3912284a-20cb-48fb-991f-d2d08d29811e', 'upcoming',
   'https://example.test/register/e1', current_date - 7, current_date + 7, 'open'),
  ('00000000-0000-4000-8000-0000000000e2', 'Test World Cup Papendal',
   current_date + 30, current_date + 31, 'Papendal (NED)', '19cbf9bf-5015-4a1e-8a50-78dc65bd532b',
   '6f53eeeb-c316-45a3-ba52-47d449166555', 'upcoming',
   'https://example.test/register/e2', current_date + 5, current_date + 20, 'upcoming'),
  ('00000000-0000-4000-8000-0000000000e3', 'Test 3 Nations Cup Dessel',
   current_date + 45, NULL, 'Dessel', 'f9ff4928-c45c-46c6-8682-021c1e35e420',
   '3fa9ce76-a01e-4891-a3c7-b929919c4657', 'upcoming',
   NULL, NULL, NULL, NULL),
  ('00000000-0000-4000-8000-0000000000e4', 'Test Belgian Cycling Oostende',
   current_date + 3, NULL, 'Oostende', 'b8d33144-1990-494a-ae3a-6c5dcd123199',
   '7d7f6b8c-1fab-4693-b805-31db4e9ed20c', 'upcoming',
   'https://example.test/register/e4', current_date - 20, current_date - 1, 'closed'),
  ('00000000-0000-4000-8000-0000000000e5', 'Test Past Race Wilrijk',
   current_date - 10, NULL, 'Wilrijk', '818da401-2865-448f-a658-90ded1176ff4',
   'e021f64c-ecd2-49e6-baa2-8258e75b2273', 'completed',
   NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
