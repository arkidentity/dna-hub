-- ============================================================
-- Migration 137: Fix conductor RPC auth + end_live_session block reset
-- Created: 2026-04-12
--
-- Bug 1: All migration-133 RPCs checked `users.church_id` which
--        does not exist — church_id is on user_roles, not users.
--        Result: retract, reset, set_prayer_phase, advance_prayer_card,
--        approve/remove prayer card all fail silently with a
--        "column u.church_id does not exist" runtime error.
--        Fix: replace the EXISTS check with user_roles.
--
-- Bug 2: end_live_session only set is_active = false but left
--        activated_at intact. On service restart, BlockSequencer
--        saw (activated_at && !is_active) → 'completed' state for
--        all previously-pushed blocks, making them un-pushable.
--        Fix: clear all block fields on session end.
--
-- GOTCHA: DROP + CREATE loses GRANT — re-added below.
-- ============================================================


-- ============================================
-- HELPER MACRO (used in every auth check)
-- Checks that auth.uid() is a church_leader for v_church_id
-- via user_roles (not users — users has no church_id column).
-- ============================================

-- ============================================
-- 1. retract_service_block (was: migration 133)
-- ============================================
DROP FUNCTION IF EXISTS retract_service_block(UUID, UUID);

CREATE OR REPLACE FUNCTION retract_service_block(
  p_session_id  UUID,
  p_block_id    UUID
)
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
  SELECT isvc.id, isvc.church_id
  INTO v_service_id, v_church_id
  FROM service_blocks sb
  JOIN interactive_services isvc ON isvc.id = sb.service_id
  WHERE sb.id = p_block_id;

  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'church_leader'
      AND ur.church_id = v_church_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT sb.sort_order INTO v_sort_order
  FROM service_blocks sb WHERE sb.id = p_block_id;

  UPDATE service_blocks
  SET is_active        = false,
      deactivated_at   = now(),
      activated_at     = NULL,
      results_shown_at = NULL,
      live_state       = NULL
  WHERE id = p_block_id;

  SELECT sb2.id INTO v_prev_id
  FROM service_blocks sb2
  WHERE sb2.service_id = v_service_id
    AND sb2.sort_order < v_sort_order
    AND sb2.deactivated_at IS NOT NULL
  ORDER BY sb2.sort_order DESC
  LIMIT 1;

  IF v_prev_id IS NOT NULL THEN
    UPDATE service_blocks
    SET is_active      = true,
        activated_at   = now(),
        deactivated_at = NULL
    WHERE id = v_prev_id;

    UPDATE live_sessions
    SET current_block_id = v_prev_id
    WHERE id = p_session_id;
  ELSE
    UPDATE live_sessions
    SET current_block_id = NULL
    WHERE id = p_session_id;
  END IF;

  RETURN v_prev_id;
END;
$$;

GRANT EXECUTE ON FUNCTION retract_service_block(UUID, UUID) TO authenticated;


-- ============================================
-- 2. reset_live_service (was: migration 133)
-- ============================================
DROP FUNCTION IF EXISTS reset_live_service(UUID);

CREATE OR REPLACE FUNCTION reset_live_service(p_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_church_id  UUID;
  v_service_id UUID;
BEGIN
  SELECT ls.church_id, ls.service_id
  INTO v_church_id, v_service_id
  FROM live_sessions ls
  WHERE ls.id = p_session_id;

  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'church_leader'
      AND ur.church_id = v_church_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE service_blocks
  SET is_active        = false,
      activated_at     = NULL,
      deactivated_at   = NULL,
      results_shown_at = NULL,
      live_state       = NULL
  WHERE service_id = v_service_id;

  UPDATE live_sessions
  SET current_block_id = NULL
  WHERE id = p_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION reset_live_service(UUID) TO authenticated;


-- ============================================
-- 3. set_prayer_phase (was: migration 133)
-- ============================================
DROP FUNCTION IF EXISTS set_prayer_phase(UUID, TEXT);

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
BEGIN
  SELECT isvc.church_id INTO v_church_id
  FROM service_blocks sb
  JOIN interactive_services isvc ON isvc.id = sb.service_id
  WHERE sb.id = p_block_id;

  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'church_leader'
      AND ur.church_id = v_church_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_phase NOT IN ('REVERE', 'REFLECT', 'REQUEST', 'REST') THEN
    RAISE EXCEPTION 'Invalid phase: %', p_phase;
  END IF;

  UPDATE service_blocks
  SET live_state = jsonb_build_object(
    'phase',               p_phase,
    'card_index',          0,
    'request_queue',       COALESCE(live_state->'request_queue', '[]'::jsonb),
    'request_queue_index', 0
  )
  WHERE id = p_block_id;
END;
$$;

GRANT EXECUTE ON FUNCTION set_prayer_phase(UUID, TEXT) TO authenticated;


-- ============================================
-- 4. advance_prayer_card (was: migration 133)
-- ============================================
DROP FUNCTION IF EXISTS advance_prayer_card(UUID, TEXT);

CREATE OR REPLACE FUNCTION advance_prayer_card(
  p_block_id   UUID,
  p_direction  TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_church_id  UUID;
  v_state      JSONB;
  v_phase      TEXT;
  v_idx        INTEGER;
  v_queue_len  INTEGER;
BEGIN
  SELECT isvc.church_id INTO v_church_id
  FROM service_blocks sb
  JOIN interactive_services isvc ON isvc.id = sb.service_id
  WHERE sb.id = p_block_id;

  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'church_leader'
      AND ur.church_id = v_church_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT live_state INTO v_state FROM service_blocks WHERE id = p_block_id;

  -- Auto-init if not yet set
  IF v_state IS NULL THEN
    v_state := jsonb_build_object(
      'phase',               'REVERE',
      'card_index',          0,
      'request_queue',       '[]'::jsonb,
      'request_queue_index', 0
    );
  END IF;

  v_phase := v_state->>'phase';

  IF v_phase = 'REQUEST' THEN
    v_idx       := COALESCE((v_state->>'request_queue_index')::INTEGER, 0);
    v_queue_len := jsonb_array_length(COALESCE(v_state->'request_queue', '[]'::jsonb));

    IF p_direction = 'next' AND v_idx < v_queue_len - 1 THEN v_idx := v_idx + 1;
    ELSIF p_direction = 'prev' AND v_idx > 0 THEN v_idx := v_idx - 1;
    END IF;

    UPDATE service_blocks
    SET live_state = live_state || jsonb_build_object('request_queue_index', v_idx)
    WHERE id = p_block_id;
  ELSE
    v_idx := COALESCE((v_state->>'card_index')::INTEGER, 0);
    IF p_direction = 'next' THEN v_idx := v_idx + 1;
    ELSIF p_direction = 'prev' AND v_idx > 0 THEN v_idx := v_idx - 1;
    END IF;

    UPDATE service_blocks
    SET live_state = COALESCE(live_state, v_state) || jsonb_build_object('card_index', v_idx)
    WHERE id = p_block_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION advance_prayer_card(UUID, TEXT) TO authenticated;


-- ============================================
-- 5. approve_prayer_card_to_queue (was: migration 133)
-- ============================================
DROP FUNCTION IF EXISTS approve_prayer_card_to_queue(UUID, UUID);

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
  v_state        JSONB;
  v_queue        JSONB;
  v_prayer_text  TEXT;
  v_display_name TEXT;
  v_is_anonymous BOOLEAN;
  v_card_item    JSONB;
BEGIN
  SELECT isvc.church_id INTO v_church_id
  FROM service_blocks sb
  JOIN interactive_services isvc ON isvc.id = sb.service_id
  WHERE sb.id = p_block_id;

  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'church_leader'
      AND ur.church_id = v_church_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT pwp.prayer_text, pwp.display_name, pwp.is_anonymous
  INTO v_prayer_text, v_display_name, v_is_anonymous
  FROM prayer_wall_posts pwp
  WHERE pwp.id = p_prayer_post_id;

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

  IF v_state IS NULL THEN
    v_state := jsonb_build_object(
      'phase',               'REVERE',
      'card_index',          0,
      'request_queue',       '[]'::jsonb,
      'request_queue_index', 0
    );
  END IF;

  v_queue := COALESCE(v_state->'request_queue', '[]'::jsonb);

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
-- 6. remove_prayer_card_from_queue (was: migration 133)
-- ============================================
DROP FUNCTION IF EXISTS remove_prayer_card_from_queue(UUID, UUID);

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
  v_state      JSONB;
  v_queue      JSONB;
  v_new_queue  JSONB := '[]'::jsonb;
  v_idx        INTEGER;
  v_item       JSONB;
BEGIN
  SELECT isvc.church_id INTO v_church_id
  FROM service_blocks sb
  JOIN interactive_services isvc ON isvc.id = sb.service_id
  WHERE sb.id = p_block_id;

  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'church_leader'
      AND ur.church_id = v_church_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT live_state INTO v_state FROM service_blocks WHERE id = p_block_id;
  IF v_state IS NULL THEN RETURN; END IF;

  v_queue := COALESCE(v_state->'request_queue', '[]'::jsonb);

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_queue)
  LOOP
    IF (v_item->>'id') IS DISTINCT FROM p_prayer_post_id::text THEN
      v_new_queue := v_new_queue || jsonb_build_array(v_item);
    END IF;
  END LOOP;

  v_idx := LEAST(
    COALESCE((v_state->>'request_queue_index')::INTEGER, 0),
    GREATEST(jsonb_array_length(v_new_queue) - 1, 0)
  );

  UPDATE service_blocks
  SET live_state = v_state
    || jsonb_build_object('request_queue',       v_new_queue)
    || jsonb_build_object('request_queue_index', v_idx)
  WHERE id = p_block_id;
END;
$$;

GRANT EXECUTE ON FUNCTION remove_prayer_card_from_queue(UUID, UUID) TO authenticated;


-- ============================================
-- 7. end_live_session — clear ALL block state on end
--    so the service can be rerun without blocks
--    appearing as 'completed' on next session start.
-- ============================================
DROP FUNCTION IF EXISTS end_live_session(UUID);

CREATE OR REPLACE FUNCTION end_live_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_id UUID;
BEGIN
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

  -- Return service to published so it can be run again
  UPDATE interactive_services
  SET status = 'published', updated_at = now()
  WHERE id = v_service_id;

  -- Fully reset ALL block state so the next session starts clean
  UPDATE service_blocks
  SET is_active        = false,
      activated_at     = NULL,
      deactivated_at   = NULL,
      results_shown_at = NULL,
      live_state       = NULL
  WHERE service_id = v_service_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION end_live_session(UUID) TO authenticated;
