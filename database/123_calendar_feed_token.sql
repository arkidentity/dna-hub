-- Migration 123: Subscribable ICS calendar feed
-- Adds a stable per-user token to disciple_app_accounts so disciples can
-- subscribe to their DNA calendar in any calendar app (Apple, Google, Outlook).
-- The token is used in the /api/calendar/feed?token=<uuid> endpoint and never expires
-- unless manually rotated. Calendar apps poll the URL on their own schedule.

-- ─── 1. Add calendar_token column ────────────────────────────────────────────

ALTER TABLE disciple_app_accounts
  ADD COLUMN IF NOT EXISTS calendar_token UUID DEFAULT gen_random_uuid();

-- Backfill existing accounts that have NULL (shouldn't happen with DEFAULT, but safe)
UPDATE disciple_app_accounts
SET calendar_token = gen_random_uuid()
WHERE calendar_token IS NULL;

-- Index for fast token lookup (feed requests hit this on every poll)
CREATE INDEX IF NOT EXISTS idx_disciple_app_accounts_calendar_token
  ON disciple_app_accounts (calendar_token);

-- ─── 2. RPC: get_user_calendar_events_by_token ───────────────────────────────
-- Accepts a calendar_token and returns the user's events.
-- Mirrors get_my_calendar_events (Migration 048) but authenticates via token
-- instead of JWT — required because calendar apps fetch the URL server-to-server
-- without the user's active session.
--
-- Date range: caller passes p_start / p_end (typically 30 days back → 12 months ahead)
-- so that cancellations and edits propagate on the next poll.

CREATE OR REPLACE FUNCTION get_user_calendar_events_by_token(
  p_token    UUID,
  p_start    TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '12 months'
)
RETURNS TABLE (
  id           UUID,
  title        TEXT,
  description  TEXT,
  location     TEXT,
  start_time   TIMESTAMPTZ,
  end_time     TIMESTAMPTZ,
  event_type   TEXT,
  group_id     UUID,
  cohort_id    UUID,
  church_id    UUID,
  is_recurring BOOLEAN,
  created_at   TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_account_id  UUID;
  v_disciple_id UUID;
  v_email       TEXT;
BEGIN
  -- Resolve token → account
  SELECT daa.id, daa.disciple_id
  INTO v_account_id, v_disciple_id
  FROM disciple_app_accounts daa
  WHERE daa.calendar_token = p_token
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RETURN; -- invalid token — return empty result set
  END IF;

  -- Get the user's email from auth.users (SECURITY DEFINER gives us access)
  SELECT au.email INTO v_email
  FROM auth.users au
  WHERE au.id = v_account_id;

  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.location,
    e.start_time,
    e.end_time,
    e.event_type,
    e.group_id,
    e.cohort_id,
    e.church_id,
    e.is_recurring,
    e.created_at
  FROM dna_calendar_events e
  WHERE e.start_time >= p_start
    AND e.start_time <= p_end
    -- Exclude parent recurring templates (same logic as Migration 048)
    AND NOT (e.is_recurring = TRUE AND e.parent_event_id IS NULL)
    AND (
      -- Group meetings: groups I lead or belong to as a disciple
      (e.event_type = 'group_meeting' AND e.group_id IN (
        SELECT g1.id FROM dna_groups g1
        WHERE g1.leader_id IN (
          SELECT l1.id FROM dna_leaders l1 WHERE l1.email = v_email
        )
        UNION
        SELECT g2.id FROM dna_groups g2
        WHERE g2.co_leader_id IN (
          SELECT l2.id FROM dna_leaders l2 WHERE l2.email = v_email
        )
        UNION
        SELECT gd.group_id
        FROM group_disciples gd
        WHERE gd.disciple_id = v_disciple_id
          AND gd.current_status = 'active'
      ))
      OR
      -- Cohort events: cohorts I lead
      (e.event_type = 'cohort_event' AND e.cohort_id IN (
        SELECT cm.cohort_id
        FROM dna_cohort_members cm
        WHERE cm.leader_id IN (
          SELECT l3.id FROM dna_leaders l3 WHERE l3.email = v_email
        )
      ))
      OR
      -- Church events: my church (as leader or as disciple in a group)
      (e.event_type = 'church_event' AND (
        e.church_id IN (
          SELECT l4.church_id FROM dna_leaders l4 WHERE l4.email = v_email
        )
        OR
        e.church_id IN (
          SELECT g3.church_id
          FROM dna_groups g3
          JOIN group_disciples gd2 ON gd2.group_id = g3.id
          WHERE gd2.disciple_id = v_disciple_id
            AND gd2.current_status = 'active'
        )
      ))
    )
  ORDER BY e.start_time ASC;
END;
$$;

-- Token-based feed is called by the server (service role) — grant to both roles
-- so the function resolves even when called via anon key during local dev.
GRANT EXECUTE ON FUNCTION get_user_calendar_events_by_token(UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  TO anon, authenticated;

COMMENT ON FUNCTION get_user_calendar_events_by_token IS
  'Returns calendar events for the user identified by their calendar_token. '
  'Used by /api/calendar/feed to serve a subscribable ICS feed. '
  'Authenticates via stable token instead of JWT so calendar apps can poll server-to-server. '
  '(Migration 123)';
