-- ============================================================
-- Migration 151: Live Service Fixes
-- Created: 2026-04-23
--
-- Three bugs observed during a live service:
--
-- A) Refresh of /live drops everything except the current block.
--    get_live_service_feed filters sb.is_active = true, but
--    push_service_block deactivates the prior block each push, so
--    only one block is ever returned. Fix: return all blocks that
--    have been activated at least once this session, ordered by
--    activated_at.
--
-- B) New blocks do not appear on /live without a manual refresh.
--    Congregation Realtime subscribes to service_blocks UPDATEs,
--    but the existing RLS policy only matches disciples whose
--    disciple_app_accounts.church_id is set. Disciples (and church
--    leaders running the conductor) without that link receive no
--    Realtime deliveries. Broaden the SELECT policy to any
--    authenticated user for blocks in published/live services —
--    mirrors the anon policy shape from migration 139.
--
-- C) Conductor is frozen on 4D Prayer REVERE 1/25 and congregation
--    shows "Waiting for the session to begin." The 4D prayer RPCs
--    (set_prayer_phase, advance_prayer_card, approve/remove prayer
--    card) authorize via user_roles. The conductor runs in Daily
--    DNA where auth.uid() is the church leader's
--    disciple_app_accounts.id, not their users.id — so user_roles
--    never matches and the RPCs throw silently. Fix: accept either
--    a user_roles church_leader row OR a disciple_app_accounts row
--    with role='church_leader' for that church.
--
-- GOTCHA: DROP + CREATE loses GRANT — re-added below.
-- ============================================================


-- ============================================
-- A) get_live_service_feed — return full history
-- ============================================
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
  v_started_at TIMESTAMPTZ;
BEGIN
  SELECT ls.id, ls.started_at INTO v_session_id, v_started_at
  FROM live_sessions ls
  WHERE ls.church_id = p_church_id
    AND (ls.is_live = true OR ls.ended_at IS NOT NULL)
  ORDER BY ls.started_at DESC
  LIMIT 1;

  IF v_session_id IS NULL THEN RETURN; END IF;

  -- Return every block that was activated during this session, in
  -- chronological order. LEFT JOIN preserves the session header row
  -- when no blocks have been pushed yet; clients drop null-block rows.
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
        AND (
          sb.is_active = true
          OR (sb.activated_at IS NOT NULL AND sb.activated_at >= v_started_at)
        )
  WHERE ls.id = v_session_id
  ORDER BY sb.activated_at NULLS LAST, sb.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION get_live_service_feed(UUID) TO anon, authenticated;


-- ============================================
-- B) Broaden Realtime-visible SELECT policies
--    so congregation gets UPDATE events reliably.
-- ============================================

-- service_blocks: any authenticated user can read blocks for
-- services that are currently published or live. Aligns with the
-- anon shape from migration 139.
DROP POLICY IF EXISTS "service_blocks_select" ON service_blocks;
DROP POLICY IF EXISTS "service_blocks_select_anon" ON service_blocks;
DROP POLICY IF EXISTS "service_blocks_select_authenticated" ON service_blocks;

CREATE POLICY "service_blocks_select_anon"
  ON service_blocks FOR SELECT
  TO anon
  USING (
    service_id IN (
      SELECT id FROM interactive_services
      WHERE status IN ('published', 'live')
    )
  );

CREATE POLICY "service_blocks_select_authenticated"
  ON service_blocks FOR SELECT
  TO authenticated
  USING (
    service_id IN (
      SELECT id FROM interactive_services
      WHERE status IN ('published', 'live')
    )
  );

-- live_sessions: same treatment for authenticated. (Anon policy
-- already set in migration 139.)
DROP POLICY IF EXISTS "live_sessions_select" ON live_sessions;
DROP POLICY IF EXISTS "live_sessions_select_authenticated" ON live_sessions;

CREATE POLICY "live_sessions_select_authenticated"
  ON live_sessions FOR SELECT
  TO authenticated
  USING (
    service_id IN (
      SELECT id FROM interactive_services
      WHERE status IN ('published', 'live')
    )
  );

-- block_response_counts: same. (Anon policy already set in 139.)
DROP POLICY IF EXISTS "block_response_counts_select" ON block_response_counts;
DROP POLICY IF EXISTS "block_response_counts_select_authenticated" ON block_response_counts;

CREATE POLICY "block_response_counts_select_authenticated"
  ON block_response_counts FOR SELECT
  TO authenticated
  USING (
    block_id IN (
      SELECT sb.id FROM service_blocks sb
      JOIN interactive_services s ON s.id = sb.service_id
      WHERE s.status IN ('published', 'live')
    )
  );


-- ============================================
-- C) Conductor 4D Prayer auth — accept either
--    user_roles OR disciple_app_accounts church_leader.
--
-- The conductor runs inside Daily DNA; auth.uid() there is the
-- disciple_app_accounts row, not the Hub users row.
-- ============================================

-- Helper: does the current auth.uid() have church_leader authority
-- for the given church via either identity system?
CREATE OR REPLACE FUNCTION is_church_leader_for(p_church_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'church_leader'
      AND ur.church_id = p_church_id
  ) OR EXISTS (
    SELECT 1 FROM disciple_app_accounts daa
    WHERE daa.id = auth.uid()
      AND daa.role = 'church_leader'
      AND daa.church_id = p_church_id
  );
$$;

GRANT EXECUTE ON FUNCTION is_church_leader_for(UUID) TO authenticated;


-- set_prayer_phase
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

  IF NOT is_church_leader_for(v_church_id) THEN
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


-- advance_prayer_card
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

  IF NOT is_church_leader_for(v_church_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT live_state INTO v_state FROM service_blocks WHERE id = p_block_id;

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
    SET live_state = COALESCE(live_state, v_state) || jsonb_build_object('request_queue_index', v_idx)
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


-- approve_prayer_card_to_queue
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

  IF NOT is_church_leader_for(v_church_id) THEN
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


-- remove_prayer_card_from_queue
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

  IF NOT is_church_leader_for(v_church_id) THEN
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


-- Retract and reset also guard via user_roles; widen them too so
-- the conductor's undo/reset buttons keep working for leaders
-- signed in via Daily DNA.
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

  IF NOT is_church_leader_for(v_church_id) THEN
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

    UPDATE live_sessions SET current_block_id = v_prev_id WHERE id = p_session_id;
  ELSE
    UPDATE live_sessions SET current_block_id = NULL WHERE id = p_session_id;
  END IF;

  RETURN v_prev_id;
END;
$$;

GRANT EXECUTE ON FUNCTION retract_service_block(UUID, UUID) TO authenticated;


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

  IF NOT is_church_leader_for(v_church_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE service_blocks
  SET is_active        = false,
      activated_at     = NULL,
      deactivated_at   = NULL,
      results_shown_at = NULL,
      live_state       = NULL
  WHERE service_id = v_service_id;

  UPDATE live_sessions SET current_block_id = NULL WHERE id = p_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION reset_live_service(UUID) TO authenticated;
