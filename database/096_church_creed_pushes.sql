-- ============================================================
-- Migration 096: Church Creed Card Pushes
-- Created: 2026-03-06
-- Purpose: Church leaders push a creed card to their
--          congregation. Active push shows as a banner in
--          Daily DNA. Auto-expires after 24 hours. Old rows
--          serve as push history (no cron cleanup needed).
-- ============================================================

-- ============================================
-- 1. church_creed_pushes
-- ============================================
CREATE TABLE IF NOT EXISTS church_creed_pushes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  card_id     INTEGER NOT NULL CHECK (card_id >= 1 AND card_id <= 50),
  pushed_by   UUID,
  pushed_at   TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ DEFAULT now() + interval '24 hours',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup: active push for a church
CREATE INDEX IF NOT EXISTS idx_church_creed_pushes_active
  ON church_creed_pushes (church_id, expires_at DESC);

-- ============================================
-- 2. RLS Policies
-- ============================================
ALTER TABLE church_creed_pushes ENABLE ROW LEVEL SECURITY;

-- Authenticated users in the church can read pushes
CREATE POLICY "creed_pushes_select"
  ON church_creed_pushes FOR SELECT
  USING (
    church_id IN (
      SELECT daa.church_id FROM disciple_app_accounts daa
      WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
    )
  );

-- Insert/update is service-role only (Hub admin)

-- ============================================
-- 3. RPC: get active creed push for a church
-- ============================================
CREATE OR REPLACE FUNCTION get_active_creed_push(p_church_id UUID)
RETURNS TABLE (
  card_id     INTEGER,
  pushed_at   TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT cp.card_id, cp.pushed_at, cp.expires_at
  FROM church_creed_pushes cp
  WHERE cp.church_id = p_church_id
    AND cp.expires_at > now()
  ORDER BY cp.pushed_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_active_creed_push TO anon, authenticated;
