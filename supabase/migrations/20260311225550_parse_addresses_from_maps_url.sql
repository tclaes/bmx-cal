/*
  # Parse Address Information from Maps URL Field

  1. Changes
    - Extract address information stored in maps_url field for foreign locations
    - Update Esselbach (GER) with proper address components
    - Update Kampen (NED) with proper address components
    - Convert plain text addresses to Google Maps direction URLs
  
  2. Details
    - Esselbach: "Am Trieb, 97839 Esselbach, Germany"
    - Kampen: "Schansdijk 3, 8263 AZ Kampen, Netherlands"
    - Properly parse street, postal code, city, and country
    - Generate proper Google Maps URLs for these locations
*/

-- Update Esselbach (GER) location
UPDATE locations
SET 
  address = 'Am Trieb',
  postal_code = '97839',
  city = 'Esselbach',
  country = 'Germany',
  maps_url = 'https://www.google.com/maps/dir/?api=1&destination=Am+Trieb+97839+Esselbach+Germany'
WHERE name = 'Esselbach (GER)' 
  AND address IS NULL
  AND maps_url = 'Am Trieb, 97839 Esselbach, Germany';

-- Update Kampen (NED) location
UPDATE locations
SET 
  address = 'Schansdijk 3',
  postal_code = '8263 AZ',
  city = 'Kampen',
  country = 'Netherlands',
  maps_url = 'https://www.google.com/maps/dir/?api=1&destination=Schansdijk+3+8263+AZ+Kampen+Netherlands'
WHERE name = 'Kampen (NED)' 
  AND address IS NULL
  AND maps_url = 'Schansdijk 3, 8263 AZ Kampen, Netherlands';
