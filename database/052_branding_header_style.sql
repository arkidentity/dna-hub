-- ============================================
-- Migration 052: Add header_style to church_branding_settings
-- Controls whether the app header shows logo or text
-- ============================================

ALTER TABLE church_branding_settings
  ADD COLUMN IF NOT EXISTS header_style TEXT NOT NULL DEFAULT 'text'
    CHECK (header_style IN ('text', 'logo'));

-- ============================================
-- Updated RPC — now includes header_style
-- Must DROP first because return type changed
-- ============================================

DROP FUNCTION IF EXISTS get_church_branding_by_subdomain(text);

CREATE OR REPLACE FUNCTION get_church_branding_by_subdomain(p_subdomain TEXT)
RETURNS TABLE (
  church_id       UUID,
  church_name     TEXT,
  subdomain       TEXT,
  logo_url        TEXT,
  primary_color   TEXT,
  accent_color    TEXT,
  app_title       TEXT,
  app_description TEXT,
  theme_color     TEXT,
  header_style    TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id::UUID,
    c.name::TEXT,
    c.subdomain::TEXT,
    c.logo_url::TEXT,
    COALESCE(c.primary_color, '#143348')::TEXT,
    COALESCE(c.accent_color,  '#e8b562')::TEXT,
    COALESCE(cbs.app_title,       'DNA Daily')::TEXT,
    COALESCE(cbs.app_description, 'Daily discipleship tools')::TEXT,
    COALESCE(cbs.theme_color, c.primary_color, '#143348')::TEXT,
    COALESCE(cbs.header_style, 'text')::TEXT
  FROM churches c
  LEFT JOIN church_branding_settings cbs ON cbs.church_id = c.id
  WHERE c.subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_church_branding_by_subdomain TO anon;
GRANT EXECUTE ON FUNCTION get_church_branding_by_subdomain TO authenticated;
