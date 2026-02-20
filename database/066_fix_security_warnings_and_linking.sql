-- Migration 066: Fix security warnings + robust disciple linking
--
-- 1. Fix missing SET search_path on functions from migrations 064 and 065
-- 2. Replace the fragile trigger-based linking with a more robust approach:
--    a single helper function that does a direct email lookup in the disciples query itself
-- 3. Add diagnostic view to see link status

-- ============================================
-- 1. Fix calculate_disciple_streak (add SET search_path)
-- ============================================

CREATE OR REPLACE FUNCTION calculate_disciple_streak(p_account_id UUID, p_timezone TEXT DEFAULT 'UTC')
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE;
  v_has_activity BOOLEAN;
BEGIN
  v_check_date := (NOW() AT TIME ZONE p_timezone)::DATE;

  SELECT EXISTS (
    SELECT 1 FROM disciple_journal_entries
    WHERE account_id = p_account_id AND deleted_at IS NULL
      AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
    UNION ALL
    SELECT 1 FROM disciple_prayer_sessions
    WHERE account_id = p_account_id
      AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
  ) INTO v_has_activity;

  IF NOT v_has_activity THEN
    v_check_date := v_check_date - INTERVAL '1 day';
    SELECT EXISTS (
      SELECT 1 FROM disciple_journal_entries
      WHERE account_id = p_account_id AND deleted_at IS NULL
        AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
      UNION ALL
      SELECT 1 FROM disciple_prayer_sessions
      WHERE account_id = p_account_id
        AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
    ) INTO v_has_activity;
    IF NOT v_has_activity THEN RETURN 0; END IF;
  END IF;

  LOOP
    SELECT EXISTS (
      SELECT 1 FROM disciple_journal_entries
      WHERE account_id = p_account_id AND deleted_at IS NULL
        AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
      UNION ALL
      SELECT 1 FROM disciple_prayer_sessions
      WHERE account_id = p_account_id
        AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
    ) INTO v_has_activity;
    IF v_has_activity THEN
      v_streak := v_streak + 1;
      v_check_date := v_check_date - INTERVAL '1 day';
    ELSE EXIT;
    END IF;
    IF v_streak > 1000 THEN EXIT; END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

GRANT EXECUTE ON FUNCTION calculate_disciple_streak TO authenticated;

-- ============================================
-- 2. Fix update_disciple_progress (add SET search_path)
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
  SELECT COALESCE(timezone, 'UTC') INTO v_timezone
  FROM disciple_app_accounts WHERE id = p_account_id;

  v_streak := calculate_disciple_streak(p_account_id, v_timezone);

  SELECT COUNT(*) INTO v_journal_count
  FROM disciple_journal_entries
  WHERE account_id = p_account_id AND deleted_at IS NULL;

  SELECT COUNT(*) INTO v_prayer_count
  FROM disciple_prayer_sessions WHERE account_id = p_account_id;

  SELECT COUNT(*) INTO v_prayer_card_count
  FROM disciple_prayer_cards WHERE account_id = p_account_id AND deleted_at IS NULL;

  SELECT COALESCE(SUM(duration_minutes), 0) INTO v_time_minutes
  FROM disciple_prayer_sessions WHERE account_id = p_account_id;

  INSERT INTO disciple_progress (
    account_id, current_streak, longest_streak, last_activity_date,
    total_journal_entries, total_prayer_sessions, total_prayer_cards, total_time_minutes
  )
  VALUES (
    p_account_id, v_streak, v_streak, (NOW() AT TIME ZONE v_timezone)::DATE,
    v_journal_count, v_prayer_count, v_prayer_card_count, v_time_minutes
  )
  ON CONFLICT (account_id) DO UPDATE SET
    current_streak = v_streak,
    longest_streak = GREATEST(disciple_progress.longest_streak, v_streak),
    last_activity_date = (NOW() AT TIME ZONE v_timezone)::DATE,
    total_journal_entries = v_journal_count,
    total_prayer_sessions = v_prayer_count,
    total_prayer_cards = v_prayer_card_count,
    total_time_minutes = v_time_minutes,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

GRANT EXECUTE ON FUNCTION update_disciple_progress TO authenticated;

-- ============================================
-- 3. Fix auto_link_from_disciples (add SET search_path)
-- ============================================

CREATE OR REPLACE FUNCTION auto_link_from_disciples()
RETURNS TRIGGER AS $$
DECLARE
  v_app_account_id UUID;
BEGIN
  IF NEW.email IS NULL OR NEW.app_account_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Find matching disciple_app_accounts row by email
  SELECT id INTO v_app_account_id
  FROM disciple_app_accounts
  WHERE LOWER(email) = LOWER(NEW.email)
  LIMIT 1;

  IF v_app_account_id IS NOT NULL THEN
    -- Update disciples.app_account_id
    UPDATE disciples
    SET app_account_id = v_app_account_id
    WHERE id = NEW.id AND app_account_id IS NULL;

    -- Update disciple_app_accounts.disciple_id
    UPDATE disciple_app_accounts
    SET disciple_id = NEW.id
    WHERE id = v_app_account_id AND disciple_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

GRANT EXECUTE ON FUNCTION auto_link_from_disciples TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_auto_link_from_disciples ON disciples;
CREATE TRIGGER trg_auto_link_from_disciples
  AFTER INSERT OR UPDATE OF email ON disciples
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_from_disciples();

-- ============================================
-- 4. Fix auto_link_disciple_app_account (add SET search_path to original)
-- ============================================

CREATE OR REPLACE FUNCTION auto_link_disciple_app_account()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE disciples
  SET app_account_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)
    AND app_account_id IS NULL;

  UPDATE disciple_app_accounts
  SET disciple_id = (
    SELECT id FROM disciples
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1
  )
  WHERE id = NEW.id AND disciple_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- ============================================
-- 5. Re-run backfill (in case emails were fixed since 065 ran)
-- ============================================

UPDATE disciples d
SET app_account_id = daa.id
FROM disciple_app_accounts daa
WHERE LOWER(d.email) = LOWER(daa.email)
  AND d.app_account_id IS NULL
  AND d.email IS NOT NULL;

UPDATE disciple_app_accounts daa
SET disciple_id = d.id
FROM disciples d
WHERE LOWER(daa.email) = LOWER(d.email)
  AND daa.disciple_id IS NULL
  AND daa.email IS NOT NULL;

-- ============================================
-- 6. Diagnostic: show current link status
-- Run this SELECT after applying to verify:
-- SELECT * FROM disciple_link_status;
-- ============================================

CREATE OR REPLACE VIEW disciple_link_status AS
SELECT
  d.id AS disciple_id,
  d.name,
  d.email AS disciple_email,
  d.app_account_id,
  daa.id AS app_account_id_in_daa,
  daa.email AS app_account_email,
  CASE
    WHEN d.app_account_id IS NOT NULL THEN 'linked'
    WHEN daa.id IS NOT NULL THEN 'app_account_exists_but_not_linked'
    ELSE 'no_app_account'
  END AS link_status,
  (SELECT COUNT(*) FROM life_assessment_responses lar WHERE lar.account_id = d.app_account_id) AS assessment_count
FROM disciples d
LEFT JOIN disciple_app_accounts daa ON LOWER(daa.email) = LOWER(d.email)
ORDER BY link_status, d.name;
