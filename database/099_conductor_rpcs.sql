-- ============================================================
-- Migration 099: Live Service Mode — Conductor RPCs
-- Created: 2026-03-07
-- Purpose: Server-side functions for the Conductor View.
--          Allows church leaders to see ALL responses and
--          connect card submissions during a live service.
-- Depends: Migration 097 (tables), Migration 098 (base RPCs)
--
-- GOTCHA: If any RPC return type changes in a future migration,
--         you MUST re-add the GRANT EXECUTE statement.
--         Grants are lost on DROP + CREATE.
-- ============================================================


-- ============================================
-- 1. GET CONDUCTOR BLOCK RESPONSES
-- Returns all responses for a block with display names.
-- Used by the conductor for next-steps list, poll details,
-- and approved open-response viewing.
-- SECURITY DEFINER bypasses block_responses RLS
-- (which restricts SELECT to user_id = auth.uid()).
-- ============================================

CREATE OR REPLACE FUNCTION get_conductor_block_responses(p_block_id UUID)
RETURNS TABLE (
  id            UUID,
  user_id       UUID,
  guest_id      UUID,
  response_type TEXT,
  response_data JSONB,
  is_approved   BOOLEAN,
  created_at    TIMESTAMPTZ,
  display_name  TEXT
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
    br.created_at,
    COALESCE(daa.display_name, cg.name, 'Anonymous') AS display_name
  FROM block_responses br
  LEFT JOIN disciple_app_accounts daa ON daa.id = br.user_id
  LEFT JOIN church_guests cg ON cg.id = br.guest_id
  WHERE br.block_id = p_block_id
  ORDER BY br.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_conductor_block_responses TO authenticated;


-- ============================================
-- 2. GET CONDUCTOR CONNECT CARDS
-- Returns all connect card submissions for a session
-- with contact info (name, email, phone).
-- Joins disciple_app_accounts + church_guests for
-- unified display regardless of member/guest status.
-- SECURITY DEFINER bypasses connect_card_submissions RLS.
-- ============================================

CREATE OR REPLACE FUNCTION get_conductor_connect_cards(p_session_id UUID)
RETURNS TABLE (
  id             UUID,
  block_id       UUID,
  user_id        UUID,
  guest_id       UUID,
  is_first_time  BOOLEAN,
  address        TEXT,
  how_heard      TEXT,
  prayer_request TEXT,
  custom_fields  JSONB,
  created_at     TIMESTAMPTZ,
  display_name   TEXT,
  email          TEXT,
  phone          TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ccs.id,
    ccs.block_id,
    ccs.user_id,
    ccs.guest_id,
    ccs.is_first_time,
    ccs.address,
    ccs.how_heard,
    ccs.prayer_request,
    ccs.custom_fields,
    ccs.created_at,
    COALESCE(daa.display_name, cg.name, 'Anonymous') AS display_name,
    COALESCE(daa.email, cg.email) AS email,
    cg.phone AS phone
  FROM connect_card_submissions ccs
  LEFT JOIN disciple_app_accounts daa ON daa.id = ccs.user_id
  LEFT JOIN church_guests cg ON cg.id = ccs.guest_id
  WHERE ccs.session_id = p_session_id
  ORDER BY ccs.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_conductor_connect_cards TO authenticated;
