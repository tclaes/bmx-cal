/*
  # Add UEC BMX European Cup round 1

  Round 1 was held on 13 March 2026 in Verona, Italy — the same venue as Round 2.
  It is a past event (C1 class), held at the BMX Olympic Arena in Verona.
  No JSTiming registration URL is available as it was removed after the event concluded.

  Changes:
  - Add events row for Round 1 with status 'completed'
  - Linked to the existing Verona (ITA) location
*/

INSERT INTO events (
  id, title, date, end_date, location, location_id, event_type_id, status,
  registration_status, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'UEC BMX European Cup round 1',
  '2026-03-13',
  NULL,
  'Verona (ITA)',
  '90c9a1f1-e055-4430-b593-2bfbc88c5109',
  '3912284a-20cb-48fb-991f-d2d08d29811e',
  'completed',
  'closed',
  now(),
  now()
);
