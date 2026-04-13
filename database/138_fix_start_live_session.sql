-- ============================================================
-- Migration 138: Fix start_live_session — clear block state on start
-- Created: 2026-04-12
--
-- Problem: start_live_session (migration 098) never cleared block state.
-- If a previous session ended without fully clearing blocks
-- (e.g. crash, or end_live_session ran before migration 137 fixed it),
-- the next session starts with stale activated_at/deactivated_at values.
-- BlockSequencer then computes 'completed' state for those blocks →
-- no Push button appears → conductor is stuck.
--
-- Fix: clear ALL block state fields before creating the new session.
-- This is safe — we're starting fresh. Any previous session is already ended.
--
-- GOTCHA: DROP + CREATE loses GRANT — re-added below.
-- ============================================================

DROP FUNCTION IF EXISTS start_live_session(UUID);

CREATE OR REPLACE FUNCTION start_live_session(p_service_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_church_id  UUID;
BEGIN
  -- Verify the service exists
  SELECT church_id INTO v_church_id
  FROM interactive_services
  WHERE id = p_service_id;

  IF v_church_id IS NULL THEN
    RAISE EXCEPTION 'Service not found: %', p_service_id;
  END IF;

  -- Safety: fully reset all block state before starting.
  -- end_live_session (migration 137) already does this on normal end,
  -- but this catches crash/abnormal exits and any leftover state.
  UPDATE service_blocks
  SET is_active        = false,
      activated_at     = NULL,
      deactivated_at   = NULL,
      results_shown_at = NULL,
      live_state       = NULL
  WHERE service_id = p_service_id;

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
$$;

GRANT EXECUTE ON FUNCTION start_live_session(UUID) TO authenticated;
