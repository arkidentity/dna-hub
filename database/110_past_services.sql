-- ============================================================
-- Migration 110: Past Services — User History RPCs
-- Created: 2026-03-08
-- Purpose: Allow authenticated users to browse past services
--          they attended and view their responses/notes.
-- Depends: 097 (live_service_tables), 098 (live_service_rpcs),
--          104 (fill_in_blank + results_shown_at)
-- ============================================================


-- ============================================
-- 1. get_user_past_services
--    Returns ended sessions for a church, ordered newest first.
-- ============================================

CREATE OR REPLACE FUNCTION get_user_past_services(p_church_id UUID)
RETURNS TABLE (
  session_id    UUID,
  service_id    UUID,
  title         TEXT,
  service_date  DATE,
  started_at    TIMESTAMPTZ,
  ended_at      TIMESTAMPTZ,
  block_count   BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    ls.id           AS session_id,
    ls.service_id,
    isvc.title,
    isvc.service_date,
    ls.started_at,
    ls.ended_at,
    (SELECT count(*) FROM service_blocks sb WHERE sb.service_id = ls.service_id) AS block_count
  FROM live_sessions ls
  JOIN interactive_services isvc ON isvc.id = ls.service_id
  WHERE ls.church_id = p_church_id
    AND ls.ended_at IS NOT NULL
    AND ls.is_live = false
  ORDER BY ls.ended_at DESC
  LIMIT 50;
$$;


-- ============================================
-- 2. get_user_service_detail
--    Returns all blocks for a past session with the
--    calling user's own response for each block (if any).
-- ============================================

CREATE OR REPLACE FUNCTION get_user_service_detail(p_session_id UUID)
RETURNS TABLE (
  session_id      UUID,
  service_id      UUID,
  title           TEXT,
  service_date    DATE,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  block_id        UUID,
  block_type      TEXT,
  config          JSONB,
  sort_order      INTEGER,
  activated_at    TIMESTAMPTZ,
  results_shown_at TIMESTAMPTZ,
  response_type   TEXT,
  response_data   JSONB
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    ls.id             AS session_id,
    ls.service_id,
    isvc.title,
    isvc.service_date,
    ls.started_at,
    ls.ended_at,
    sb.id             AS block_id,
    sb.block_type,
    sb.config,
    sb.sort_order,
    sb.activated_at,
    sb.results_shown_at,
    br.response_type,
    br.response_data
  FROM live_sessions ls
  JOIN interactive_services isvc ON isvc.id = ls.service_id
  JOIN service_blocks sb ON sb.service_id = ls.service_id
  LEFT JOIN block_responses br
    ON br.block_id = sb.id
    AND br.session_id = ls.id
    AND br.user_id = auth.uid()
  WHERE ls.id = p_session_id
    AND ls.ended_at IS NOT NULL
  ORDER BY sb.sort_order;
$$;


-- ============================================
-- 3. Grants
-- ============================================

GRANT EXECUTE ON FUNCTION get_user_past_services(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_service_detail(UUID) TO authenticated;
