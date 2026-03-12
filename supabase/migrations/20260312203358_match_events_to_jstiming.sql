/*
  # Match existing events to jstiming event URLs

  Updates registration_url on events to point to the correct individual jstiming
  event pages (using event UUID URLs) rather than organizer pages or URLs with
  /registrations suffixes. Also sets registration_status based on current state.

  Changes:
  - Fix CW 1, TC 1, TC 2: strip /registrations suffix (already done above, but idempotent)
  - Fix EC multi-round events: point to the first round's event page
  - Match events by date/title to jstiming UUIDs
  - Set registration_status where known
*/

-- Fix /registrations suffix
UPDATE events
SET registration_url = regexp_replace(registration_url, '/registrations$', '')
WHERE registration_url LIKE '%/registrations';

-- EC Rounds 1 & 2 (2026-03-13) -> round 1 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0753bab-513f-4c95-981b-fc9af8af40f8',
  registration_status = 'open'
WHERE id = '1affc4b6-bebb-4496-b764-5ade9b3b608b';

-- EC Rounds 3 & 4 (2026-04-04) -> round 3 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0753d45-1a22-4e3d-ade3-89abe7cd2d2b',
  registration_status = 'open'
WHERE id = '77a2eb62-2520-4115-bdbe-919743adb83d';

-- EC Rounds 5 & 6 (2026-04-25) -> round 5 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a07541b8-0a1c-4cbc-8b08-36a4c2fa2800',
  registration_status = 'open'
WHERE id = 'c42839f6-c719-4bb0-a111-335bf059fbea';

-- EC Rounds 7 & 8 (2026-05-15) -> round 7 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0755b7d-8166-49c5-8be7-c43fa481f928',
  registration_status = 'upcoming'
WHERE id = 'e52bfaa9-f400-491f-a234-2b85e44da28f';

-- EC Rounds 9 & 10 (2026-09-05) -> round 9 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a07558c0-e26c-4f1d-a2a2-1e46f4ec5c15',
  registration_status = 'upcoming'
WHERE id = '6623218b-8c81-4898-a025-925da7a759ad';

-- EC Rounds 11 & 12 (2026-09-26) -> round 11 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a075597f-c2c8-4c56-8b82-7a73a37a0e41',
  registration_status = 'upcoming'
WHERE id = '5817bf74-3390-4004-b3e2-7c51420da83d';

-- European Championship (2026-06-24) -> UEC European Championships UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0755403-cbab-4c07-8f72-a1ea40c96c8c',
  registration_status = 'upcoming'
WHERE id = '27fd29f9-f20b-449c-b320-34299f2384e7';

-- CW 2 (2026-04-26) -> Coupe de Wallonie 2 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0e2ef2c-f6f6-4d80-82c4-e2a0c2c6a94f',
  registration_status = 'upcoming'
WHERE id = '66761c3a-4a49-4669-bd46-eb31902dd357';

-- CW 3 (2026-05-31) -> Coupe de Wallonie 3 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0e2f06a-68e9-4117-804b-28fb4e0b2f7d',
  registration_status = 'upcoming'
WHERE id = 'dd9ef806-9c1c-445d-96e1-e986677960a4';

-- CW 4 (2026-08-16) -> Coupe de Wallonie 4 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0e2f190-6b83-4d4e-acc1-e27b5f8019c5',
  registration_status = 'upcoming'
WHERE id = 'f75bd71e-c872-44f7-acd6-af57997e7181';

-- CW 5 (2026-08-30) -> Coupe de Wallonie 5 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0e2f214-e13b-4c0c-bf7f-71e5d5ede1d2',
  registration_status = 'upcoming'
WHERE id = 'fed763d1-1276-4c3f-a741-64ea1a3bb1d0';

-- CW 6 (2026-10-11) -> Coupe de Wallonie 6 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0e2f29e-c4ab-4e7d-b9a6-b5e92cf4d9bc',
  registration_status = 'upcoming'
WHERE id = '31f035af-d3c0-4a21-a812-fc4033fc38aa';

-- TC 3 (2026-05-10) -> Toyo Tires TC #3 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0d14773-7f51-44a3-bfd2-4ee9f55f97c1',
  registration_status = 'upcoming'
WHERE id = 'f22e2357-59ac-4171-9fa3-1b795093e763';

-- TC 4 (2026-09-20) -> Toyo Tires TC #4 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0d150c2-18a5-4ddd-a447-59a7ab1e3481',
  registration_status = 'upcoming'
WHERE id = '3162ebf6-9664-4c81-aef3-ad94ba21e00d';

-- TC 5 (2026-10-04) -> Toyo Tires TC #5 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0d1519f-7b57-4282-812a-97d97ff3e96d',
  registration_status = 'upcoming'
WHERE id = '21a02541-3caa-490b-9f7a-0fe069313879';

-- 3 Nations Cup Antoing (2026-05-02) -> 3-Nations Round 1 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0e53e0b-cc14-4b76-a7cd-1d84dab76ef8',
  registration_status = 'upcoming'
WHERE id = '0bcaf7f1-a6ec-4174-a6bc-13b37f3de8c6';

-- 3 Nations Cup Esselbach (2026-05-23) -> 3-Nations Round 3 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0e53f58-7ef2-4c6c-862f-e1f2dc3f38e0',
  registration_status = 'upcoming'
WHERE id = '4d1e138a-04e1-4f4d-93ae-a8a134ccd443';

-- 3 Nations Cup Kampen (2026-09-12) -> 3-Nations Round 5 UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0e54091-e6ef-49d8-9e56-8eb4fcf15e03',
  registration_status = 'upcoming'
WHERE id = '13b8de17-f950-4e19-b61b-a5a69b4f72f5';

-- Belgian Championship (2026-07-05) -> Belgische Kampioenschappen UUID
UPDATE events SET
  registration_url = 'https://registration.jstiming.com/events/a0d14e4b-5d45-4f39-ab0f-ee16c3e9f148',
  registration_status = 'upcoming'
WHERE id = '630391d8-a651-485d-8399-551dc4e4643e';
