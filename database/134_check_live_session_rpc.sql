-- ============================================================
-- Migration 134: check_active_live_session RPC
-- Created: 2026-04-12
-- Purpose: Lightweight SECURITY DEFINER boolean check for whether
--          a church has an active live session.
--
-- Replaces direct table queries in hasActiveLiveSession() on the
-- congregation side, which were blocked by RLS for authenticated
-- users whose disciple_app_accounts.church_id didn't match.
-- (Church leaders, new disciples, or anyone testing a different
--  church's subdomain all hit this issue.)
--
-- SECURITY DEFINER bypasses RLS entirely — safe here because we
-- only expose a boolean (is there a session?) with no PII.
-- ============================================================

CREATE OR REPLACE FUNCTION check_active_live_session(p_church_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM live_sessions ls
    WHERE ls.church_id = p_church_id
      AND ls.is_live = true
  );
$$;

GRANT EXECUTE ON FUNCTION check_active_live_session(UUID) TO anon, authenticated;
