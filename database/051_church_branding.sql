-- Migration 051: Church branding fields for white-label Daily DNA app
-- Created: 2026-02-12
-- Purpose: Enable per-church subdomain + logo + color customization

-- ============================================
-- ADD BRANDING FIELDS TO CHURCHES TABLE
-- ============================================

ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#143348',
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#e8b562';

-- Index for fast subdomain lookups (middleware runs on every request)
CREATE INDEX IF NOT EXISTS idx_churches_subdomain
  ON churches(subdomain) WHERE subdomain IS NOT NULL;

-- ============================================
-- CHURCH BRANDING SETTINGS TABLE
-- Extended branding config (app title, description, theme color)
-- ============================================

CREATE TABLE IF NOT EXISTS church_branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE UNIQUE NOT NULL,

  app_title TEXT DEFAULT 'DNA Daily',
  app_description TEXT DEFAULT 'Daily discipleship tools',
  theme_color TEXT, -- PWA theme-color (defaults to primary_color if null)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_church_branding_church
  ON church_branding_settings(church_id);

-- ============================================
-- RPC: GET CHURCH BRANDING BY SUBDOMAIN
-- Called by middleware on every request to subdomain
-- Granted to anon so middleware (unauthenticated) can call it
-- ============================================

CREATE OR REPLACE FUNCTION get_church_branding_by_subdomain(p_subdomain TEXT)
RETURNS TABLE (
  church_id   UUID,
  church_name TEXT,
  subdomain   TEXT,
  logo_url    TEXT,
  primary_color TEXT,
  accent_color  TEXT,
  app_title     TEXT,
  app_description TEXT,
  theme_color   TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.subdomain,
    c.logo_url,
    COALESCE(c.primary_color, '#143348'),
    COALESCE(c.accent_color,  '#e8b562'),
    COALESCE(cbs.app_title,       'DNA Daily'),
    COALESCE(cbs.app_description, 'Daily discipleship tools'),
    COALESCE(cbs.theme_color, c.primary_color, '#143348')
  FROM churches c
  LEFT JOIN church_branding_settings cbs ON cbs.church_id = c.id
  WHERE c.subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_church_branding_by_subdomain TO anon;
GRANT EXECUTE ON FUNCTION get_church_branding_by_subdomain TO authenticated;

-- ============================================
-- TRIGGER: AUTO-ASSIGN CHURCH FROM GROUP
-- When a leader adds a disciple to a group,
-- auto-populate church_id + church_subdomain
-- on their disciple_app_accounts record (if not already set)
-- ============================================

CREATE OR REPLACE FUNCTION auto_assign_church_from_group()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE disciple_app_accounts
  SET
    church_id = (
      SELECT g.church_id FROM dna_groups g WHERE g.id = NEW.group_id
    ),
    church_subdomain = (
      SELECT ch.subdomain
      FROM churches ch
      INNER JOIN dna_groups g ON g.church_id = ch.id
      WHERE g.id = NEW.group_id
    ),
    updated_at = NOW()
  WHERE
    disciple_id = NEW.disciple_id
    AND church_id IS NULL; -- Only if not already set

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if group_disciples table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'group_disciples'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_auto_assign_church ON group_disciples;
    CREATE TRIGGER trigger_auto_assign_church
      AFTER INSERT ON group_disciples
      FOR EACH ROW
      EXECUTE FUNCTION auto_assign_church_from_group();
  END IF;
END $$;

-- ============================================
-- STORAGE BUCKET: church-logos
-- Public read, admin write
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('church-logos', 'church-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read of church logos
CREATE POLICY "Church logos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'church-logos');

-- Allow authenticated users with admin role to upload
CREATE POLICY "Admins can upload church logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'church-logos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admins can update church logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'church-logos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Admins can delete church logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'church-logos'
    AND auth.role() = 'authenticated'
  );
