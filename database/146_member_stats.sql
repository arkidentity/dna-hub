-- ============================================================
-- Migration 146: get_member_stats RPC
-- Returns per-account counts for groups & circles members drawer:
--   * journal entries (all-time, not deleted)
--   * active prayer cards (status=active, not deleted)
--   * completed testimonies (status=complete, not deleted)
-- ============================================================

CREATE OR REPLACE FUNCTION get_member_stats(
  p_account_ids UUID[]
) RETURNS TABLE(
  account_id       UUID,
  journal_count    BIGINT,
  prayer_count     BIGINT,
  testimony_count  BIGINT
) LANGUAGE sql SECURITY DEFINER AS $fn_get_member_stats$
  SELECT
    a.id AS account_id,
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
    ), 0) AS testimony_count
  FROM unnest(p_account_ids) AS arr(id)
  JOIN disciple_app_accounts a ON a.id = arr.id;
$fn_get_member_stats$;

GRANT EXECUTE ON FUNCTION get_member_stats(UUID[]) TO authenticated;
