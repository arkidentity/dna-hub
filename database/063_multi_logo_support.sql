-- Migration 063: Multi-logo support for white-label branding
-- Created: 2026-02-18
-- Purpose: Add separate icon_url (PWA app icon) and splash_logo_url (splash screen)
--          alongside the existing logo_url (header logo).
--
-- Logo slot purposes:
--   logo_url        → Horizontal header logo (top-left in app header)
--   icon_url        → Square app icon (PWA home screen, 512×512 recommended)
--   splash_logo_url → Splash/loading screen logo (wider format OK)

-- ============================================
-- ADD LOGO COLUMNS TO CHURCHES TABLE
-- ============================================

ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS icon_url TEXT,
  ADD COLUMN IF NOT EXISTS splash_logo_url TEXT;

-- ============================================
-- UPDATE RPC: GET CHURCH BRANDING BY SUBDOMAIN
-- Adds icon_url + splash_logo_url to return columns
-- NOTE: Must DROP first since return type is changing
-- NOTE: Must re-add GRANT after DROP (grants are lost on DROP)
-- ============================================

DROP FUNCTION IF EXISTS public.get_church_branding_by_subdomain(TEXT);

CREATE FUNCTION public.get_church_branding_by_subdomain(p_subdomain TEXT)
RETURNS TABLE (
  church_id         UUID,
  church_name       TEXT,
  subdomain         TEXT,
  logo_url          TEXT,
  icon_url          TEXT,
  splash_logo_url   TEXT,
  primary_color     TEXT,
  accent_color      TEXT,
  app_title         TEXT,
  app_description   TEXT,
  theme_color       TEXT,
  header_style      TEXT
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
    COALESCE(cbs.header_style, 'text')::TEXT
  FROM churches c
  LEFT JOIN church_branding_settings cbs ON cbs.church_id = c.id
  WHERE c.subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Grants MUST be re-added after DROP (they are lost on function drop)
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO authenticated;
