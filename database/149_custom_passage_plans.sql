-- ============================================================
-- Migration 149: Custom Passage Plans — Tables + feature flag
-- Created: 2026-04-19
-- Purpose: Allow churches to override the global Passage of the Day
--          with their own curated series (sermon series, Easter week,
--          Advent, etc.). Partial override — churches only fill the
--          dates they care about; global curation fills all other days.
--
-- Design:
--   - church_passage_series: one row per series (name, dates, row count)
--   - church_passage_plan_entries: one row per (church, date) — date UNIQUE per church
--   - custom_passage_plan_enabled flag on church_branding_settings (piped via RPC)
--   - Reference-only (e.g. "Acts 2:1-4"); Daily DNA pulls verses via
--     existing parseReferenceToUSFM + YouVersion pipeline in user's translation
--   - No explanation field — custom plan rows render reference + verses only
--
-- RPCs (get_custom_passage_for_today, replace_passage_series) are in 150.
--
-- GOTCHA: DROP + re-CREATE RPC = must re-add GRANT to anon, authenticated.
-- ============================================================

-- ============================================================
-- 1. Series table
-- ============================================================

CREATE TABLE IF NOT EXISTS church_passage_series (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id    UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name         TEXT NOT NULL CHECK (char_length(TRIM(name)) >= 1),
  description  TEXT,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  row_count    INT  NOT NULL DEFAULT 0,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_passage_series_church
  ON church_passage_series(church_id, start_date DESC);

-- ============================================================
-- 2. Entry table (one passage per church per day)
-- ============================================================

CREATE TABLE IF NOT EXISTS church_passage_plan_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id   UUID NOT NULL REFERENCES church_passage_series(id) ON DELETE CASCADE,
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  reference   TEXT NOT NULL CHECK (char_length(TRIM(reference)) >= 1),
  theme       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (church_id, date)
);

CREATE INDEX IF NOT EXISTS idx_passage_entries_church_date
  ON church_passage_plan_entries(church_id, date);

CREATE INDEX IF NOT EXISTS idx_passage_entries_series
  ON church_passage_plan_entries(series_id);

-- ============================================================
-- 3. updated_at trigger for series
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at_passage_series()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_passage_series_updated_at ON church_passage_series;
CREATE TRIGGER trg_passage_series_updated_at
  BEFORE UPDATE ON church_passage_series
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_passage_series();

-- ============================================================
-- 4. RLS
-- ============================================================

ALTER TABLE church_passage_series          ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_passage_plan_entries    ENABLE ROW LEVEL SECURITY;

-- Hub API routes use the service role (bypasses RLS), so we only need
-- permissive read policies for the anon/auth clients that might read
-- via the RPC. The RPC itself is SECURITY DEFINER, so broad table RLS
-- can stay restrictive.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'church_passage_series'
      AND policyname = 'service_role_all_series'
  ) THEN
    CREATE POLICY service_role_all_series ON church_passage_series
      FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'church_passage_plan_entries'
      AND policyname = 'service_role_all_entries'
  ) THEN
    CREATE POLICY service_role_all_entries ON church_passage_plan_entries
      FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
  END IF;
END $$;

-- ============================================================
-- 5. Feature flag on church_branding_settings
-- ============================================================

ALTER TABLE church_branding_settings
  ADD COLUMN IF NOT EXISTS custom_passage_plan_enabled BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 6. Re-create branding RPC to include new flag
-- ============================================================

DROP FUNCTION IF EXISTS public.get_church_branding_by_subdomain(TEXT);

CREATE FUNCTION public.get_church_branding_by_subdomain(p_subdomain TEXT)
RETURNS TABLE (
  church_id                     UUID,
  church_name                   TEXT,
  subdomain                     TEXT,
  logo_url                      TEXT,
  icon_url                      TEXT,
  splash_logo_url               TEXT,
  primary_color                 TEXT,
  accent_color                  TEXT,
  app_title                     TEXT,
  app_description               TEXT,
  theme_color                   TEXT,
  header_style                  TEXT,
  contact_email                 TEXT,
  reading_plan_id               TEXT,
  custom_tab_label              TEXT,
  custom_tab_url                TEXT,
  custom_tab_mode               TEXT,
  custom_link_1_title           TEXT,
  custom_link_1_url             TEXT,
  custom_link_1_mode            TEXT,
  custom_link_2_title           TEXT,
  custom_link_2_url             TEXT,
  custom_link_2_mode            TEXT,
  custom_link_3_title           TEXT,
  custom_link_3_url             TEXT,
  custom_link_3_mode            TEXT,
  custom_link_4_title           TEXT,
  custom_link_4_url             TEXT,
  custom_link_4_mode            TEXT,
  custom_link_5_title           TEXT,
  custom_link_5_url             TEXT,
  custom_link_5_mode            TEXT,
  live_service_enabled          BOOLEAN,
  ark_courses_enabled           BOOLEAN,
  custom_passage_plan_enabled   BOOLEAN
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
    COALESCE(cbs.live_service_enabled,        FALSE)::BOOLEAN,
    COALESCE(cbs.ark_courses_enabled,         FALSE)::BOOLEAN,
    COALESCE(cbs.custom_passage_plan_enabled, FALSE)::BOOLEAN
  FROM churches c
  LEFT JOIN church_branding_settings cbs ON cbs.church_id = c.id
  WHERE c.subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Grants MUST be re-added after DROP (they are lost on function drop)
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_church_branding_by_subdomain(TEXT) TO authenticated;
