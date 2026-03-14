/*
  # Fix UEC Round 1 title and registration URL

  The first EC event (2026-03-13) was pointing to the round 1 JSTiming UUID which is
  no longer listed on the UEC organizer page. The organizer page now shows round 2
  (a07544c3) for the same event weekend. Update the title to match JSTiming naming
  convention and fix the registration URL.

  Changes:
  - events: update title "EC Rounds 1 & 2" -> "UEC BMX European Cup round 2"
  - events: update registration_url to the currently listed round 2 UUID
*/

UPDATE events
SET
  title = 'UEC BMX European Cup round 2',
  registration_url = 'https://registration.jstiming.com/events/a07544c3-b745-4c27-9fce-c929467c021f',
  updated_at = now()
WHERE id = '1affc4b6-bebb-4496-b764-5ade9b3b608b';
