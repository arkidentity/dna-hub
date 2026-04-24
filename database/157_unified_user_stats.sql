-- ============================================================
-- Migration 157: get_user_stats — single source of truth for
-- disciple engagement stats across Hub + Daily DNA.
--
-- Returns per-account:
--   * current_streak, longest_streak, last_activity_date
--       (from disciple_progress — maintained by update_disciple_progress)
--   * journal_count    — live COUNT from disciple_journal_entries
--   * prayer_count     — live COUNT from disciple_prayer_cards (active)
--   * testimony_count  — live COUNT from disciple_testimonies (complete)
--   * prayer_sessions_count — cached from disciple_progress
--   * cards_mastered_count  — cached from disciple_creed_progress (array length)
--
-- Replaces piecemeal reads in:
--   - Daily DNA profile drawer (direct disciple_progress query)
--   - Daily DNA members/circles drawers (get_member_stats)
--   - Hub /api/groups/[id] batch disciple list
--   - Hub /api/groups/[id]/disciples/[discipleId] detail
--   - Hub /api/admin/disciples (church view)
--   - Hub /api/admin/disciples/network (all disciples)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_stats(
  p_account_ids UUID[]
) RETURNS TABLE(
  account_id         UUID,
  current_streak     INTEGER,
  longest_streak     INTEGER,
  last_activity_date DATE,
  journal_count          BIGINT,
  prayer_count           BIGINT,
  testimony_count        BIGINT,
  prayer_sessions_count  INTEGER,
  cards_mastered_count   INTEGER
) LANGUAGE sql SECURITY DEFINER AS $fn_get_user_stats$
  SELECT
    a.id AS account_id,
    COALESCE(dp.current_streak, 0)  AS current_streak,
    COALESCE(dp.longest_streak, 0)  AS longest_streak,
    dp.last_activity_date           AS last_activity_date,
    COALESCE((
      SELECT COUNT(*) FROM disciple_journal_entries j
      WHERE j.account_id = a.id AND j.deleted_at IS NULL
    ), 0) AS journal_count,
    COALESCE((
      SELECT COUNT(*) FROM disciple_prayer_cards p
      WHERE p.account_id = a.id AND p.deleted_at IS NULL AND p.status = 'active'
    ), 0) AS prayer_count,
    COALESCE((
      SELECT COUNT(*) FROM disciple_testimonies t
      WHERE t.account_id = a.id AND t.deleted_at IS NULL AND t.status = 'complete'
    ), 0) AS testimony_count,
    COALESCE(dp.total_prayer_sessions, 0)          AS prayer_sessions_count,
    COALESCE(array_length(dcp.cards_mastered, 1), 0) AS cards_mastered_count
  FROM unnest(p_account_ids) AS arr(id)
  JOIN disciple_app_accounts a ON a.id = arr.id
  LEFT JOIN disciple_progress dp ON dp.account_id = a.id
  LEFT JOIN disciple_creed_progress dcp ON dcp.account_id = a.id;
$fn_get_user_stats$;

GRANT EXECUTE ON FUNCTION get_user_stats(UUID[]) TO authenticated, anon;
