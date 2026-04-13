-- ============================================================
-- Migration 140: Input Length Validation for RPCs
-- Created: 2026-04-13
-- Purpose: Add length checks to SECURITY DEFINER RPCs that
--          accept free-text input. Prevents oversized payloads
--          from bloating the database. Does not affect normal
--          user input (limits are generous).
-- ============================================================


-- 1. submit_block_response — cap response_data at 10KB
CREATE OR REPLACE FUNCTION submit_block_response(
  p_block_id       UUID,
  p_session_id     UUID,
  p_response_type  TEXT,
  p_response_data  JSONB,
  p_guest_id       UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_response_id UUID;
  v_user_id UUID;
BEGIN
  -- Input validation
  IF length(p_response_type) > 50 THEN
    RAISE EXCEPTION 'response_type too long';
  END IF;
  IF length(p_response_data::TEXT) > 10240 THEN
    RAISE EXCEPTION 'response_data too large';
  END IF;

  v_user_id := auth.uid();

  INSERT INTO block_responses (
    block_id, session_id, user_id, guest_id,
    response_type, response_data
  )
  VALUES (
    p_block_id, p_session_id, v_user_id, p_guest_id,
    p_response_type, p_response_data
  )
  RETURNING id INTO v_response_id;

  RETURN v_response_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION submit_block_response TO anon, authenticated;


-- 2. register_guest — cap name/email/phone lengths
CREATE OR REPLACE FUNCTION register_guest(
  p_church_id  UUID,
  p_name       TEXT,
  p_email      TEXT DEFAULT NULL,
  p_phone      TEXT DEFAULT NULL
)
RETURNS TABLE (
  guest_id      UUID,
  session_token TEXT,
  name          TEXT,
  email         TEXT,
  phone         TEXT,
  visit_count   INTEGER
) AS $$
DECLARE
  v_existing RECORD;
  v_new_id UUID;
  v_token TEXT;
BEGIN
  -- Input validation
  IF length(p_name) > 200 THEN
    RAISE EXCEPTION 'name too long';
  END IF;
  IF p_email IS NOT NULL AND length(p_email) > 320 THEN
    RAISE EXCEPTION 'email too long';
  END IF;
  IF p_phone IS NOT NULL AND length(p_phone) > 30 THEN
    RAISE EXCEPTION 'phone too long';
  END IF;

  -- Check for existing guest by email (if provided)
  IF p_email IS NOT NULL AND p_email <> '' THEN
    SELECT cg.id, cg.session_token, cg.name, cg.email, cg.phone, cg.visit_count
      INTO v_existing
      FROM church_guests cg
     WHERE cg.church_id = p_church_id
       AND cg.email = p_email
       AND cg.merged_to_user_id IS NULL
     LIMIT 1;

    IF v_existing IS NOT NULL THEN
      UPDATE church_guests
         SET last_visit_at = now(),
             visit_count = church_guests.visit_count + 1,
             name = COALESCE(NULLIF(p_name, ''), church_guests.name),
             phone = COALESCE(NULLIF(p_phone, ''), church_guests.phone)
       WHERE id = v_existing.id;

      RETURN QUERY
        SELECT v_existing.id, v_existing.session_token,
               COALESCE(NULLIF(p_name, ''), v_existing.name),
               v_existing.email,
               COALESCE(NULLIF(p_phone, ''), v_existing.phone),
               v_existing.visit_count + 1;
      RETURN;
    END IF;
  END IF;

  -- New guest
  v_new_id := gen_random_uuid();
  v_token := gen_random_uuid()::TEXT;

  INSERT INTO church_guests (id, church_id, name, email, phone, session_token,
                             first_visit_at, last_visit_at, visit_count)
  VALUES (v_new_id, p_church_id, p_name, NULLIF(p_email, ''), NULLIF(p_phone, ''),
          v_token, now(), now(), 1);

  RETURN QUERY
    SELECT v_new_id, v_token, p_name,
           NULLIF(p_email, ''), NULLIF(p_phone, ''), 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION register_guest TO anon, authenticated;


-- 3. share_to_prayer_wall — cap prayer_text and display_name
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

  -- Input validation
  IF length(p_prayer_text) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'prayer_text too long (max 2000 chars)');
  END IF;
  IF length(p_display_name) > 200 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'display_name too long');
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
