/*
  # Fix jstiming event URLs with verified UUIDs

  Updates all events that had incorrect, organizer-level, or missing jstiming
  registration URLs. UUIDs were verified directly from the jstiming data-payload.

  Corrects:
  - EC multi-round events: pointed to organizer page, now point to first round
  - CW/TC/3-Nations events: missing or guessed URLs replaced with real UUIDs
  - Belgian Championship, European Championship URLs corrected
*/

-- EC Rounds 1 & 2 (2026-03-13) -> round 1
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0753bab-513f-4c95-981b-fc9af8af40f8',
  registration_status = 'open'
WHERE id = '1affc4b6-bebb-4496-b764-5ade9b3b608b';

-- EC Rounds 3 & 4 (2026-04-04) -> round 3
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0755528-7bee-4c60-a52a-6292b65f9465',
  registration_status = 'open'
WHERE id = '77a2eb62-2520-4115-bdbe-919743adb83d';

-- EC Rounds 5 & 6 (2026-04-25) -> round 5
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0755840-16b6-445b-abbd-f7030bcb0a3d',
  registration_status = 'open'
WHERE id = 'c42839f6-c719-4bb0-a111-335bf059fbea';

-- EC Rounds 7 & 8 (2026-05-15) -> round 7
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0755b7d-8166-49c5-8be7-c43fa481f928',
  registration_status = 'upcoming'
WHERE id = 'e52bfaa9-f400-491f-a234-2b85e44da28f';

-- EC Rounds 9 & 10 (2026-09-05) -> round 9
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a07596a9-fdba-420a-9d2a-5946fe6e9bec',
  registration_status = 'upcoming'
WHERE id = '6623218b-8c81-4898-a025-925da7a759ad';

-- EC Rounds 11 & 12 (2026-09-26) -> round 11
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a076b5aa-87b9-4d48-870e-d28c8729041b',
  registration_status = 'upcoming'
WHERE id = '5817bf74-3390-4004-b3e2-7c51420da83d';

-- European Championship (2026-06-24 in DB, 2026-06-25 on jstiming)
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0755ff4-4b6e-4d54-8566-caf947debd99',
  registration_status = 'upcoming'
WHERE id = '27fd29f9-f20b-449c-b320-34299f2384e7';

-- CW 2 (2026-04-26)
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0df7abd-f8ec-4141-87b0-d1285efd1f4b',
  registration_status = 'upcoming'
WHERE id = '66761c3a-4a49-4669-bd46-eb31902dd357';

-- CW 3 (2026-05-31)
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0df7ff3-39e5-4a12-9636-d0bcc8287e5a',
  registration_status = 'upcoming'
WHERE id = 'dd9ef806-9c1c-445d-96e1-e986677960a4';

-- CW 4 (2026-08-16)
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0df80ae-3cfe-497c-987d-0dd31b30e1c1',
  registration_status = 'upcoming'
WHERE id = 'f75bd71e-c872-44f7-acd6-af57997e7181';

-- CW 5 (2026-08-30)
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0df81f8-306d-4f37-998b-5b04ebddde3e',
  registration_status = 'upcoming'
WHERE id = 'fed763d1-1276-4c3f-a741-64ea1a3bb1d0';

-- CW 6 (2026-10-11)
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0df82a2-cc41-45a9-b00a-b700da68ca74',
  registration_status = 'upcoming'
WHERE id = '31f035af-d3c0-4a21-a812-fc4033fc38aa';

-- TC 3 (2026-05-10)
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0d1386b-dcc8-4f69-9100-554d9680579b',
  registration_status = 'upcoming'
WHERE id = 'f22e2357-59ac-4171-9fa3-1b795093e763';

-- TC 4 (2026-09-20)
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0d1425b-19ae-4138-9278-699cbff1310a',
  registration_status = 'upcoming'
WHERE id = '3162ebf6-9664-4c81-aef3-ad94ba21e00d';

-- TC 5 (2026-10-04)
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0d143ff-9787-444d-b28e-b8f29544c744',
  registration_status = 'upcoming'
WHERE id = '21a02541-3caa-490b-9f7a-0fe069313879';

-- 3 Nations Cup Antoing (2026-05-02) -> 3-Nations Round 1
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0737090-102f-4cf2-add2-b536e8fffb0c',
  registration_status = 'upcoming'
WHERE id = '0bcaf7f1-a6ec-4174-a6bc-13b37f3de8c6';

-- 3 Nations Cup Esselbach (2026-05-23) -> 3-Nations Round 3
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a073a158-6d71-4e92-bb3c-67c5c0ad146c',
  registration_status = 'upcoming'
WHERE id = '4d1e138a-04e1-4f4d-93ae-a8a134ccd443';

-- 3 Nations Cup Kampen (2026-09-12) -> 3-Nations Round 5
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a074e183-65de-4f54-8889-0999a5e6c533',
  registration_status = 'upcoming'
WHERE id = '13b8de17-f950-4e19-b61b-a5a69b4f72f5';

-- Belgian Championship (2026-07-05)
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0d13e86-dd45-406b-b5f4-37d22b180789',
  registration_status = 'upcoming'
WHERE id = '630391d8-a651-485d-8399-551dc4e4643e';
