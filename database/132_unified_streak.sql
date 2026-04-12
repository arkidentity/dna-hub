-- Migration 132: Unified Streak — Activity Log + Expanded Streak Calculation
--
-- Problem: The streak only counted journal entries and prayer sessions (both
-- stored as per-session DB records). Creed card visits, pathway checkpoints,
-- and other engagement had no cloud record, so they couldn't build the streak.
--
-- Solution:
--   1. New `disciple_activity_log` table — lightweight per-day activity marker
--      that any feature can insert into (creed cards, pathway, etc.)
--   2. `log_disciple_activity` RPC — upserts one row per account+date+type
--   3. Updated `calculate_disciple_streak` — now also checks activity_log
--   4. No changes needed to `update_disciple_progress` — it already calls
--      calculate_disciple_streak which will pick up the new table automatically

-- ============================================
-- 1. ACTIVITY LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS disciple_activity_log (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id   UUID    NOT NULL REFERENCES disciple_app_accounts(id) ON DELETE CASCADE,
  activity_type TEXT   NOT NULL, -- 'creed_cards', 'pathway', 'journal', 'prayer', etc.
  activity_date DATE   NOT NULL, -- 3am-boundary date (computed by the RPC on insert)
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT disciple_activity_log_unique UNIQUE (account_id, activity_date, activity_type)
);

CREATE INDEX IF NOT EXISTS idx_activity_log_account_date
  ON disciple_activity_log (account_id, activity_date);

-- ============================================
-- 2. RLS
-- ============================================

ALTER TABLE disciple_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own activity"
  ON disciple_activity_log FOR INSERT TO authenticated
  WITH CHECK (account_id = auth.uid());

CREATE POLICY "Users can select own activity"
  ON disciple_activity_log FOR SELECT TO authenticated
  USING (account_id = auth.uid());

-- ============================================
-- 3. log_disciple_activity RPC
-- ============================================

CREATE OR REPLACE FUNCTION log_disciple_activity(
  p_account_id   UUID,
  p_activity_type TEXT,
  p_timezone     TEXT DEFAULT 'UTC'
)
RETURNS VOID AS $$
DECLARE
  v_activity_date DATE;
BEGIN
  -- Apply the same 3am boundary as calculate_disciple_streak
  v_activity_date := ((NOW() AT TIME ZONE p_timezone) - INTERVAL '3 hours')::DATE;

  INSERT INTO disciple_activity_log (account_id, activity_type, activity_date)
  VALUES (p_account_id, p_activity_type, v_activity_date)
  ON CONFLICT (account_id, activity_date, activity_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_disciple_activity(UUID, TEXT, TEXT) TO authenticated;

-- ============================================
-- 4. Updated calculate_disciple_streak
--    Now checks: journal entries + prayer sessions + activity_log
-- ============================================

CREATE OR REPLACE FUNCTION calculate_disciple_streak(
  p_account_id UUID,
  p_timezone   TEXT DEFAULT 'UTC'
)
RETURNS INTEGER AS $$
DECLARE
  v_streak      INTEGER := 0;
  v_check_date  DATE;
  v_has_activity BOOLEAN;
BEGIN
  -- Get today's "streak day" in user's timezone (3am boundary = subtract 3 hours)
  v_check_date := ((NOW() AT TIME ZONE p_timezone) - INTERVAL '3 hours')::DATE;

  -- ── Helper: does this account have ANY activity on v_check_date? ──────────
  -- Checks journal entries, prayer sessions, AND the generic activity log.

  SELECT EXISTS (
    SELECT 1 FROM disciple_journal_entries
    WHERE account_id = p_account_id
      AND deleted_at IS NULL
      AND ((created_at AT TIME ZONE p_timezone) - INTERVAL '3 hours')::DATE = v_check_date
    UNION ALL
    SELECT 1 FROM disciple_prayer_sessions
    WHERE account_id = p_account_id
      AND ((created_at AT TIME ZONE p_timezone) - INTERVAL '3 hours')::DATE = v_check_date
    UNION ALL
    SELECT 1 FROM disciple_activity_log
    WHERE account_id = p_account_id
      AND activity_date = v_check_date
  ) INTO v_has_activity;

  IF NOT v_has_activity THEN
    -- Check yesterday (grace day — same logic as before)
    v_check_date := v_check_date - INTERVAL '1 day';

    SELECT EXISTS (
      SELECT 1 FROM disciple_journal_entries
      WHERE account_id = p_account_id
        AND deleted_at IS NULL
        AND ((created_at AT TIME ZONE p_timezone) - INTERVAL '3 hours')::DATE = v_check_date
      UNION ALL
      SELECT 1 FROM disciple_prayer_sessions
      WHERE account_id = p_account_id
        AND ((created_at AT TIME ZONE p_timezone) - INTERVAL '3 hours')::DATE = v_check_date
      UNION ALL
      SELECT 1 FROM disciple_activity_log
      WHERE account_id = p_account_id
        AND activity_date = v_check_date
    ) INTO v_has_activity;

    IF NOT v_has_activity THEN
      RETURN 0;
    END IF;
  END IF;

  -- Count consecutive days backward
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM disciple_journal_entries
      WHERE account_id = p_account_id
        AND deleted_at IS NULL
        AND ((created_at AT TIME ZONE p_timezone) - INTERVAL '3 hours')::DATE = v_check_date
      UNION ALL
      SELECT 1 FROM disciple_prayer_sessions
      WHERE account_id = p_account_id
        AND ((created_at AT TIME ZONE p_timezone) - INTERVAL '3 hours')::DATE = v_check_date
      UNION ALL
      SELECT 1 FROM disciple_activity_log
      WHERE account_id = p_account_id
        AND activity_date = v_check_date
    ) INTO v_has_activity;

    IF v_has_activity THEN
      v_streak     := v_streak + 1;
      v_check_date := v_check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;

    IF v_streak > 1000 THEN EXIT; END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant after DROP+CREATE
GRANT EXECUTE ON FUNCTION calculate_disciple_streak(UUID, TEXT) TO anon, authenticated;
