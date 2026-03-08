-- ============================================================
-- Migration 102: Conductor Retract & Reset
-- Created: 2026-03-07
-- Purpose: Allow conductors to retract a pushed block (undo)
--          or reset the entire service to start from scratch.
--
-- retract_service_block: Deactivates the current block, clears
--   its activated_at so it disappears from the congregation feed,
--   and re-activates the previous block (if any).
--
-- reset_live_service: Clears all activated_at timestamps and
--   deactivates all blocks. The session stays live but the feed
--   is empty — as if the service just started.
--
-- GOTCHA: Must GRANT to authenticated after CREATE.
-- ============================================================


-- ============================================
-- 1. RETRACT SERVICE BLOCK
-- Undo the last push. Pulls the current block
-- back and re-activates the previous one.
-- ============================================

CREATE OR REPLACE FUNCTION retract_service_block(
  p_session_id UUID,
  p_block_id   UUID
)
RETURNS UUID AS $$
DECLARE
  v_service_id UUID;
  v_prev_block_id UUID;
BEGIN
  -- Get service from the active session
  SELECT service_id INTO v_service_id
  FROM live_sessions
  WHERE id = p_session_id AND is_live = true;

  IF v_service_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or not live';
  END IF;

  -- Deactivate and clear the retracted block
  UPDATE service_blocks
  SET is_active = false, activated_at = NULL, deactivated_at = NULL
  WHERE id = p_block_id AND service_id = v_service_id;

  -- Find the most recently activated block that isn't the retracted one
  SELECT id INTO v_prev_block_id
  FROM service_blocks
  WHERE service_id = v_service_id
    AND id != p_block_id
    AND activated_at IS NOT NULL
  ORDER BY activated_at DESC
  LIMIT 1;

  IF v_prev_block_id IS NOT NULL THEN
    -- Re-activate the previous block
    UPDATE service_blocks
    SET is_active = true, deactivated_at = NULL
    WHERE id = v_prev_block_id;

    -- Update session pointer
    UPDATE live_sessions
    SET current_block_id = v_prev_block_id
    WHERE id = p_session_id;
  ELSE
    -- No previous block — clear the pointer (nothing is active)
    UPDATE live_sessions
    SET current_block_id = NULL
    WHERE id = p_session_id;
  END IF;

  -- Return the now-active block id (or NULL if none)
  RETURN v_prev_block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION retract_service_block TO authenticated;


-- ============================================
-- 2. RESET LIVE SERVICE
-- Clear all pushes. The session stays live but
-- the congregation feed goes empty.
-- ============================================

CREATE OR REPLACE FUNCTION reset_live_service(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_service_id UUID;
BEGIN
  -- Get service from the active session
  SELECT service_id INTO v_service_id
  FROM live_sessions
  WHERE id = p_session_id AND is_live = true;

  IF v_service_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or not live';
  END IF;

  -- Clear all block activation state
  UPDATE service_blocks
  SET is_active = false, activated_at = NULL, deactivated_at = NULL
  WHERE service_id = v_service_id;

  -- Clear session's current block pointer
  UPDATE live_sessions
  SET current_block_id = NULL
  WHERE id = p_session_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION reset_live_service TO authenticated;
