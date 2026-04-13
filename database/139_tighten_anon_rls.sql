-- ============================================================
-- Migration 139: Tighten Anon RLS Policies
-- Created: 2026-04-13
-- Purpose: The anon SELECT policies on live_sessions and
--          block_response_counts used USING (true), allowing
--          anonymous users to read ALL rows across ALL churches.
--          This scopes them to published/live services only.
-- ============================================================

-- 1. live_sessions: scope to sessions for published/live services
DROP POLICY IF EXISTS "live_sessions_select_anon" ON live_sessions;
CREATE POLICY "live_sessions_select_anon"
  ON live_sessions FOR SELECT
  TO anon
  USING (
    service_id IN (
      SELECT id FROM interactive_services
      WHERE status IN ('published', 'live')
    )
  );

-- 2. block_response_counts: scope to blocks belonging to published/live services
DROP POLICY IF EXISTS "block_response_counts_select_anon" ON block_response_counts;
CREATE POLICY "block_response_counts_select_anon"
  ON block_response_counts FOR SELECT
  TO anon
  USING (
    block_id IN (
      SELECT sb.id FROM service_blocks sb
      JOIN interactive_services s ON s.id = sb.service_id
      WHERE s.status IN ('published', 'live')
    )
  );
