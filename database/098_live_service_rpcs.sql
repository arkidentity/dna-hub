-- ============================================================
-- Migration 098: Live Service Mode — RPCs & Triggers
-- Created: 2026-03-07
-- Purpose: Server-side logic for live service operations.
--          1 aggregation trigger, 7 RPC functions.
-- Depends: Migration 097 (all live service tables)
--
-- GOTCHA: If any RPC return type changes in a future migration,
--         you MUST re-add the GRANT EXECUTE statement.
--         Grants are lost on DROP + CREATE.
-- ============================================================


-- ============================================
-- SECTION 1: AGGREGATION TRIGGER
-- Maintains denormalized counts in block_response_counts
-- whenever a new response is inserted.
-- ============================================

CREATE OR REPLACE FUNCTION update_block_response_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_option_key TEXT;
BEGIN
  -- For poll votes, use the selected option as the count key
  -- For other types, use the response_type itself
  IF NEW.response_type = 'poll_vote' THEN
    v_option_key := NEW.response_data->>'option';
  ELSE
    v_option_key := NEW.response_type;
  END IF;

  -- Upsert: create row on first response, increment on subsequent
  INSERT INTO block_response_counts (block_id, counts, total)
  VALUES (
    NEW.block_id,
    jsonb_build_object(v_option_key, 1),
    1
  )
  ON CONFLICT (block_id) DO UPDATE SET
    counts = CASE
      WHEN block_response_counts.counts ? v_option_key THEN
        jsonb_set(
          block_response_counts.counts,
          ARRAY[v_option_key],
          to_jsonb((block_response_counts.counts->>v_option_key)::int + 1)
        )
      ELSE
        block_response_counts.counts || jsonb_build_object(v_option_key, 1)
    END,
    total = block_response_counts.total + 1,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_block_response_counts
  AFTER INSERT ON block_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_block_response_counts();


-- ============================================
-- SECTION 2: RPC FUNCTIONS
-- ============================================

-- ============================================
-- 2.1 START LIVE SESSION
-- Called by conductor to begin a live service.
-- Creates a session and marks service as 'live'.
-- ============================================
CREATE OR REPLACE FUNCTION start_live_session(p_service_id UUID)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_church_id UUID;
BEGIN
  -- Get church_id from the service
  SELECT church_id INTO v_church_id
  FROM interactive_services
  WHERE id = p_service_id;

  IF v_church_id IS NULL THEN
    RAISE EXCEPTION 'Service not found';
  END IF;

  -- Create the live session
  INSERT INTO live_sessions (service_id, church_id, is_live)
  VALUES (p_service_id, v_church_id, true)
  RETURNING id INTO v_session_id;

  -- Mark service as live
  UPDATE interactive_services
  SET status = 'live', updated_at = now()
  WHERE id = p_service_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION start_live_session TO authenticated;


-- ============================================
-- 2.2 PUSH SERVICE BLOCK
-- Called by conductor to activate the next block.
-- Deactivates previous block, activates target.
-- ============================================
CREATE OR REPLACE FUNCTION push_service_block(
  p_session_id UUID,
  p_block_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_service_id UUID;
BEGIN
  -- Get service_id from the active session
  SELECT service_id INTO v_service_id
  FROM live_sessions
  WHERE id = p_session_id AND is_live = true;

  IF v_service_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or not live';
  END IF;

  -- Deactivate all currently active blocks (set deactivated_at)
  UPDATE service_blocks
  SET is_active = false, deactivated_at = now()
  WHERE service_id = v_service_id AND is_active = true;

  -- Activate the target block
  UPDATE service_blocks
  SET is_active = true, activated_at = now(), deactivated_at = NULL
  WHERE id = p_block_id AND service_id = v_service_id;

  -- Update session's current block pointer
  UPDATE live_sessions
  SET current_block_id = p_block_id
  WHERE id = p_session_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION push_service_block TO authenticated;


-- ============================================
-- 2.3 END LIVE SESSION
-- Called by conductor to end the service.
-- Archives the service and deactivates all blocks.
-- ============================================
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

  -- Deactivate all blocks
  UPDATE service_blocks
  SET is_active = false, deactivated_at = now()
  WHERE service_id = v_service_id AND is_active = true;

  -- Archive the service
  UPDATE interactive_services
  SET status = 'archived', updated_at = now()
  WHERE id = v_service_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION end_live_session TO authenticated;


-- ============================================
-- 2.4 GET LIVE SERVICE FEED
-- Called by congregation to get the active session
-- and all blocks that have been pushed so far.
-- Granted to anon for guest access.
-- ============================================
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
  activated_at     TIMESTAMPTZ
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
    sb.activated_at
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
-- 2.5 SUBMIT BLOCK RESPONSE
-- Called by congregation to submit a response
-- (poll vote, open text, next step, breakout check-in).
-- Triggers count aggregation automatically.
-- Granted to anon for guest participation.
-- ============================================
CREATE OR REPLACE FUNCTION submit_block_response(
  p_block_id       UUID,
  p_session_id     UUID,
  p_response_type  TEXT,
  p_response_data  JSONB,
  p_guest_id       UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_response_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  INSERT INTO block_responses (
    block_id, session_id, user_id, guest_id,
    response_type, response_data
  )
  VALUES (
    p_block_id, p_session_id, v_user_id, p_guest_id,
    p_response_type, p_response_data
  )
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION submit_block_response TO anon, authenticated;


-- ============================================
-- 2.6 GET PENDING RESPONSES
-- Called by conductor for the moderation queue.
-- Returns open_text responses awaiting approval.
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_responses(p_block_id UUID)
RETURNS TABLE (
  id            UUID,
  user_id       UUID,
  guest_id      UUID,
  response_type TEXT,
  response_data JSONB,
  is_approved   BOOLEAN,
  created_at    TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    br.id,
    br.user_id,
    br.guest_id,
    br.response_type,
    br.response_data,
    br.is_approved,
    br.created_at
  FROM block_responses br
  WHERE br.block_id = p_block_id
    AND (br.is_approved IS NULL OR br.is_approved = false)
  ORDER BY br.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_pending_responses TO authenticated;


-- ============================================
-- 2.7 APPROVE RESPONSE
-- Called by conductor to approve a moderated
-- response for display on the projection screen.
-- ============================================
CREATE OR REPLACE FUNCTION approve_response(p_response_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE block_responses
  SET is_approved = true
  WHERE id = p_response_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION approve_response TO authenticated;
