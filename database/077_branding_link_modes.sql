-- ============================================================
-- Migration 077: Link Open Modes
--
-- Adds a `_mode` column for the custom tab and each of the 5
-- More drawer links. Values: 'iframe' | 'browser' (default).
-- 'browser' opens the URL in the device's default browser
-- (window.open). 'iframe' embeds it in the in-app webview.
-- Default is 'browser' — churches opt in to iframe when they
-- know their site supports embedding.
-- ============================================================

ALTER TABLE church_branding_settings
  ADD COLUMN IF NOT EXISTS custom_tab_mode    TEXT DEFAULT 'browser' CHECK (custom_tab_mode    IN ('iframe', 'browser')),
  ADD COLUMN IF NOT EXISTS custom_link_1_mode TEXT DEFAULT 'browser' CHECK (custom_link_1_mode IN ('iframe', 'browser')),
  ADD COLUMN IF NOT EXISTS custom_link_2_mode TEXT DEFAULT 'browser' CHECK (custom_link_2_mode IN ('iframe', 'browser')),
  ADD COLUMN IF NOT EXISTS custom_link_3_mode TEXT DEFAULT 'browser' CHECK (custom_link_3_mode IN ('iframe', 'browser')),
  ADD COLUMN IF NOT EXISTS custom_link_4_mode TEXT DEFAULT 'browser' CHECK (custom_link_4_mode IN ('iframe', 'browser')),
  ADD COLUMN IF NOT EXISTS custom_link_5_mode TEXT DEFAULT 'browser' CHECK (custom_link_5_mode IN ('iframe', 'browser'));

-- Update RPC to return mode columns
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
  custom_link_5_mode   TEXT
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
    COALESCE(cbs.custom_link_5_mode, 'browser')::TEXT
  FROM churches c
  LEFT JOIN church_branding_settings cbs ON cbs.church_id = c.id
  WHERE c.subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Grants MUST be re-added after DROP (they are lost on function drop)
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO authenticated;
