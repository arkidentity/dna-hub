-- Migration 117: Streak 3am day boundary
--
-- Changes the streak calculation so the "day" resets at 3am local time
-- instead of midnight. Night owls journaling at 1am still get credit for
-- the previous calendar day.
--
-- Approach: subtract 3 hours from timestamps before casting to DATE.

CREATE OR REPLACE FUNCTION calculate_disciple_streak(p_account_id UUID, p_timezone TEXT DEFAULT 'UTC')
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE;
  v_has_activity BOOLEAN;
BEGIN
  -- Get today's "streak day" in user's timezone (3am boundary = subtract 3 hours)
  v_check_date := ((NOW() AT TIME ZONE p_timezone) - INTERVAL '3 hours')::DATE;

  -- Check for activity today (journal entry OR prayer session)
  -- Subtract 3 hours from created_at so entries before 3am count as previous day
  SELECT EXISTS (
    SELECT 1 FROM disciple_journal_entries
    WHERE account_id = p_account_id
      AND deleted_at IS NULL
      AND ((created_at AT TIME ZONE p_timezone) - INTERVAL '3 hours')::DATE = v_check_date
    UNION ALL
    SELECT 1 FROM disciple_prayer_sessions
    WHERE account_id = p_account_id
      AND ((created_at AT TIME ZONE p_timezone) - INTERVAL '3 hours')::DATE = v_check_date
  ) INTO v_has_activity;

  IF NOT v_has_activity THEN
    -- Check for activity yesterday (grace day)
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
    ) INTO v_has_activity;

    IF NOT v_has_activity THEN
      -- No activity today or yesterday, streak is 0
      RETURN 0;
    END IF;
  END IF;

  -- Count consecutive days with activity
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
    ) INTO v_has_activity;

    IF v_has_activity THEN
      v_streak := v_streak + 1;
      v_check_date := v_check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;

    -- Safety limit
    IF v_streak > 1000 THEN EXIT; END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant after DROP+CREATE
GRANT EXECUTE ON FUNCTION calculate_disciple_streak(UUID, TEXT) TO anon, authenticated;
