-- Migration 064: Fix update_disciple_progress and calculate_disciple_streak
--
-- Fixes:
-- 1. total_time_minutes was never written (always 0) — now sums prayer session duration
-- 2. calculate_disciple_streak only checked journal entries — now also counts prayer sessions
--    so disciples who pray but haven't journaled that day still maintain their streak

-- ============================================
-- 1. Fix streak calculation to include prayer sessions
-- ============================================

CREATE OR REPLACE FUNCTION calculate_disciple_streak(p_account_id UUID, p_timezone TEXT DEFAULT 'UTC')
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE;
  v_has_activity BOOLEAN;
BEGIN
  -- Get today's date in user's timezone
  v_check_date := (NOW() AT TIME ZONE p_timezone)::DATE;

  -- Check for activity today (journal entry OR prayer session)
  SELECT EXISTS (
    SELECT 1 FROM disciple_journal_entries
    WHERE account_id = p_account_id
      AND deleted_at IS NULL
      AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
    UNION ALL
    SELECT 1 FROM disciple_prayer_sessions
    WHERE account_id = p_account_id
      AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
  ) INTO v_has_activity;

  IF NOT v_has_activity THEN
    -- Check for activity yesterday (grace day)
    v_check_date := v_check_date - INTERVAL '1 day';
    SELECT EXISTS (
      SELECT 1 FROM disciple_journal_entries
      WHERE account_id = p_account_id
        AND deleted_at IS NULL
        AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
      UNION ALL
      SELECT 1 FROM disciple_prayer_sessions
      WHERE account_id = p_account_id
        AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
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
        AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
      UNION ALL
      SELECT 1 FROM disciple_prayer_sessions
      WHERE account_id = p_account_id
        AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
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

GRANT EXECUTE ON FUNCTION calculate_disciple_streak TO authenticated;

-- ============================================
-- 2. Fix update_disciple_progress to write total_time_minutes
-- ============================================

CREATE OR REPLACE FUNCTION update_disciple_progress(p_account_id UUID)
RETURNS VOID AS $$
DECLARE
  v_timezone TEXT;
  v_streak INTEGER;
  v_journal_count INTEGER;
  v_prayer_count INTEGER;
  v_prayer_card_count INTEGER;
  v_time_minutes INTEGER;
BEGIN
  -- Get user's timezone
  SELECT COALESCE(timezone, 'UTC') INTO v_timezone
  FROM disciple_app_accounts WHERE id = p_account_id;

  -- Calculate streak (now includes prayer sessions)
  v_streak := calculate_disciple_streak(p_account_id, v_timezone);

  -- Count totals
  SELECT COUNT(*) INTO v_journal_count
  FROM disciple_journal_entries
  WHERE account_id = p_account_id AND deleted_at IS NULL;

  SELECT COUNT(*) INTO v_prayer_count
  FROM disciple_prayer_sessions
  WHERE account_id = p_account_id;

  SELECT COUNT(*) INTO v_prayer_card_count
  FROM disciple_prayer_cards
  WHERE account_id = p_account_id AND deleted_at IS NULL;

  -- Sum total prayer time in minutes
  SELECT COALESCE(SUM(duration_minutes), 0) INTO v_time_minutes
  FROM disciple_prayer_sessions
  WHERE account_id = p_account_id;

  -- Upsert progress row
  INSERT INTO disciple_progress (
    account_id, current_streak, longest_streak, last_activity_date,
    total_journal_entries, total_prayer_sessions, total_prayer_cards, total_time_minutes
  )
  VALUES (
    p_account_id, v_streak, v_streak, (NOW() AT TIME ZONE v_timezone)::DATE,
    v_journal_count, v_prayer_count, v_prayer_card_count, v_time_minutes
  )
  ON CONFLICT (account_id)
  DO UPDATE SET
    current_streak = v_streak,
    longest_streak = GREATEST(disciple_progress.longest_streak, v_streak),
    last_activity_date = (NOW() AT TIME ZONE v_timezone)::DATE,
    total_journal_entries = v_journal_count,
    total_prayer_sessions = v_prayer_count,
    total_prayer_cards = v_prayer_card_count,
    total_time_minutes = v_time_minutes,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_disciple_progress TO authenticated;
