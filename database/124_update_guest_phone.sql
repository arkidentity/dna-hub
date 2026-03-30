-- ============================================================
-- Migration 124: Update Guest Phone RPC
-- Created: 2026-03-27
-- Purpose: Allows guests to update their phone number after
--          joining (e.g. from announcement or next-steps block).
--          Also used when a guest skipped phone on the /join
--          screen and then provides it during the service.
-- Depends: Migration 103 (church_guests table + guest RPCs)
--
-- GOTCHA: GRANT EXECUTE is required after every DROP + CREATE.
--         Grants are lost on DROP.
-- ============================================================

CREATE OR REPLACE FUNCTION update_guest_phone(
  p_session_token TEXT,
  p_phone         TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE church_guests
     SET phone = p_phone
   WHERE session_token = p_session_token
     AND merged_to_user_id IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_guest_phone TO anon, authenticated;
