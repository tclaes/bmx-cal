/*
  # Update Location Addresses and Maps URLs

  1. Changes
    - Parses addresses from plain text maps_url fields
    - Updates address, city, postal_code, and country fields for 8 locations
    - Converts all maps_url values to standardized Google Maps directions links
  
  2. Updated Locations
    - Benatky Nad Jizerou (CZE)
    - Brisbane, Queensland (AUS)
    - La Chapelle St. Mesmin (FRA)
    - Papendal (NED)
    - Ranst
    - Sarasota (USA) (TBC)
    - Sarrians (FRA)
    - Tiel (NED)
*/

-- Update Benatky Nad Jizerou (CZE)
UPDATE locations
SET 
  address = '294 71 Benátky nad Jizerou 1',
  city = 'Benátky nad Jizerou',
  postal_code = '294 71',
  country = 'Czechia',
  maps_url = 'https://www.google.com/maps/dir/?api=1&destination=294+71+Benátky+nad+Jizerou+1,+Czechia'
WHERE name = 'Benatky Nad Jizerou (CZE)';

-- Update Brisbane, Queensland (AUS)
UPDATE locations
SET 
  address = '2 Anna Meares Circuit',
  city = 'Chandler',
  postal_code = 'QLD 4155',
  country = 'Australia',
  maps_url = 'https://www.google.com/maps/dir/?api=1&destination=2+Anna+Meares+Circuit,+Chandler+QLD+4155,+Australia'
WHERE name = 'Brisbane, Queensland (AUS)';

-- Update La Chapelle St. Mesmin (FRA)
UPDATE locations
SET 
  address = '5 Rue des Pierrelayes',
  city = 'La Chapelle-Saint-Mesmin',
  postal_code = '45380',
  country = 'France',
  maps_url = 'https://www.google.com/maps/dir/?api=1&destination=5+Rue+des+Pierrelayes,+45380+La+Chapelle-Saint-Mesmin,+France'
WHERE name = 'La Chapelle St. Mesmin (FRA)';

-- Update Papendal (NED)
UPDATE locations
SET 
  address = 'Papendallaan 31',
  city = 'Arnhem',
  postal_code = '6816 VD',
  country = 'Netherlands',
  maps_url = 'https://www.google.com/maps/dir/?api=1&destination=Papendallaan+31,+6816+VD+Arnhem,+Netherlands'
WHERE name = 'Papendal (NED)';

-- Update Ranst (already has some fields, just update maps_url)
UPDATE locations
SET 
  maps_url = 'https://www.google.com/maps/dir/?api=1&destination=Bistweg,+2520+Ranst,+Belgium'
WHERE name = 'Ranst';

-- Update Sarasota (USA) (TBC)
UPDATE locations
SET 
  address = '1590 N Tuttle Ave',
  city = 'Sarasota',
  postal_code = 'FL 34237',
  country = 'United States',
  maps_url = 'https://www.google.com/maps/dir/?api=1&destination=1590+N+Tuttle+Ave,+Sarasota,+FL+34237,+United+States'
WHERE name = 'Sarasota (USA) (TBC)';

-- Update Sarrians (FRA)
UPDATE locations
SET 
  address = '22 Av. de la Camargue',
  city = 'Sarrians',
  postal_code = '84260',
  country = 'France',
  maps_url = 'https://www.google.com/maps/dir/?api=1&destination=22+Av.+de+la+Camargue,+84260+Sarrians,+France'
WHERE name = 'Sarrians (FRA)';

-- Update Tiel (NED)
UPDATE locations
SET 
  address = 'Schaarsdijkweg 9',
  city = 'Tiel',
  postal_code = '4006 MC',
  country = 'Netherlands',
  maps_url = 'https://www.google.com/maps/dir/?api=1&destination=Schaarsdijkweg+9,+4006+MC+Tiel,+Netherlands'
WHERE name = 'Tiel (NED)';
