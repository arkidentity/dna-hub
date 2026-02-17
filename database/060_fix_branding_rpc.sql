-- ============================================================
-- Migration 060: Restore get_church_branding_by_subdomain
-- Migration 059 accidentally dropped header_style from the return
-- type and did not re-grant EXECUTE to anon/authenticated.
-- This restores the complete function from Migration 052.
-- ============================================================

DROP FUNCTION IF EXISTS public.get_church_branding_by_subdomain(TEXT);

CREATE OR REPLACE FUNCTION public.get_church_branding_by_subdomain(p_subdomain TEXT)
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
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Middleware uses anon key — must have EXECUTE grant
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO authenticated;
