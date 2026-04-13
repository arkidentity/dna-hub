-- ============================================================
-- Migration 135: share_to_prayer_wall RPC
-- Created: 2026-04-12
-- Purpose: SECURITY DEFINER RPC so disciples/leaders can share
--          prayer cards to the church wall without hitting the
--          RLS church_id match requirement on disciple_app_accounts.
--          Also handles requires_approval lookup internally.
-- ============================================================

CREATE OR REPLACE FUNCTION share_to_prayer_wall(
  p_church_id   UUID,
  p_prayer_text TEXT,
  p_display_name TEXT,
  p_is_anonymous BOOLEAN DEFAULT false,
  p_dimension   TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id       UUID;
  v_requires_approval BOOLEAN;
  v_status        TEXT;
  v_post_id       UUID;
BEGIN
  -- Must be authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthenticated');
  END IF;

  -- Validate church exists
  IF NOT EXISTS (SELECT 1 FROM churches WHERE id = p_church_id) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_church');
  END IF;

  -- Validate dimension if provided
  IF p_dimension IS NOT NULL AND p_dimension NOT IN ('revere', 'reflect', 'request', 'rest') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_dimension');
  END IF;

  -- Look up whether this church requires approval
  SELECT COALESCE(requires_approval, false)
    INTO v_requires_approval
    FROM church_prayer_wall_settings
   WHERE church_id = p_church_id;

  v_status := CASE WHEN COALESCE(v_requires_approval, false) THEN 'pending' ELSE 'active' END;

  -- Insert
  INSERT INTO prayer_wall_posts (
    church_id,
    user_id,
    is_anonymous,
    display_name,
    prayer_text,
    dimension,
    status
  ) VALUES (
    p_church_id,
    v_user_id,
    p_is_anonymous,
    p_display_name,
    p_prayer_text,
    p_dimension,
    v_status
  )
  RETURNING id INTO v_post_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', v_status,
    'post_id', v_post_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'reason', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION share_to_prayer_wall(UUID, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;
