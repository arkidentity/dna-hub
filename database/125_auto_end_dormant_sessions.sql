-- ============================================
-- Migration 125: Auto-End Dormant Live Sessions
-- Adds an RPC to auto-end sessions that have
-- been running for more than 6 hours with no
-- block push activity in the last 2 hours.
-- Called by the /api/cron/end-dormant-sessions
-- endpoint (hourly via Vercel Cron).
-- ============================================

CREATE OR REPLACE FUNCTION auto_end_stale_sessions()
RETURNS TABLE (
  ended_session_id  UUID,
  church_id         UUID,
  service_title     TEXT,
  started_at        TIMESTAMPTZ,
  last_block_at     TIMESTAMPTZ
) AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- Find sessions that are still live and stale:
  -- Either started more than 6 hours ago,
  -- OR no block has been activated in the last 2 hours.
  FOR v_session IN
    SELECT
      ls.id          AS session_id,
      ls.church_id,
      ls.service_id,
      ls.started_at,
      isvc.title     AS service_title,
      MAX(sb.activated_at) AS last_block_at
    FROM live_sessions ls
    JOIN interactive_services isvc ON isvc.id = ls.service_id
    LEFT JOIN service_blocks sb
      ON sb.service_id = ls.service_id
      AND sb.activated_at IS NOT NULL
    WHERE ls.is_live = true
    GROUP BY ls.id, ls.church_id, ls.service_id, ls.started_at, isvc.title
    HAVING
      -- Session has been live for over 6 hours
      ls.started_at < now() - interval '6 hours'
      OR
      -- Last block push was over 2 hours ago (or nothing was ever pushed)
      (
        ls.started_at < now() - interval '2 hours'
        AND (MAX(sb.activated_at) IS NULL OR MAX(sb.activated_at) < now() - interval '2 hours')
      )
  LOOP
    -- End the session
    UPDATE live_sessions
    SET is_live = false, ended_at = now()
    WHERE id = v_session.session_id;

    -- Deactivate all active blocks
    UPDATE service_blocks
    SET is_active = false, deactivated_at = now()
    WHERE service_id = v_session.service_id AND is_active = true;

    -- Return the service to published (not archived) so it can be run again
    UPDATE interactive_services
    SET status = 'published', updated_at = now()
    WHERE id = v_session.service_id AND status = 'live';

    -- Yield row for logging
    ended_session_id := v_session.session_id;
    church_id        := v_session.church_id;
    service_title    := v_session.service_title;
    started_at       := v_session.started_at;
    last_block_at    := v_session.last_block_at;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION auto_end_stale_sessions TO authenticated;
