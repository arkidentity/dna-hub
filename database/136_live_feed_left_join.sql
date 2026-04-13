-- ============================================================
-- Migration 136: Fix get_live_service_feed — LEFT JOIN blocks
-- Created: 2026-04-12
-- Problem: RPC only returned rows when is_active = true.
--          If no block is pushed yet, data.length === 0 and
--          fetchDisplayFeed / fetchLiveFeed returned null.
--          Display went to 'no-session' with no Realtime
--          subscription, so it missed the first block push.
-- Fix: Use LEFT JOIN so the session row is always returned
--      (block fields are NULL when nothing is active).
--      Clients filter out null block_id rows when building
--      their blocks array.
-- ============================================================

DROP FUNCTION IF EXISTS get_live_service_feed(UUID);

CREATE OR REPLACE FUNCTION get_live_service_feed(p_church_id UUID)
RETURNS TABLE (
  session_id        UUID,
  service_id        UUID,
  service_title     TEXT,
  is_live           BOOLEAN,
  current_block_id  UUID,
  started_at        TIMESTAMPTZ,
  block_id          UUID,
  block_type        TEXT,
  config            JSONB,
  is_active         BOOLEAN,
  activated_at      TIMESTAMPTZ,
  results_shown_at  TIMESTAMPTZ,
  live_state        JSONB,
  show_on_display   BOOLEAN,
  sort_order        INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Find the most recent live or recently-ended session for this church
  SELECT ls.id INTO v_session_id
  FROM live_sessions ls
  WHERE ls.church_id = p_church_id
    AND (ls.is_live = true OR ls.ended_at IS NOT NULL)
  ORDER BY ls.started_at DESC
  LIMIT 1;

  IF v_session_id IS NULL THEN RETURN; END IF;

  -- LEFT JOIN so we always get at least one row (the session header)
  -- even when no blocks are currently active.
  -- Clients must filter out rows where block_id IS NULL.
  RETURN QUERY
  SELECT
    ls.id                  AS session_id,
    ls.service_id          AS service_id,
    isvc.title             AS service_title,
    ls.is_live             AS is_live,
    ls.current_block_id    AS current_block_id,
    ls.started_at          AS started_at,
    sb.id                  AS block_id,
    sb.block_type          AS block_type,
    sb.config              AS config,
    sb.is_active           AS is_active,
    sb.activated_at        AS activated_at,
    sb.results_shown_at    AS results_shown_at,
    sb.live_state          AS live_state,
    sb.show_on_display     AS show_on_display,
    sb.sort_order          AS sort_order
  FROM live_sessions ls
  JOIN interactive_services isvc ON isvc.id = ls.service_id
  LEFT JOIN service_blocks sb
         ON sb.service_id = ls.service_id
        AND sb.is_active = true
  WHERE ls.id = v_session_id
  ORDER BY sb.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION get_live_service_feed(UUID) TO anon, authenticated;
