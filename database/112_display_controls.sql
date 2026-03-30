-- Migration 112: Display rotation controls + email check RPC
-- Adds conductor-controlled display index/pause state to service_blocks
-- Adds email existence check RPC for join page smart routing

-- ============================================================
-- 1. Display rotation control columns on service_blocks
-- ============================================================

ALTER TABLE service_blocks
  ADD COLUMN IF NOT EXISTS display_response_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS display_paused BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 2. RPC: conductor sets display rotation state
-- Called when conductor clicks prev/next/pause on response dashboards
-- ============================================================

DROP FUNCTION IF EXISTS set_display_response_state(UUID, INTEGER, BOOLEAN);

CREATE OR REPLACE FUNCTION set_display_response_state(
  p_block_id UUID,
  p_index    INTEGER,
  p_paused   BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE service_blocks
  SET display_response_index = p_index,
      display_paused         = p_paused
  WHERE id = p_block_id;
END;
$$;

GRANT EXECUTE ON FUNCTION set_display_response_state(UUID, INTEGER, BOOLEAN) TO authenticated;

-- ============================================================
-- 3. RPC: check if a disciple email already has an account
-- Used by join page to route users to sign-in vs sign-up
-- SECURITY DEFINER so anon client can call it
-- ============================================================

DROP FUNCTION IF EXISTS check_disciple_email(TEXT);

CREATE OR REPLACE FUNCTION check_disciple_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM disciple_app_accounts
    WHERE email = lower(trim(p_email))
      AND is_active = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_disciple_email(TEXT) TO anon, authenticated;
