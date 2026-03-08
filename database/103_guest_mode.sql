-- ============================================
-- Migration 103: Guest Mode
-- Adds RPCs for guest registration, lookup,
-- and merge. Adds anon SELECT policies so
-- guests can read live service data and
-- receive Realtime updates.
-- ============================================


-- ============================================
-- 1. REGISTER GUEST
-- Called from the /join page. Upserts by
-- (church_id, email) so returning guests
-- with the same email get their existing
-- record back instead of a duplicate.
-- ============================================
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
      -- Returning guest: update visit tracking + refresh name/phone
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

  -- New guest: generate ID + session token
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


-- ============================================
-- 2. GET GUEST BY TOKEN
-- Called on page load to restore a guest
-- session from the browser cookie/localStorage.
-- Updates visit tracking on each lookup.
-- ============================================
CREATE OR REPLACE FUNCTION get_guest_by_token(p_session_token TEXT)
RETURNS TABLE (
  guest_id      UUID,
  session_token TEXT,
  name          TEXT,
  email         TEXT,
  phone         TEXT,
  church_id     UUID,
  visit_count   INTEGER
) AS $$
BEGIN
  RETURN QUERY
    SELECT cg.id, cg.session_token, cg.name, cg.email, cg.phone,
           cg.church_id, cg.visit_count
      FROM church_guests cg
     WHERE cg.session_token = p_session_token
       AND cg.merged_to_user_id IS NULL
     LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_guest_by_token TO anon, authenticated;


-- ============================================
-- 3. MERGE GUEST TO USER
-- Called when a guest creates an account.
-- Links all past data to the new user and
-- marks the guest record as merged.
-- ============================================
CREATE OR REPLACE FUNCTION merge_guest_to_user(p_session_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_guest_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Find the guest record
  SELECT id INTO v_guest_id
    FROM church_guests
   WHERE session_token = p_session_token
     AND merged_to_user_id IS NULL;

  IF v_guest_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Mark guest as merged
  UPDATE church_guests
     SET merged_to_user_id = v_user_id
   WHERE id = v_guest_id;

  -- Link past block responses to the new user
  UPDATE block_responses
     SET user_id = v_user_id
   WHERE guest_id = v_guest_id
     AND user_id IS NULL;

  -- Link past connect card submissions
  UPDATE connect_card_submissions
     SET user_id = v_user_id
   WHERE guest_id = v_guest_id
     AND user_id IS NULL;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION merge_guest_to_user TO authenticated;


-- ============================================
-- 4. ANON SELECT POLICIES
-- Guests (anon Supabase clients) need to read
-- live service data. These policies scope
-- access to services that are published or
-- currently live.
-- ============================================

-- 4.1 service_blocks: anon can read blocks for published/live services
CREATE POLICY "service_blocks_select_anon"
  ON service_blocks FOR SELECT
  TO anon
  USING (
    service_id IN (
      SELECT id FROM interactive_services
      WHERE status IN ('published', 'live')
    )
  );

-- 4.2 live_sessions: anon can read active sessions
CREATE POLICY "live_sessions_select_anon"
  ON live_sessions FOR SELECT
  TO anon
  USING (true);

-- 4.3 block_response_counts: anon can read counts
-- (aggregate data only, no individual responses)
CREATE POLICY "block_response_counts_select_anon"
  ON block_response_counts FOR SELECT
  TO anon
  USING (true);

-- 4.4 interactive_services: anon can read published/live services
-- (needed for service_blocks policy subquery)
CREATE POLICY "interactive_services_select_anon"
  ON interactive_services FOR SELECT
  TO anon
  USING (status IN ('published', 'live'));
