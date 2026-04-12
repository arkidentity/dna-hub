-- ============================================================
-- Migration 133: Tools Block Types
-- Created: 2026-04-12
-- Purpose: Add four new "Tools" block types for live services.
--
--   three_d_journal     — iframe to /journal/new?embed=true
--   who_else            — iframe to /who-else?embed=true
--   prayer_cards_warmup — iframe to /prayer?embed=true (my cards)
--   corporate_4d_prayer — conductor-driven prayer session
--
-- Changes:
--   - Add live_state JSONB column to service_blocks
--   - Update block_type CHECK (adds 4 new types)
--   - New RPC: set_prayer_phase
--   - New RPC: advance_prayer_card
--   - New RPC: approve_prayer_card_to_queue
--   - New RPC: remove_prayer_card_from_queue
--   - Updated RPC: get_live_service_feed (passes live_state)
--   - Updated RPC: retract_service_block (clears live_state)
--   - Updated RPC: reset_live_service (clears live_state)
--
-- GOTCHA: DROP + CREATE on RPCs loses GRANT — re-added below.
-- ============================================================


-- ============================================
-- SECTION 1: SCHEMA CHANGES
-- ============================================

-- 1.1 Add live_state to service_blocks (conductor-driven session state)
-- Used by corporate_4d_prayer to sync current phase + card to congregation.
-- Null for all other block types.
ALTER TABLE service_blocks
  ADD COLUMN IF NOT EXISTS live_state JSONB;

-- 1.2 Update block_type CHECK — drop all existing constraints, re-add with new types
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'service_blocks'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE service_blocks DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE service_blocks ADD CONSTRAINT service_blocks_block_type_check
  CHECK (block_type IN (
    'scripture', 'teaching_note', 'creed_card', 'worship_set',
    'poll', 'open_response', 'breakout_prompt',
    'giving', 'next_steps', 'connect_card',
    'fill_in_blank', 'prayer_wall', 'announcement',
    'three_d_journal', 'who_else', 'prayer_cards_warmup', 'corporate_4d_prayer'
  ));


-- ============================================
-- SECTION 2: CORPORATE 4D PRAYER RPCs
-- ============================================

-- live_state shape for corporate_4d_prayer:
-- {
--   "phase": "REVERE" | "REFLECT" | "REQUEST" | "REST",
--   "card_index": 0,
--   "request_queue": ["prayer_wall_post_id", ...],
--   "request_queue_index": 0
-- }

-- ============================================
-- 2.1 SET PRAYER PHASE
-- Conductor taps a phase tab to jump to that phase.
-- Resets card_index and request_queue_index to 0.
-- ============================================
CREATE OR REPLACE FUNCTION set_prayer_phase(
  p_block_id  UUID,
  p_phase     TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_church_id UUID;
  v_leader_id UUID;
BEGIN
  -- Verify caller is a church_leader for this block's church
  SELECT is.church_id INTO v_church_id
  FROM service_blocks sb
  JOIN interactive_services is ON is.id = sb.service_id
  WHERE sb.id = p_block_id;

  SELECT u.church_id INTO v_leader_id
  FROM users u
  WHERE u.id = auth.uid()
    AND u.church_id = v_church_id;

  IF v_leader_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_phase NOT IN ('REVERE', 'REFLECT', 'REQUEST', 'REST') THEN
    RAISE EXCEPTION 'Invalid phase: %', p_phase;
  END IF;

  UPDATE service_blocks
  SET live_state = jsonb_build_object(
    'phase',                p_phase,
    'card_index',           0,
    'request_queue',        COALESCE((live_state->>'request_queue')::jsonb, '[]'::jsonb),
    'request_queue_index',  0
  )
  WHERE id = p_block_id;
END;
$$;

GRANT EXECUTE ON FUNCTION set_prayer_phase(UUID, TEXT) TO authenticated;

-- ============================================
-- 2.2 ADVANCE PRAYER CARD
-- Conductor taps next/prev within the current phase.
-- For REQUEST phase: advances request_queue_index.
-- For other phases:  advances card_index.
-- ============================================
CREATE OR REPLACE FUNCTION advance_prayer_card(
  p_block_id   UUID,
  p_direction  TEXT  -- 'next' | 'prev'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_church_id  UUID;
  v_leader_id  UUID;
  v_state      JSONB;
  v_phase      TEXT;
  v_idx        INTEGER;
  v_queue_len  INTEGER;
BEGIN
  SELECT is.church_id INTO v_church_id
  FROM service_blocks sb
  JOIN interactive_services is ON is.id = sb.service_id
  WHERE sb.id = p_block_id;

  SELECT u.church_id INTO v_leader_id
  FROM users u
  WHERE u.id = auth.uid()
    AND u.church_id = v_church_id;

  IF v_leader_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT live_state INTO v_state FROM service_blocks WHERE id = p_block_id;

  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Block has no live_state';
  END IF;

  v_phase := v_state->>'phase';

  IF v_phase = 'REQUEST' THEN
    v_idx       := COALESCE((v_state->>'request_queue_index')::INTEGER, 0);
    v_queue_len := jsonb_array_length(COALESCE(v_state->'request_queue', '[]'::jsonb));

    IF p_direction = 'next' AND v_idx < v_queue_len - 1 THEN
      v_idx := v_idx + 1;
    ELSIF p_direction = 'prev' AND v_idx > 0 THEN
      v_idx := v_idx - 1;
    END IF;

    UPDATE service_blocks
    SET live_state = live_state || jsonb_build_object('request_queue_index', v_idx)
    WHERE id = p_block_id;
  ELSE
    v_idx := COALESCE((v_state->>'card_index')::INTEGER, 0);

    IF p_direction = 'next' THEN
      v_idx := v_idx + 1;
    ELSIF p_direction = 'prev' AND v_idx > 0 THEN
      v_idx := v_idx - 1;
    END IF;

    UPDATE service_blocks
    SET live_state = live_state || jsonb_build_object('card_index', v_idx)
    WHERE id = p_block_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION advance_prayer_card(UUID, TEXT) TO authenticated;

-- ============================================
-- 2.3 APPROVE PRAYER CARD TO QUEUE
-- Conductor approves a prayer_wall_post for the
-- REQUEST queue. Stores inline card content so
-- congregation can render without a secondary fetch.
-- Idempotent — won't add duplicates.
--
-- Queue item shape:
-- { "id": "uuid", "prayer_text": "...", "display_name": "...", "is_anonymous": false }
-- ============================================
CREATE OR REPLACE FUNCTION approve_prayer_card_to_queue(
  p_block_id       UUID,
  p_prayer_post_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_church_id    UUID;
  v_leader_id    UUID;
  v_state        JSONB;
  v_queue        JSONB;
  v_prayer_text  TEXT;
  v_display_name TEXT;
  v_is_anonymous BOOLEAN;
  v_card_item    JSONB;
BEGIN
  SELECT is2.church_id INTO v_church_id
  FROM service_blocks sb
  JOIN interactive_services is2 ON is2.id = sb.service_id
  WHERE sb.id = p_block_id;

  SELECT u.church_id INTO v_leader_id
  FROM users u
  WHERE u.id = auth.uid()
    AND u.church_id = v_church_id;

  IF v_leader_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Fetch prayer card content
  SELECT prayer_text, display_name, is_anonymous
  INTO v_prayer_text, v_display_name, v_is_anonymous
  FROM prayer_wall_posts
  WHERE id = p_prayer_post_id;

  IF v_prayer_text IS NULL THEN
    RAISE EXCEPTION 'Prayer post not found: %', p_prayer_post_id;
  END IF;

  v_card_item := jsonb_build_object(
    'id',           p_prayer_post_id,
    'prayer_text',  v_prayer_text,
    'display_name', CASE WHEN v_is_anonymous THEN 'Anonymous' ELSE v_display_name END,
    'is_anonymous', v_is_anonymous
  );

  SELECT live_state INTO v_state FROM service_blocks WHERE id = p_block_id;

  -- Init live_state if not set
  IF v_state IS NULL THEN
    v_state := jsonb_build_object(
      'phase',               'REVERE',
      'card_index',          0,
      'request_queue',       '[]'::jsonb,
      'request_queue_index', 0
    );
  END IF;

  v_queue := COALESCE(v_state->'request_queue', '[]'::jsonb);

  -- Idempotent: only append if id not already present
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_queue) elem
    WHERE elem->>'id' = p_prayer_post_id::text
  ) THEN
    v_queue := v_queue || jsonb_build_array(v_card_item);
  END IF;

  UPDATE service_blocks
  SET live_state = v_state || jsonb_build_object('request_queue', v_queue)
  WHERE id = p_block_id;
END;
$$;

GRANT EXECUTE ON FUNCTION approve_prayer_card_to_queue(UUID, UUID) TO authenticated;

-- ============================================
-- 2.4 REMOVE PRAYER CARD FROM QUEUE
-- Removes a post from the REQUEST queue.
-- Adjusts request_queue_index if needed.
-- ============================================
CREATE OR REPLACE FUNCTION remove_prayer_card_from_queue(
  p_block_id       UUID,
  p_prayer_post_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_church_id  UUID;
  v_leader_id  UUID;
  v_state      JSONB;
  v_queue      JSONB;
  v_new_queue  JSONB;
  v_idx        INTEGER;
  v_item       JSONB;
BEGIN
  SELECT is.church_id INTO v_church_id
  FROM service_blocks sb
  JOIN interactive_services is ON is.id = sb.service_id
  WHERE sb.id = p_block_id;

  SELECT u.church_id INTO v_leader_id
  FROM users u
  WHERE u.id = auth.uid()
    AND u.church_id = v_church_id;

  IF v_leader_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT live_state INTO v_state FROM service_blocks WHERE id = p_block_id;

  IF v_state IS NULL THEN RETURN; END IF;

  v_queue     := COALESCE(v_state->'request_queue', '[]'::jsonb);
  v_new_queue := '[]'::jsonb;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_queue)
  LOOP
    IF (v_item->>'id') IS DISTINCT FROM p_prayer_post_id::text THEN
      v_new_queue := v_new_queue || jsonb_build_array(v_item);
    END IF;
  END LOOP;

  -- Clamp index if it's now out of bounds
  v_idx := LEAST(
    COALESCE((v_state->>'request_queue_index')::INTEGER, 0),
    GREATEST(jsonb_array_length(v_new_queue) - 1, 0)
  );

  UPDATE service_blocks
  SET live_state = v_state
    || jsonb_build_object('request_queue', v_new_queue)
    || jsonb_build_object('request_queue_index', v_idx)
  WHERE id = p_block_id;
END;
$$;

GRANT EXECUTE ON FUNCTION remove_prayer_card_from_queue(UUID, UUID) TO authenticated;


-- ============================================
-- SECTION 3: UPDATE EXISTING RPCs
-- ============================================

-- 3.1 get_live_service_feed — add live_state to output
-- Existing RPC returns service blocks to congregation.
-- We add live_state so congregation can render corporate prayer.
-- ============================================
DROP FUNCTION IF EXISTS get_live_service_feed(TEXT);

CREATE OR REPLACE FUNCTION get_live_service_feed(p_subdomain TEXT)
RETURNS TABLE (
  session_id        UUID,
  session_status    TEXT,
  session_ended_at  TIMESTAMPTZ,
  block_id          UUID,
  block_type        TEXT,
  config            JSONB,
  is_active         BOOLEAN,
  activated_at      TIMESTAMPTZ,
  deactivated_at    TIMESTAMPTZ,
  results_shown_at  TIMESTAMPTZ,
  live_state        JSONB,
  sort_order        INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_church_id UUID;
  v_session_id UUID;
BEGIN
  SELECT c.id INTO v_church_id
  FROM churches c
  WHERE c.subdomain = p_subdomain;

  IF v_church_id IS NULL THEN RETURN; END IF;

  SELECT ls.id INTO v_session_id
  FROM live_sessions ls
  WHERE ls.church_id = v_church_id
    AND ls.status IN ('active', 'ended')
  ORDER BY ls.started_at DESC
  LIMIT 1;

  IF v_session_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    ls.id,
    ls.status,
    ls.ended_at,
    sb.id,
    sb.block_type,
    sb.config,
    sb.is_active,
    sb.activated_at,
    sb.deactivated_at,
    sb.results_shown_at,
    sb.live_state,
    sb.sort_order
  FROM live_sessions ls
  JOIN interactive_services isvc ON isvc.id = ls.service_id
  JOIN service_blocks sb ON sb.service_id = isvc.id
  WHERE ls.id = v_session_id
    AND sb.is_active = true
  ORDER BY sb.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION get_live_service_feed(TEXT) TO anon, authenticated;

-- ============================================
-- 3.2 retract_service_block — clear live_state on retract
-- ============================================
DROP FUNCTION IF EXISTS retract_service_block(UUID);

CREATE OR REPLACE FUNCTION retract_service_block(p_block_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_id  UUID;
  v_church_id   UUID;
  v_sort_order  INTEGER;
  v_prev_id     UUID;
BEGIN
  SELECT sb.service_id, sb.sort_order, is2.church_id
  INTO v_service_id, v_sort_order, v_church_id
  FROM service_blocks sb
  JOIN interactive_services is2 ON is2.id = sb.service_id
  WHERE sb.id = p_block_id;

  -- Verify caller is authorized
  IF NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.church_id = v_church_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Deactivate current block, clear live_state
  UPDATE service_blocks
  SET is_active      = false,
      deactivated_at = now(),
      activated_at   = NULL,
      results_shown_at = NULL,
      live_state     = NULL
  WHERE id = p_block_id;

  -- Re-activate the previous block (by sort_order)
  SELECT sb2.id INTO v_prev_id
  FROM service_blocks sb2
  WHERE sb2.service_id = v_service_id
    AND sb2.sort_order < v_sort_order
    AND sb2.deactivated_at IS NOT NULL
  ORDER BY sb2.sort_order DESC
  LIMIT 1;

  IF v_prev_id IS NOT NULL THEN
    UPDATE service_blocks
    SET is_active    = true,
        activated_at = now(),
        deactivated_at = NULL
    WHERE id = v_prev_id;
  END IF;

  RETURN v_prev_id;
END;
$$;

GRANT EXECUTE ON FUNCTION retract_service_block(UUID) TO authenticated;

-- ============================================
-- 3.3 reset_live_service — clear live_state on all blocks
-- ============================================
DROP FUNCTION IF EXISTS reset_live_service(UUID);

CREATE OR REPLACE FUNCTION reset_live_service(p_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_church_id UUID;
BEGIN
  SELECT ls.church_id INTO v_church_id
  FROM live_sessions ls
  WHERE ls.id = p_session_id;

  IF NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.church_id = v_church_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE service_blocks
  SET is_active        = false,
      activated_at     = NULL,
      deactivated_at   = NULL,
      results_shown_at = NULL,
      live_state       = NULL
  WHERE service_id = (
    SELECT ls.service_id FROM live_sessions ls WHERE ls.id = p_session_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION reset_live_service(UUID) TO authenticated;
