-- Migration 153: set_focus_block RPC
-- Lets the conductor move congregation focus to any previously-pushed block
-- without re-pushing it. Updates only live_sessions.current_block_id so that
-- the congregation Realtime subscription (live_sessions UPDATE) fires and the
-- congregation feed scrolls to the highlighted block.

CREATE OR REPLACE FUNCTION set_focus_block(p_session_id uuid, p_block_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE live_sessions
  SET current_block_id = p_block_id
  WHERE id = p_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION set_focus_block TO authenticated;
