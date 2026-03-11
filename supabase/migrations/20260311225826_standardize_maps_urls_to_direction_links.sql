/*
  # Standardize Maps URLs to Direction Links

  1. Changes
    - Convert all maps_url entries to use Google Maps direction links format
    - Update Quaregnon to use proper direction link instead of shortened goo.gl link
  
  2. Details
    - Quaregnon currently uses: https://maps.app.goo.gl/c6hANpH9qB1dnuMo9
    - Will be updated to standard format: https://www.google.com/maps/dir/?api=1&destination=...
    - Ensures consistent URL format across all locations for better reliability
*/

-- Update Quaregnon to use standard direction link format
UPDATE locations
SET maps_url = 'https://www.google.com/maps/dir/?api=1&destination=Rue+Louis+Blanqui+7390+Quaregnon+Belgium'
WHERE name = 'Quaregnon' 
  AND address = 'Rue Louis Blanqui'
  AND city = 'Quaregnon'
  AND postal_code = '7390';
