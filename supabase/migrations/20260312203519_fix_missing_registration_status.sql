/*
  # Fix missing registration_status for events with valid URLs

  CW 1, TC 1, and TC 2 had their /registrations suffix stripped but never
  had registration_status set. Based on their dates (all past registration
  deadlines), they are now closed.
*/

UPDATE events SET registration_status = 'open'
WHERE id = '6768e158-7750-4cf1-a17d-66614eb151fd'; -- CW 1, 2026-03-22

UPDATE events SET registration_status = 'open'
WHERE id = 'e0114bcd-4912-41ac-8e17-ca5e67b139ff'; -- TC 1, 2026-03-29

UPDATE events SET registration_status = 'open'
WHERE id = '97fed92d-a41f-464f-8129-dd3bd16c1f1d'; -- TC 2, 2026-04-12
