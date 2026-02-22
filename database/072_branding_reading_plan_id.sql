-- Migration 072: Add reading_plan_id to church branding settings
-- Created: 2026-02-22
-- Purpose: Allow each church to select which reading plan their disciples see
--          in the Daily DNA app's Reading Plan tool.
--
-- The selected plan ID flows through the branding cookie so the app picks
-- it up automatically. Default (null) = 'nt-90' fallback in the app.

-- ============================================
-- ADD COLUMN TO church_branding_settings
-- ============================================

ALTER TABLE church_branding_settings
  ADD COLUMN IF NOT EXISTS reading_plan_id TEXT;

-- ============================================
-- UPDATE RPC: GET CHURCH BRANDING BY SUBDOMAIN
-- Adds reading_plan_id to return columns
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
  header_style      TEXT,
  contact_email     TEXT,
  reading_plan_id   TEXT
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
    cbs.reading_plan_id::TEXT
  FROM churches c
  LEFT JOIN church_branding_settings cbs ON cbs.church_id = c.id
  WHERE c.subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Grants MUST be re-added after DROP (they are lost on function drop)
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO authenticated;
