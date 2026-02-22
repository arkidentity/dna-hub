-- ============================================================
-- Migration 075: Church Custom Menu Links
--
-- Adds up to 2 custom links per church that appear in the
-- Daily DNA settings drawer below the Profile button.
-- Links open inside the app in a branded in-app web viewer.
-- ============================================================

-- 1. Add columns to church_branding_settings
ALTER TABLE church_branding_settings
  ADD COLUMN IF NOT EXISTS custom_link_1_title TEXT,
  ADD COLUMN IF NOT EXISTS custom_link_1_url   TEXT,
  ADD COLUMN IF NOT EXISTS custom_link_2_title TEXT,
  ADD COLUMN IF NOT EXISTS custom_link_2_url   TEXT;

-- 2. Update RPC to include new columns
-- NOTE: Must DROP first since return type is changing
-- NOTE: Must re-add GRANT after DROP (grants are lost on DROP)
DROP FUNCTION IF EXISTS public.get_church_branding_by_subdomain(TEXT);

CREATE FUNCTION public.get_church_branding_by_subdomain(p_subdomain TEXT)
RETURNS TABLE (
  church_id            UUID,
  church_name          TEXT,
  subdomain            TEXT,
  logo_url             TEXT,
  icon_url             TEXT,
  splash_logo_url      TEXT,
  primary_color        TEXT,
  accent_color         TEXT,
  app_title            TEXT,
  app_description      TEXT,
  theme_color          TEXT,
  header_style         TEXT,
  contact_email        TEXT,
  reading_plan_id      TEXT,
  custom_link_1_title  TEXT,
  custom_link_1_url    TEXT,
  custom_link_2_title  TEXT,
  custom_link_2_url    TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id::UUID,
    c.name::TEXT,
    c.subdomain::TEXT,
    c.logo_url::TEXT,
    c.icon_url::TEXT,
    c.splash_logo_url::TEXT,
    COALESCE(c.primary_color, '#143348')::TEXT,
    COALESCE(c.accent_color,  '#e8b562')::TEXT,
    COALESCE(cbs.app_title,       'DNA Daily')::TEXT,
    COALESCE(cbs.app_description, 'Daily discipleship tools')::TEXT,
    COALESCE(cbs.theme_color, c.primary_color, '#143348')::TEXT,
    COALESCE(cbs.header_style, 'text')::TEXT,
    c.contact_email::TEXT,
    cbs.reading_plan_id::TEXT,
    cbs.custom_link_1_title::TEXT,
    cbs.custom_link_1_url::TEXT,
    cbs.custom_link_2_title::TEXT,
    cbs.custom_link_2_url::TEXT
  FROM churches c
  LEFT JOIN church_branding_settings cbs ON cbs.church_id = c.id
  WHERE c.subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Grants MUST be re-added after DROP (they are lost on function drop)
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO authenticated;
