-- Reference data snapshot (event_types + locations) taken read-only from the
-- production project on 2026-11-12. Contains no personal data.
--
-- Some repository migrations insert events that reference these rows by fixed
-- UUID; those rows were created by hand in production, so a fresh database
-- needs them first. scripts/test-env injects this file as a migration just
-- before the first migration that needs it (same-name rows created by earlier
-- migrations are re-keyed to the production id). It is NOT part of supabase/migrations
-- and never runs against production.

CREATE TEMP TABLE ref_event_types AS
SELECT id::uuid, name, color_code, created_at::timestamptz FROM (VALUES
  ('3fa9ce76-a01e-4891-a3c7-b929919c4657', '3 Nations Cup', '#8b5cf6', '2026-03-11 18:51:23.04142+00'),
  ('7d7f6b8c-1fab-4693-b805-31db4e9ed20c', 'Belgian Cycling', '#10b981', '2026-03-11 20:30:50.088+00'),
  ('e021f64c-ecd2-49e6-baa2-8258e75b2273', 'Cycling Vlaanderen', '#f59e0b', '2026-03-11 18:51:23.04142+00'),
  ('12fdbb77-3345-4a0a-9e96-9c6422482858', 'Dare2Race', '#ce4589', '2026-03-14 14:37:35.137165+00'),
  ('3912284a-20cb-48fb-991f-d2d08d29811e', 'European Cup', '#ef4444', '2026-03-11 18:51:23.04142+00'),
  ('2a1785c5-8a87-491e-9277-6d456a3aefd4', 'Training', '#06b6d4', '2026-10-04 20:40:43.504253+00'),
  ('90718b4a-32be-4f0a-8bec-0ef4f3381863', 'Wallonie Cycling', '#3b82f6', '2026-03-11 18:51:23.04142+00'),
  ('6f53eeeb-c316-45a3-ba52-47d449166555', 'World Cup', '#ec4899', '2026-03-11 18:51:23.04142+00')
) AS v(id, name, color_code, created_at);

CREATE TEMP TABLE ref_locations AS
SELECT id::uuid, name, address, city, postal_code, country, maps_url, created_at::timestamptz, updated_at::timestamptz FROM (VALUES
  ('91dd5bbc-3ff6-45ca-87d4-50f0cce553ee', 'Aarschot', 'Rumoldus Wetzstraat 8', 'Aarschot', '3200', 'Belgium', 'https://maps.app.goo.gl/r3GVNF5dwFQSgvwNA', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:42:17.808827+00'),
  ('91658532-6f70-494d-a12e-c348b681e7b3', 'Antoing', 'Avenue du Lac', 'Antoing (Péronnes)', '7640', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Avenue+du+Lac+7640+Antoing+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:42:17.808827+00'),
  ('d8e17bcf-2f38-48ba-b3c7-e982fff09237', 'B mine Beringen', NULL, NULL, NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=B%20mine%20Beringen', '2026-10-04 21:15:12.425866+00', '2026-10-04 21:15:11.955+00'),
  ('f22246b4-429e-431b-a69c-00fdb7596b0c', 'Baraque de Fraiture', 'Baraque de Fraiture 6', 'Vielsalm', '6690', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Baraque+de+Fraiture+6+6690+Vielsalm+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:42:17.808827+00'),
  ('cfb2f608-48e6-4fc7-b6c4-c917b6b49f7d', 'Benatky Nad Jizerou (CZE)', '294 71 Benátky nad Jizerou 1', 'Benátky nad Jizerou', '294 71', 'Czechia', 'https://maps.app.goo.gl/SVi4itBzLnTetjFu7', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('8f5993f0-3fe1-49e1-b1b7-a39cff9dd0d8', 'Berlicum', 'Groenstraat 14e, 5258 TH Berlicum, Netherlands', NULL, NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=Berlicum%2C%20Groenstraat%2014e%2C%205258%20TH%20Berlicum%2C%20Netherlands', '2026-10-04 21:15:14.356866+00', '2026-10-04 21:15:14.24+00'),
  ('0150351b-0db8-4df5-91bb-9edb2961fd0f', 'Blegny', 'Rue des Frères Hackin', 'Blegny', '4670', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Rue+des+Frères+Hackin+4670+Blegny+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:42:17.808827+00'),
  ('68c2af74-2233-4f6f-8adc-3d9f63563734', 'Brisbane, Queensland (AUS)', '2 Anna Meares Circuit', 'Chandler', 'QLD 4155', 'Australia', 'https://maps.app.goo.gl/1T5bwzB55p4LKHzZ9', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('f9070f83-a3ba-48c8-bc1d-6d6f17b2ad40', 'China', NULL, NULL, NULL, NULL, NULL, '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('f9ff4928-c45c-46c6-8682-021c1e35e420', 'Dessel', 'Sportpark 6', 'Dessel', '2480', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Sportpark+6+2480+Dessel+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:43:02.94854+00'),
  ('6e586b05-5b77-4c5e-a085-0bc94badcef8', 'Esselbach (GER)', 'Am Trieb', 'Esselbach', '97839', 'Germany', 'https://maps.app.goo.gl/rCXSAJF4VdYkERae6', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('936783ea-a4af-433f-9f57-f73314e61a39', 'Habay - La - Neuve', 'Rue des Carrosses 13', 'Habay-La-Neuve', '6720', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Rue+des+Carrosses+13+6720+Habay+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:42:17.808827+00'),
  ('42f49040-812a-4e9a-a97f-c0b45c3cb867', 'Hooglede', 'Bollestraat', 'Hooglede', '8830', 'Belgium', 'https://maps.app.goo.gl/nCER7z7Pju6ws2jL6', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:43:02.94854+00'),
  ('03b38889-a025-46f3-8ef1-88dbf2b6238f', 'Kampen (NED)', 'Schansdijk 3', 'Kampen', '8263 AZ', 'Netherlands', 'https://www.google.com/maps/dir/?api=1&destination=Schansdijk+3+8263+AZ+Kampen+Netherlands', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('13d2a7e4-720d-4480-899a-a44b5a950e41', 'Keerbergen', 'Putsebaan 103', 'Keerbergen', '3140', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Putsebaan+103+3140+Keerbergen+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:43:02.94854+00'),
  ('4a853206-5d96-46b8-bfef-2867ef08ffc2', 'La Chapelle St. Mesmin (FRA)', '5 Rue des Pierrelayes', 'La Chapelle-Saint-Mesmin', '45380', 'France', 'https://www.google.com/maps/dir/?api=1&destination=5+Rue+des+Pierrelayes,+45380+La+Chapelle-Saint-Mesmin,+France', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('b3c77edc-c025-4997-8803-50456bde55d7', 'La Louvière', 'Rue Victorien Ergot 33', 'La Louvière (Strépy-Bracquegnies)', '7100', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Rue+Victorien+Ergot+33+7100+La+Louvière+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:42:17.808827+00'),
  ('cb2695eb-2444-45e6-bbc2-33f1e60e7654', 'Massenhoven', 'Populierenhoeve 22', 'Zandhoven (Massenhoven)', '2240', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Populierenhoeve+22+2240+Zandhoven+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:42:17.808827+00'),
  ('79d21c61-52e1-4546-bb79-78a0ab9f35a0', 'Nuland', 'Coppensdijk 8a, 5382 JT Vinkel, Netherlands', 'Nuland', NULL, 'Nederland', 'https://www.google.com/maps/search/?api=1&query=Nuland%2C%20Coppensdijk%208a%2C%205382%20JT%20Vinkel%2C%20Netherlands%2C%20Nuland%2C%20Nederland', '2026-10-04 21:15:12.775083+00', '2026-10-04 21:15:12.521+00'),
  ('b8d33144-1990-494a-ae3a-6c5dcd123199', 'Oostende', 'Sportparklaan', 'Oostende', '8400', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Sportparklaan+8400+Oostende+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:42:17.808827+00'),
  ('242b0a45-6afe-491a-9a1f-a3c47674974c', 'Oss', 'Gielekespad 8, 5343 XN Oss, Netherlands', NULL, NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=BMX%20parcour%20near%20Oss%2C%20Gielekespad%208%2C%205343%20XN%20Oss%2C%20Netherlands', '2026-10-04 21:23:59.626431+00', '2026-10-04 21:23:59.519+00'),
  ('19cbf9bf-5015-4a1e-8a50-78dc65bd532b', 'Papendal (NED)', 'Papendallaan 31', 'Arnhem', '6816 VD', 'Netherlands', 'https://www.google.com/maps/dir/?api=1&destination=Papendallaan+31,+6816+VD+Arnhem,+Netherlands', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('f1041a11-7f14-4289-8070-0ec125b564d8', 'Peer', 'Deusterstraat 74E', 'Peer', '3990', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Deusterstraat+74E+3990+Peer+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:42:17.808827+00'),
  ('7df5f025-3ea1-446d-9e2d-7a439ec46036', 'Quaregnon', 'Rue Louis Blanqui', 'Quaregnon', '7390', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Rue+Louis+Blanqui+7390+Quaregnon+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:42:17.808827+00'),
  ('1c9f75e5-bb26-456c-81e5-c9ade8057999', 'Ranst', 'Sportpark 6', 'Ranst', '2520', 'Belgium', 'https://maps.app.goo.gl/CLnkJXd6r6q7xJEg6', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:43:02.94854+00'),
  ('fd6d2789-abb0-4752-8e5c-56c2b002d1c2', 'Sarasota (USA)', '1590 N Tuttle Ave', 'Sarasota', 'FL 34237', 'United States', 'https://www.google.com/maps/dir/?api=1&destination=1590+N+Tuttle+Ave,+Sarasota,+FL+34237,+United+States', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('d17653f4-c58f-4f94-9a5d-9380bed47433', 'Sarrians (FRA)', '22 Av. de la Camargue', 'Sarrians', '84260', 'France', 'https://www.google.com/maps/dir/?api=1&destination=22+Av.+de+la+Camargue,+84260+Sarrians,+France', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('df31a0f4-8639-4701-9bfe-5bf743644e81', 'Schijndel', 'Leemputtenweg 6, 5482 WZ Schijndel, Netherlands', 'Schijndel', NULL, 'Nederland', 'https://www.google.com/maps/search/?api=1&query=Schijndel%2C%20Leemputtenweg%206%2C%205482%20WZ%20Schijndel%2C%20Netherlands%2C%20Schijndel%2C%20Nederland', '2026-10-04 21:15:13.928922+00', '2026-10-04 21:15:13.809+00'),
  ('0e78ab3a-0094-4598-9a62-bab4fceba677', 'Soumagne', 'Rue des Acacias 27', 'Soumagne', '4630', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Rue+des+Acacias+27+4630+Soumagne+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:43:02.94854+00'),
  ('259ab764-b871-48b8-8b93-9f8eb1e11556', 'Sviland (NOR)', 'Espelandveien 360', 'Sandnes', '4337', 'Norway', 'https://www.google.com/maps/dir/?api=1&destination=Espelandveien+360+4337+Sandnes+Norway', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('eedd6bda-2ee6-412b-ab41-82111a8d72f1', 'TBD', NULL, NULL, NULL, NULL, NULL, '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('7e71d9d9-b989-4a4b-934f-bfdf1a702f41', 'Tiel (NED)', 'Schaarsdijkweg 9', 'Tiel', '4006 MC', 'Netherlands', 'https://www.google.com/maps/dir/?api=1&destination=Schaarsdijkweg+9,+4006+MC+Tiel,+Netherlands', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('90c9a1f1-e055-4430-b593-2bfbc88c5109', 'Verona (ITA)', 'Via Sogare, 1', 'Verona', '37138', 'Italy', 'https://www.google.com/maps/dir/?api=1&destination=Via+Sogare+1+37138+Verona+Italy', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:39:11.190475+00'),
  ('84d47919-2c83-4ea0-855b-be4eb86ed9c1', 'Volkel', 'Heikantsepad 2B, 5408 PX Volkel, Netherlands', 'Volkel', NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=Volkel%2C%20Heikantsepad%202B%2C%205408%20PX%20Volkel%2C%20Netherlands%2C%20Volkel', '2026-10-04 21:15:13.529952+00', '2026-10-04 21:15:13.298+00'),
  ('ff008866-847b-4ee9-a88e-ed5301636a62', 'Wachtebeke', 'Puyenbrug 1A', 'Wachtebeke', '9185', 'Belgium', 'https://maps.app.goo.gl/aJZcEwCSzvM9ut84A', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:43:02.94854+00'),
  ('dee0fc7e-9251-4bf6-8ce7-700f14d27dfa', 'Westerlo', 'Britselaan 2260', 'Westerlo', '2260', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Britselaan+2260+2260+Westerlo+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:43:02.94854+00'),
  ('47357e74-b33b-4cce-9276-9789306d2935', 'Wijchen', 'Sint Jorispad 46, 6603 AM Wijchen, Netherlands', NULL, NULL, NULL, 'https://www.google.com/maps/search/?api=1&query=Wijchen%2C%20Sint%20Jorispad%2046%2C%206603%20AM%20Wijchen%2C%20Netherlands', '2026-10-04 21:15:14.619138+00', '2026-10-04 21:15:14.473+00'),
  ('818da401-2865-448f-a658-90ded1176ff4', 'Wilrijk', 'Moerelei 117', 'Wilrijk', '2610', 'Belgium', 'https://www.google.com/maps/dir/?api=1&destination=Moerelei+117+2610+Wilrijk+Belgium', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:43:02.94854+00'),
  ('24ee184d-147d-4ce4-a550-326cdb8ce53a', 'Zolder', 'Terlaemen 30', 'Heusden-Zolder', '3550', 'Belgium', 'https://maps.app.goo.gl/Evqt16zLNtQACeh28', '2026-03-11 22:39:11.190475+00', '2026-03-11 22:43:02.94854+00')
) AS v(id, name, address, city, postal_code, country, maps_url, created_at, updated_at);

-- Earlier migrations may already have created rows with the same name but a
-- different (random) id. Re-key those to the production id so that later
-- migrations that reference production ids by UUID resolve.
DO $$
DECLARE
  r record;
  old_id uuid;
BEGIN
  FOR r IN SELECT * FROM ref_event_types LOOP
    CONTINUE WHEN EXISTS (SELECT 1 FROM event_types WHERE id = r.id);
    SELECT id INTO old_id FROM event_types WHERE name = r.name;
    IF old_id IS NULL THEN
      INSERT INTO event_types (id, name, color_code, created_at) VALUES (r.id, r.name, r.color_code, r.created_at);
    ELSE
      INSERT INTO event_types (id, name, color_code, created_at) VALUES (r.id, r.name || ' (new)', r.color_code, r.created_at);
      UPDATE events SET event_type_id = r.id WHERE event_type_id = old_id;
      DELETE FROM event_types WHERE id = old_id;
      UPDATE event_types SET name = r.name WHERE id = r.id;
    END IF;
  END LOOP;

  FOR r IN SELECT * FROM ref_locations LOOP
    CONTINUE WHEN EXISTS (SELECT 1 FROM locations WHERE id = r.id);
    SELECT id INTO old_id FROM locations WHERE name = r.name LIMIT 1;
    INSERT INTO locations (id, name, address, city, postal_code, country, maps_url, created_at, updated_at)
      VALUES (r.id, r.name, r.address, r.city, r.postal_code, r.country, r.maps_url, r.created_at, r.updated_at);
    IF old_id IS NOT NULL THEN
      UPDATE events SET location_id = r.id WHERE location_id = old_id;
      DELETE FROM locations WHERE id = old_id;
    END IF;
  END LOOP;
END $$;
