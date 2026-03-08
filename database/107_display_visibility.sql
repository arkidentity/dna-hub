-- ============================================================
-- Migration 107: Display Visibility Toggle
-- Created: 2026-03-08
-- Purpose: Per-block control over projection display visibility.
--
-- Adds show_on_display BOOLEAN to service_blocks (default true).
-- Updates get_live_service_feed RPC to include the column.
-- Display mode filters blocks where show_on_display = false.
-- Congregation still sees all blocks on their phones.
--
-- GOTCHA: DROP + CREATE = must re-add GRANT EXECUTE.
-- ============================================================

-- 1. Add column
ALTER TABLE service_blocks
  ADD COLUMN IF NOT EXISTS show_on_display BOOLEAN DEFAULT true;

-- 2. Update get_live_service_feed to include show_on_display
DROP FUNCTION IF EXISTS get_live_service_feed(UUID);

CREATE OR REPLACE FUNCTION get_live_service_feed(p_church_id UUID)
RETURNS TABLE (
  session_id       UUID,
  service_id       UUID,
  service_title    TEXT,
  is_live          BOOLEAN,
  current_block_id UUID,
  started_at       TIMESTAMPTZ,
  block_id         UUID,
  block_type       TEXT,
  config           JSONB,
  sort_order       INTEGER,
  is_active        BOOLEAN,
  activated_at     TIMESTAMPTZ,
  results_shown_at TIMESTAMPTZ,
  show_on_display  BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ls.id AS session_id,
    ls.service_id,
    isvc.title AS service_title,
    ls.is_live,
    ls.current_block_id,
    ls.started_at,
    sb.id AS block_id,
    sb.block_type,
    sb.config,
    sb.sort_order,
    sb.is_active,
    sb.activated_at,
    sb.results_shown_at,
    sb.show_on_display
  FROM live_sessions ls
  JOIN interactive_services isvc ON isvc.id = ls.service_id
  JOIN service_blocks sb ON sb.service_id = ls.service_id
  WHERE ls.church_id = p_church_id
    AND ls.is_live = true
    AND sb.activated_at IS NOT NULL
  ORDER BY sb.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_live_service_feed TO anon, authenticated;
