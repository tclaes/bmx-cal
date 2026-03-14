/*
  # Move http Extension to extensions Schema

  ## Summary
  The `http` extension is currently installed in the `public` schema, which
  exposes its functions and types to all users by default. Moving it to a
  dedicated `extensions` schema is a security best practice that limits
  exposure.

  ## Changes
  - Create the `extensions` schema if it does not exist
  - Drop the `http` extension from `public`
  - Reinstall `http` in the `extensions` schema
*/

CREATE SCHEMA IF NOT EXISTS extensions;

DROP EXTENSION IF EXISTS http;
CREATE EXTENSION http WITH SCHEMA extensions;
