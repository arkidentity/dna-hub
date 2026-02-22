-- Migration 071: Add contact_email to get_church_branding_by_subdomain RPC
-- Created: 2026-02-22
-- Purpose: Expose the church's contact_email through the branding RPC so that
--          the Daily DNA app can use it for the "desire to be discipled" mailto link.
--          The churches table already has contact_email — this just surfaces it
--          in the cookie-based theme that the middleware distributes.
--
-- NOTE: Must DROP the function first since return type is changing.
-- NOTE: Must re-grant EXECUTE after DROP (grants are lost on function drop).

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
  contact_email     TEXT
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
    c.contact_email::TEXT
  FROM churches c
  LEFT JOIN church_branding_settings cbs ON cbs.church_id = c.id
  WHERE c.subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Middleware uses anon key — must have EXECUTE grant
-- (Re-granted after DROP — grants are lost when the function is dropped)
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO authenticated;
