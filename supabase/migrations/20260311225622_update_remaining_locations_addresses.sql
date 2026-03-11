/*
  # Update Remaining Locations with Address Data

  1. Changes
    - Extract address information from maps_url field for Sviland and Verona
    - Update Sviland (NOR) with proper address components
    - Update Verona (ITA) with proper address components
    - Convert plain text addresses to Google Maps direction URLs
  
  2. Details
    - Sviland: "Espelandveien 360, 4337 Sandnes, Norway"
    - Verona: "Via Sogare, 1, 37138 Verona VR, Italy"
    - Properly parse street, postal code, city, and country
    - Generate proper Google Maps URLs for these locations
*/

-- Update Sviland (NOR) location
UPDATE locations
SET 
  address = 'Espelandveien 360',
  postal_code = '4337',
  city = 'Sandnes',
  country = 'Norway',
  maps_url = 'https://www.google.com/maps/dir/?api=1&destination=Espelandveien+360+4337+Sandnes+Norway'
WHERE name = 'Sviland (NOR)' 
  AND address IS NULL
  AND maps_url = 'Espelandveien 360, 4337 Sandnes, Norway';

-- Update Verona (ITA) location
UPDATE locations
SET 
  address = 'Via Sogare, 1',
  postal_code = '37138',
  city = 'Verona',
  country = 'Italy',
  maps_url = 'https://www.google.com/maps/dir/?api=1&destination=Via+Sogare+1+37138+Verona+Italy'
WHERE name = 'Verona (ITA)' 
  AND address IS NULL
  AND maps_url = 'Via Sogare, 1, 37138 Verona VR, Italy';
