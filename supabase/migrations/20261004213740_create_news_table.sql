/*
# Create news table

## Purpose
A news/announcements feature so the site can publish updates about new
functionalities, improvements, and other BMX-related news.

## New Tables
- `news`
  - `id` (uuid, PK)
  - `title` (text, not null)
  - `slug` (text, unique, not null) — URL-friendly identifier
  - `excerpt` (text) — short summary shown in the news list
  - `content` (text, not null) — full article body in markdown
  - `author` (text, default 'BMX Calendar') — author name
  - `published` (boolean, default false) — draft vs published
  - `published_at` (timestamptz) — when the article went live
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

## Security
- RLS enabled.
- SELECT: public (anon + authenticated) can read published articles only.
- INSERT/UPDATE/DELETE: admins only (app_metadata.role = 'admin').
*/

CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  author text NOT NULL DEFAULT 'BMX Calendar',
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published news" ON news;
CREATE POLICY "Public can read published news"
ON news FOR SELECT
TO anon, authenticated
USING (published = true);

DROP POLICY IF EXISTS "Admins can insert news" ON news;
CREATE POLICY "Admins can insert news"
ON news FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can update news" ON news;
CREATE POLICY "Admins can update news"
ON news FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can delete news" ON news;
CREATE POLICY "Admins can delete news"
ON news FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
