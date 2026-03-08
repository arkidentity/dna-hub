-- ============================================================
-- Migration 104: Phase 7 — Fill-in-Blank, Two-Push, Display Mode
-- Created: 2026-03-08
-- Purpose: Three features for Live Service Mode Phase 7.
--
-- 1. Fill-in-Blank block type (new engagement block)
-- 2. Two-push flow (results_shown_at column + show_block_results RPC)
-- 3. Display Mode support (get_display_approved_responses RPC)
--
-- Changes:
--   - Add results_shown_at column to service_blocks
--   - Add 'fill_in_blank' to block_type CHECK
--   - Add 'fill_in_blank' to response_type CHECK
--   - New RPC: show_block_results
--   - New RPC: get_display_approved_responses (anon-granted)
--   - Updated RPC: get_live_service_feed (adds results_shown_at)
--   - Updated RPC: retract_service_block (clears results_shown_at)
--   - Updated RPC: reset_live_service (clears results_shown_at)
--
-- GOTCHA: DROP + CREATE = must re-add GRANT EXECUTE.
-- ============================================================


-- ============================================
-- SECTION 1: SCHEMA CHANGES
-- ============================================

-- 1.1 Add results_shown_at to service_blocks (two-push flow)
ALTER TABLE service_blocks
  ADD COLUMN IF NOT EXISTS results_shown_at TIMESTAMPTZ;

-- 1.2 Add 'fill_in_blank' to block_type CHECK
ALTER TABLE service_blocks DROP CONSTRAINT IF EXISTS service_blocks_block_type_check;
ALTER TABLE service_blocks ADD CONSTRAINT service_blocks_block_type_check
  CHECK (block_type IN (
    'scripture', 'teaching_note', 'creed_card', 'worship_set',
    'poll', 'open_response', 'breakout_prompt',
    'giving', 'next_steps', 'connect_card',
    'fill_in_blank'
  ));

-- 1.3 Add 'fill_in_blank' to response_type CHECK
ALTER TABLE block_responses DROP CONSTRAINT IF EXISTS block_responses_response_type_check;
ALTER TABLE block_responses ADD CONSTRAINT block_responses_response_type_check
  CHECK (response_type IN (
    'poll_vote', 'open_text', 'next_step_tap', 'breakout_checkin',
    'fill_in_blank'
  ));


-- ============================================
-- SECTION 2: NEW RPCs
-- ============================================

-- ============================================
-- 2.1 SHOW BLOCK RESULTS (two-push flow)
-- Called by conductor to reveal results on the
-- display screen. Sets results_shown_at = now()
-- on the target block. Realtime propagates this
-- to all subscribers automatically.
-- ============================================
CREATE OR REPLACE FUNCTION show_block_results(
  p_session_id UUID,
  p_block_id   UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_service_id UUID;
BEGIN
  -- Verify session is active
  SELECT service_id INTO v_service_id
  FROM live_sessions
  WHERE id = p_session_id AND is_live = true;

  IF v_service_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or not live';
  END IF;

  -- Set results_shown_at on the target block
  UPDATE service_blocks
  SET results_shown_at = now()
  WHERE id = p_block_id
    AND service_id = v_service_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION show_block_results TO authenticated;


-- ============================================
-- 2.2 GET DISPLAY APPROVED RESPONSES
-- Returns approved responses for a block with
-- display names. Used by the projection screen
-- display mode to cycle through approved
-- fill-in-blank and open-response answers.
-- Granted to anon (display page has no auth).
-- ============================================
CREATE OR REPLACE FUNCTION get_display_approved_responses(p_block_id UUID)
RETURNS TABLE (
  id            UUID,
  response_type TEXT,
  response_data JSONB,
  display_name  TEXT,
  created_at    TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    br.id,
    br.response_type,
    br.response_data,
    COALESCE(daa.display_name, cg.name, 'Anonymous') AS display_name,
    br.created_at
  FROM block_responses br
  LEFT JOIN disciple_app_accounts daa ON daa.id = br.user_id
  LEFT JOIN church_guests cg ON cg.id = br.guest_id
  WHERE br.block_id = p_block_id
    AND br.is_approved = true
  ORDER BY br.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_display_approved_responses TO anon, authenticated;


-- ============================================
-- SECTION 3: UPDATED RPCs
-- (DROP + re-CREATE + re-GRANT)
-- ============================================

-- ============================================
-- 3.1 GET LIVE SERVICE FEED
-- Added: results_shown_at in return table
-- ============================================
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
  results_shown_at TIMESTAMPTZ
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
    sb.results_shown_at
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


-- ============================================
-- 3.2 RETRACT SERVICE BLOCK
-- Added: clears results_shown_at on retracted block
-- ============================================
DROP FUNCTION IF EXISTS retract_service_block(UUID, UUID);

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

  -- Deactivate and clear the retracted block (including results_shown_at)
  UPDATE service_blocks
  SET is_active = false, activated_at = NULL, deactivated_at = NULL,
      results_shown_at = NULL
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
-- 3.3 RESET LIVE SERVICE
-- Added: clears results_shown_at on all blocks
-- ============================================
DROP FUNCTION IF EXISTS reset_live_service(UUID);

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

  -- Clear all block activation state (including results_shown_at)
  UPDATE service_blocks
  SET is_active = false, activated_at = NULL, deactivated_at = NULL,
      results_shown_at = NULL
  WHERE service_id = v_service_id;

  -- Clear session's current block pointer
  UPDATE live_sessions
  SET current_block_id = NULL
  WHERE id = p_session_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION reset_live_service TO authenticated;
