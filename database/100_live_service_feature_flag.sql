-- ============================================================
-- Migration 100: Live Service Feature Flag
-- Created: 2026-03-07
-- Purpose: Add live_service_enabled to church_branding_settings
--          so the feature can be gated to specific churches.
--          Pipes through get_church_branding_by_subdomain RPC.
--
-- GOTCHA: DROP + re-CREATE RPC = must re-add GRANT to anon, authenticated.
-- ============================================================

ALTER TABLE church_branding_settings
  ADD COLUMN IF NOT EXISTS live_service_enabled BOOLEAN DEFAULT false;


-- ============================================================
-- Update branding RPC to include live_service_enabled
-- ============================================================

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
  custom_tab_label     TEXT,
  custom_tab_url       TEXT,
  custom_tab_mode      TEXT,
  custom_link_1_title  TEXT,
  custom_link_1_url    TEXT,
  custom_link_1_mode   TEXT,
  custom_link_2_title  TEXT,
  custom_link_2_url    TEXT,
  custom_link_2_mode   TEXT,
  custom_link_3_title  TEXT,
  custom_link_3_url    TEXT,
  custom_link_3_mode   TEXT,
  custom_link_4_title  TEXT,
  custom_link_4_url    TEXT,
  custom_link_4_mode   TEXT,
  custom_link_5_title  TEXT,
  custom_link_5_url    TEXT,
  custom_link_5_mode   TEXT,
  live_service_enabled BOOLEAN
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
    cbs.custom_tab_label::TEXT,
    cbs.custom_tab_url::TEXT,
    COALESCE(cbs.custom_tab_mode,    'browser')::TEXT,
    cbs.custom_link_1_title::TEXT,
    cbs.custom_link_1_url::TEXT,
    COALESCE(cbs.custom_link_1_mode, 'browser')::TEXT,
    cbs.custom_link_2_title::TEXT,
    cbs.custom_link_2_url::TEXT,
    COALESCE(cbs.custom_link_2_mode, 'browser')::TEXT,
    cbs.custom_link_3_title::TEXT,
    cbs.custom_link_3_url::TEXT,
    COALESCE(cbs.custom_link_3_mode, 'browser')::TEXT,
    cbs.custom_link_4_title::TEXT,
    cbs.custom_link_4_url::TEXT,
    COALESCE(cbs.custom_link_4_mode, 'browser')::TEXT,
    cbs.custom_link_5_title::TEXT,
    cbs.custom_link_5_url::TEXT,
    COALESCE(cbs.custom_link_5_mode, 'browser')::TEXT,
    COALESCE(cbs.live_service_enabled, false)::BOOLEAN
  FROM churches c
  LEFT JOIN church_branding_settings cbs ON cbs.church_id = c.id
  WHERE c.subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Grants MUST be re-added after DROP (they are lost on function drop)
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO authenticated;
