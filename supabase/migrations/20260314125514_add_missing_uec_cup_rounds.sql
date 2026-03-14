/*
  # Add missing UEC BMX European Cup rounds

  The database only had odd-numbered rounds (3, 5, 7, 9, 11) plus round 2.
  Each weekend consists of two rounds held on consecutive days at the same venue.
  The even-numbered rounds (4, 6, 8, 10, 12) were missing entirely.

  New events added:
  - Round 4: 05-04-2026, Tiel, Netherlands (same venue as round 3)
  - Round 6: 26-04-2026, Benátky nad Jizerou, Czechia (same venue as round 5)
  - Round 8: 16-05-2026, La Chapelle Saint-Mesmin, France (same venue as round 7)
  - Round 10: 06-09-2026, Sviland, Norway (same venue as round 9)
  - Round 12: 27-09-2026, Zolder, Belgium (same venue as round 11)

  Registration details sourced from JSTiming UEC organizer page.
*/

INSERT INTO events (
  id, title, date, end_date, location, location_id, event_type_id, status,
  registration_url, registration_opens, registration_deadline, registration_status,
  created_at, updated_at
) VALUES
  (
    gen_random_uuid(),
    'UEC BMX European Cup round 4',
    '2026-04-05',
    '2026-04-06',
    'Tiel (NED)',
    '7e71d9d9-b989-4a4b-934f-bfdf1a702f41',
    '3912284a-20cb-48fb-991f-d2d08d29811e',
    'upcoming',
    'https://registration.jstiming.com/events/a07556ee-617b-448c-a1ce-7a12ee424be2',
    '2026-02-18',
    '2026-03-18',
    'closed',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'UEC BMX European Cup round 6',
    '2026-04-26',
    NULL,
    'Benatky Nad Jizerou (CZE)',
    'cfb2f608-48e6-4fc7-b6c4-c917b6b49f7d',
    '3912284a-20cb-48fb-991f-d2d08d29811e',
    'upcoming',
    'https://registration.jstiming.com/events/a07559d4-4e1b-4c58-85b5-1d64c73ffc3c',
    '2026-03-11',
    '2026-04-08',
    'open',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'UEC BMX European Cup round 8',
    '2026-05-16',
    '2026-05-17',
    'La Chapelle St. Mesmin (FRA)',
    '4a853206-5d96-46b8-bfef-2867ef08ffc2',
    '3912284a-20cb-48fb-991f-d2d08d29811e',
    'upcoming',
    'https://registration.jstiming.com/events/a0755f02-6d65-4cde-972d-3920f06af3ef',
    '2026-03-31',
    '2026-04-28',
    'upcoming',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'UEC BMX European Cup round 10',
    '2026-09-06',
    NULL,
    'Sviland (NOR)',
    '259ab764-b871-48b8-8b93-9f8eb1e11556',
    '3912284a-20cb-48fb-991f-d2d08d29811e',
    'upcoming',
    'https://registration.jstiming.com/events/a076b4be-2bd5-464d-be98-45802536dbef',
    '2026-07-22',
    '2026-08-19',
    'upcoming',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'UEC BMX European Cup round 12',
    '2026-09-27',
    NULL,
    'Zolder',
    '24ee184d-147d-4ce4-a550-326cdb8ce53a',
    '3912284a-20cb-48fb-991f-d2d08d29811e',
    'upcoming',
    'https://registration.jstiming.com/events/a076b758-f4f6-4fc6-9b2f-ed5b843f014b',
    '2026-08-12',
    '2026-09-09',
    'upcoming',
    now(),
    now()
  );
