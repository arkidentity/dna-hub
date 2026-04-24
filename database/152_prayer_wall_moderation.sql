-- ============================================================
-- Migration 152: Prayer Wall Moderation (Daily DNA / Conductor)
-- Created: 2026-04-23
--
-- The Hub already has a moderation queue (PrayerWallTab + the
-- /api/admin/prayer-wall route). This migration adds the pieces
-- missing for in-service moderation from the conductor:
--
--   1) moderate_prayer_wall_post RPC — approve / reject / hide /
--      unhide a post. Authorized via the dual-identity helper
--      added in migration 151, so church leaders signed in via
--      Daily DNA can moderate during a live service.
--
--   2) get_pending_prayer_wall_posts — already exists; re-grant
--      to authenticated and re-create using dual-auth so the
--      conductor can read the pending queue. (Existing grant to
--      anon+authenticated stays — SECURITY DEFINER makes RLS
--      irrelevant; the concern is only that it returned posts
--      for any church_id. We now also verify the caller is a
--      church leader for that church.)
--
-- Depends on: migration 151 (is_church_leader_for helper).
-- ============================================================


-- ============================================
-- 1. moderate_prayer_wall_post
-- ============================================
DROP FUNCTION IF EXISTS moderate_prayer_wall_post(UUID, TEXT);

CREATE OR REPLACE FUNCTION moderate_prayer_wall_post(
  p_post_id UUID,
  p_action  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_church_id UUID;
BEGIN
  SELECT church_id INTO v_church_id
  FROM prayer_wall_posts
  WHERE id = p_post_id;

  IF v_church_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF NOT is_church_leader_for(v_church_id) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthorized');
  END IF;

  IF p_action = 'approve' THEN
    UPDATE prayer_wall_posts
    SET status = 'active', is_visible = true, updated_at = now()
    WHERE id = p_post_id;
  ELSIF p_action = 'reject' THEN
    -- Reject = hide permanently. We keep the row for audit,
    -- but drop status back to pending so it cannot resurface
    -- in the active feed via a future `approve` click fat-finger.
    UPDATE prayer_wall_posts
    SET is_visible = false, updated_at = now()
    WHERE id = p_post_id;
  ELSIF p_action = 'hide' THEN
    UPDATE prayer_wall_posts
    SET is_visible = false, updated_at = now()
    WHERE id = p_post_id;
  ELSIF p_action = 'unhide' THEN
    UPDATE prayer_wall_posts
    SET is_visible = true, updated_at = now()
    WHERE id = p_post_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_action');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION moderate_prayer_wall_post(UUID, TEXT) TO authenticated;


-- ============================================
-- 2. get_pending_prayer_wall_posts — tighten auth
-- ============================================
DROP FUNCTION IF EXISTS get_pending_prayer_wall_posts(UUID);

CREATE OR REPLACE FUNCTION get_pending_prayer_wall_posts(
  p_church_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  prayer_text TEXT,
  dimension TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_church_leader_for(p_church_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT p.id, p.user_id, p.display_name, p.prayer_text,
         p.dimension, p.status, p.created_at
  FROM prayer_wall_posts p
  WHERE p.church_id = p_church_id AND p.status = 'pending'
  ORDER BY p.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_pending_prayer_wall_posts(UUID) TO authenticated;
