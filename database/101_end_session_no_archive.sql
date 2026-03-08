-- ============================================================
-- Migration 101: End Session Without Auto-Archive
-- Created: 2026-03-07
-- Purpose: A church may run the same service multiple times
--          in one day (9am, 11am). end_live_session should
--          return the service to 'published' so it can be
--          reused. Archiving is now an explicit action.
--
-- Changes:
--   1. Re-create end_live_session → sets status to 'published'
--      instead of 'archived'
--   2. New archive_service RPC for explicit archiving
--
-- GOTCHA: DROP + CREATE = must re-add GRANT.
-- ============================================================


-- ============================================
-- 1. FIX end_live_session — stop auto-archiving
-- ============================================

DROP FUNCTION IF EXISTS end_live_session(UUID);

CREATE OR REPLACE FUNCTION end_live_session(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_service_id UUID;
BEGIN
  -- Get service_id from the active session
  SELECT service_id INTO v_service_id
  FROM live_sessions
  WHERE id = p_session_id AND is_live = true;

  IF v_service_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or already ended';
  END IF;

  -- End the session
  UPDATE live_sessions
  SET is_live = false, ended_at = now()
  WHERE id = p_session_id;

  -- Deactivate all blocks (reset for next run)
  UPDATE service_blocks
  SET is_active = false, deactivated_at = now()
  WHERE service_id = v_service_id AND is_active = true;

  -- Return service to published (NOT archived) so it can be reused
  UPDATE interactive_services
  SET status = 'published', updated_at = now()
  WHERE id = v_service_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION end_live_session TO authenticated;


-- ============================================
-- 2. NEW: archive_service — explicit archive
-- ============================================

CREATE OR REPLACE FUNCTION archive_service(p_service_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only archive if the service is not currently live
  IF EXISTS (
    SELECT 1 FROM live_sessions
    WHERE service_id = p_service_id AND is_live = true
  ) THEN
    RAISE EXCEPTION 'Cannot archive a service with an active live session';
  END IF;

  UPDATE interactive_services
  SET status = 'archived', updated_at = now()
  WHERE id = p_service_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION archive_service TO authenticated;
