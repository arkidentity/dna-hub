-- ============================================================
-- Migration 112: Dismiss Past Service
-- Created: 2026-03-08
-- Purpose: Allow users to remove individual past services from
--          their history. Deletes their block_responses and
--          tracks the dismissal so the listing RPC excludes it.
-- Depends: 110 (past_services RPCs)
-- ============================================================


-- ============================================
-- 1. dismissed_services table
-- ============================================

CREATE TABLE IF NOT EXISTS dismissed_services (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  session_id   UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

ALTER TABLE dismissed_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own dismissals"
  ON dismissed_services FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own dismissals"
  ON dismissed_services FOR SELECT
  USING (user_id = auth.uid());


-- ============================================
-- 2. dismiss_past_service RPC
-- ============================================

CREATE OR REPLACE FUNCTION dismiss_past_service(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Delete the user's block responses for this session
  DELETE FROM block_responses
  WHERE session_id = p_session_id
    AND user_id = auth.uid();

  -- Record the dismissal so the listing excludes this session
  INSERT INTO dismissed_services (user_id, session_id)
  VALUES (auth.uid(), p_session_id)
  ON CONFLICT (user_id, session_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION dismiss_past_service(UUID) TO authenticated;


-- ============================================
-- 3. Update get_user_past_services to exclude dismissed
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
  LEFT JOIN dismissed_services ds
    ON ds.session_id = ls.id AND ds.user_id = auth.uid()
  WHERE ls.church_id = p_church_id
    AND ls.ended_at IS NOT NULL
    AND ls.is_live = false
    AND ds.id IS NULL
  ORDER BY ls.ended_at DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION get_user_past_services(UUID) TO authenticated;
