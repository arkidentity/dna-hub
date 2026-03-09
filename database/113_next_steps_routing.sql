-- ============================================================
-- Migration 113: Service Response Routing
-- Created: 2026-03-09
-- Purpose: Phone column on disciple_app_accounts + RPCs for
--          fetching ALL actionable service responses (next steps,
--          announcement signups, connect cards) with contact info,
--          coordinator routing, and person-centric grouping.
-- ============================================================


-- ============================================
-- 1. Add phone column to disciple_app_accounts
-- ============================================
ALTER TABLE disciple_app_accounts ADD COLUMN IF NOT EXISTS phone TEXT;


-- ============================================
-- 2. RPC: get_service_responses_for_session
-- Returns ALL actionable responses for a live session:
--   - next_step_tap (from block_responses)
--   - announcement_signup (from block_responses)
--   - connect_card (from connect_card_submissions)
-- Joined with contact info + coordinator email from block config.
-- ============================================
CREATE OR REPLACE FUNCTION get_service_responses_for_session(p_session_id UUID)
RETURNS TABLE (
  response_id       UUID,
  person_key        TEXT,
  display_name      TEXT,
  email             TEXT,
  phone             TEXT,
  is_guest          BOOLEAN,
  block_type        TEXT,
  response_type     TEXT,
  response_label    TEXT,
  coordinator_email TEXT,
  response_data     JSONB,
  responded_at      TIMESTAMPTZ,
  service_title     TEXT,
  service_date      DATE,
  session_ended_at  TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY

  -- Next step taps + announcement signups
  SELECT
    br.id AS response_id,
    COALESCE(br.user_id::TEXT, br.guest_id::TEXT) AS person_key,
    COALESCE(daa.display_name, cg.name, 'Anonymous') AS display_name,
    COALESCE(daa.email, cg.email) AS email,
    COALESCE(daa.phone, cg.phone) AS phone,
    (br.guest_id IS NOT NULL AND br.user_id IS NULL) AS is_guest,
    sb.block_type::TEXT,
    br.response_type::TEXT,
    CASE
      WHEN br.response_type = 'next_step_tap' THEN
        (SELECT (elem->>'label')::TEXT
         FROM jsonb_array_elements(sb.config->'steps') AS elem
         WHERE elem->>'id' = br.response_data->>'step'
         LIMIT 1)
      WHEN br.response_type = 'announcement_signup' THEN
        COALESCE(sb.config->>'title', 'Announcement')
      ELSE sb.block_type::TEXT
    END AS response_label,
    CASE
      WHEN br.response_type = 'next_step_tap' THEN
        (SELECT (elem->>'coordinator_email')::TEXT
         FROM jsonb_array_elements(sb.config->'steps') AS elem
         WHERE elem->>'id' = br.response_data->>'step'
         LIMIT 1)
      WHEN br.response_type = 'announcement_signup' THEN
        sb.config->>'coordinator_email'
      ELSE NULL
    END AS coordinator_email,
    br.response_data,
    br.created_at AS responded_at,
    isvc.title AS service_title,
    isvc.service_date,
    ls.ended_at AS session_ended_at
  FROM block_responses br
  JOIN service_blocks sb ON sb.id = br.block_id
  JOIN live_sessions ls ON ls.id = br.session_id
  JOIN interactive_services isvc ON isvc.id = ls.service_id
  LEFT JOIN disciple_app_accounts daa ON daa.id = br.user_id
  LEFT JOIN church_guests cg ON cg.id = br.guest_id
  WHERE br.session_id = p_session_id
    AND br.response_type IN ('next_step_tap', 'announcement_signup')

  UNION ALL

  -- Connect card submissions
  SELECT
    ccs.id AS response_id,
    COALESCE(ccs.user_id::TEXT, ccs.guest_id::TEXT) AS person_key,
    COALESCE(daa2.display_name, cg2.name, 'Anonymous') AS display_name,
    COALESCE(daa2.email, cg2.email) AS email,
    COALESCE(daa2.phone, cg2.phone) AS phone,
    (ccs.guest_id IS NOT NULL AND ccs.user_id IS NULL) AS is_guest,
    'connect_card'::TEXT AS block_type,
    'connect_card'::TEXT AS response_type,
    'Connect Card'::TEXT AS response_label,
    sb2.config->>'coordinator_email' AS coordinator_email,
    jsonb_build_object(
      'is_first_time', ccs.is_first_time,
      'address', ccs.address,
      'how_heard', ccs.how_heard,
      'prayer_request', ccs.prayer_request
    ) AS response_data,
    ccs.created_at AS responded_at,
    isvc2.title AS service_title,
    isvc2.service_date,
    ls2.ended_at AS session_ended_at
  FROM connect_card_submissions ccs
  JOIN service_blocks sb2 ON sb2.id = ccs.block_id
  JOIN live_sessions ls2 ON ls2.id = ccs.session_id
  JOIN interactive_services isvc2 ON isvc2.id = ls2.service_id
  LEFT JOIN disciple_app_accounts daa2 ON daa2.id = ccs.user_id
  LEFT JOIN church_guests cg2 ON cg2.id = ccs.guest_id
  WHERE ccs.session_id = p_session_id

  ORDER BY responded_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_service_responses_for_session TO authenticated;


-- ============================================
-- 3. RPC: get_service_responses_for_church
-- Returns ALL actionable responses across all sessions
-- for a church, with pagination. For Hub dashboard.
-- ============================================
CREATE OR REPLACE FUNCTION get_service_responses_for_church(
  p_church_id UUID,
  p_limit INT DEFAULT 500,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  response_id       UUID,
  session_id        UUID,
  person_key        TEXT,
  display_name      TEXT,
  email             TEXT,
  phone             TEXT,
  is_guest          BOOLEAN,
  block_type        TEXT,
  response_type     TEXT,
  response_label    TEXT,
  coordinator_email TEXT,
  response_data     JSONB,
  responded_at      TIMESTAMPTZ,
  service_title     TEXT,
  service_date      DATE,
  session_ended_at  TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY

  SELECT
    br.id AS response_id,
    ls.id AS session_id,
    COALESCE(br.user_id::TEXT, br.guest_id::TEXT) AS person_key,
    COALESCE(daa.display_name, cg.name, 'Anonymous') AS display_name,
    COALESCE(daa.email, cg.email) AS email,
    COALESCE(daa.phone, cg.phone) AS phone,
    (br.guest_id IS NOT NULL AND br.user_id IS NULL) AS is_guest,
    sb.block_type::TEXT,
    br.response_type::TEXT,
    CASE
      WHEN br.response_type = 'next_step_tap' THEN
        (SELECT (elem->>'label')::TEXT
         FROM jsonb_array_elements(sb.config->'steps') AS elem
         WHERE elem->>'id' = br.response_data->>'step'
         LIMIT 1)
      WHEN br.response_type = 'announcement_signup' THEN
        COALESCE(sb.config->>'title', 'Announcement')
      ELSE sb.block_type::TEXT
    END AS response_label,
    CASE
      WHEN br.response_type = 'next_step_tap' THEN
        (SELECT (elem->>'coordinator_email')::TEXT
         FROM jsonb_array_elements(sb.config->'steps') AS elem
         WHERE elem->>'id' = br.response_data->>'step'
         LIMIT 1)
      WHEN br.response_type = 'announcement_signup' THEN
        sb.config->>'coordinator_email'
      ELSE NULL
    END AS coordinator_email,
    br.response_data,
    br.created_at AS responded_at,
    isvc.title AS service_title,
    isvc.service_date,
    ls.ended_at AS session_ended_at
  FROM block_responses br
  JOIN service_blocks sb ON sb.id = br.block_id
  JOIN live_sessions ls ON ls.id = br.session_id
  JOIN interactive_services isvc ON isvc.id = ls.service_id
  LEFT JOIN disciple_app_accounts daa ON daa.id = br.user_id
  LEFT JOIN church_guests cg ON cg.id = br.guest_id
  WHERE ls.church_id = p_church_id
    AND br.response_type IN ('next_step_tap', 'announcement_signup')

  UNION ALL

  SELECT
    ccs.id AS response_id,
    ls2.id AS session_id,
    COALESCE(ccs.user_id::TEXT, ccs.guest_id::TEXT) AS person_key,
    COALESCE(daa2.display_name, cg2.name, 'Anonymous') AS display_name,
    COALESCE(daa2.email, cg2.email) AS email,
    COALESCE(daa2.phone, cg2.phone) AS phone,
    (ccs.guest_id IS NOT NULL AND ccs.user_id IS NULL) AS is_guest,
    'connect_card'::TEXT AS block_type,
    'connect_card'::TEXT AS response_type,
    'Connect Card'::TEXT AS response_label,
    sb2.config->>'coordinator_email' AS coordinator_email,
    jsonb_build_object(
      'is_first_time', ccs.is_first_time,
      'address', ccs.address,
      'how_heard', ccs.how_heard,
      'prayer_request', ccs.prayer_request
    ) AS response_data,
    ccs.created_at AS responded_at,
    isvc2.title AS service_title,
    isvc2.service_date,
    ls2.ended_at AS session_ended_at
  FROM connect_card_submissions ccs
  JOIN service_blocks sb2 ON sb2.id = ccs.block_id
  JOIN live_sessions ls2 ON ls2.id = ccs.session_id
  JOIN interactive_services isvc2 ON isvc2.id = ls2.service_id
  LEFT JOIN disciple_app_accounts daa2 ON daa2.id = ccs.user_id
  LEFT JOIN church_guests cg2 ON cg2.id = ccs.guest_id
  WHERE ls2.church_id = p_church_id

  ORDER BY responded_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_service_responses_for_church TO authenticated;
