-- ============================================================
-- Migration 108: Next Steps — Conductor Contact Info RPC
-- Created: 2026-03-08
-- Purpose: New RPC for conductor to see next step responses
--          with contact info (name, email, phone) for follow-up.
-- ============================================================

CREATE OR REPLACE FUNCTION get_conductor_next_steps_with_contact(p_block_id UUID)
RETURNS TABLE (
  id            UUID,
  response_data JSONB,
  display_name  TEXT,
  email         TEXT,
  phone         TEXT,
  created_at    TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    br.id,
    br.response_data,
    COALESCE(daa.display_name, cg.name, 'Anonymous') AS display_name,
    COALESCE(daa.email, cg.email) AS email,
    COALESCE(daa.phone, cg.phone) AS phone,
    br.created_at
  FROM block_responses br
  LEFT JOIN disciple_app_accounts daa ON daa.id = br.user_id
  LEFT JOIN church_guests cg ON cg.id = br.guest_id
  WHERE br.block_id = p_block_id
    AND br.response_type = 'next_step_tap'
  ORDER BY br.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_conductor_next_steps_with_contact TO authenticated;
