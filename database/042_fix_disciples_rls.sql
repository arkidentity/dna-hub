-- ============================================
-- Migration 042: Simplify disciples + app accounts RLS policies
-- ============================================
-- The policies from migration 040 still use subqueries that read from
-- RLS-protected tables (group_disciples, disciples, dna_leaders, dna_groups).
-- Even though get_my_group_ids() bypasses RLS internally, the subqueries
-- in the POLICY USING clauses are evaluated under the caller's RLS context,
-- causing cascading RLS evaluation that silently filters out rows.
--
-- Fix: Add more SECURITY DEFINER helpers so ALL cross-table lookups
-- bypass RLS. Policies become simple array membership checks.
-- ============================================

-- ============================================
-- 1. Helper: get_my_group_disciple_ids()
-- ============================================
-- Returns disciple IDs for all active members in the current user's groups.
CREATE OR REPLACE FUNCTION get_my_group_disciple_ids()
RETURNS UUID[] AS $$
DECLARE
  v_group_ids UUID[];
  v_disciple_ids UUID[];
BEGIN
  v_group_ids := get_my_group_ids();

  IF v_group_ids IS NULL OR array_length(v_group_ids, 1) IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  SELECT ARRAY_AGG(DISTINCT disciple_id) INTO v_disciple_ids
  FROM group_disciples
  WHERE group_id = ANY(v_group_ids)
    AND current_status = 'active';

  RETURN COALESCE(v_disciple_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_my_group_disciple_ids TO authenticated;

-- ============================================
-- 2. Helper: get_my_group_member_account_ids()
-- ============================================
-- Returns disciple_app_accounts IDs for all visible members:
--   - Fellow disciples' app accounts (via app_account_id)
--   - Leader/co-leader app accounts (via email match)
--   - Own account
CREATE OR REPLACE FUNCTION get_my_group_member_account_ids()
RETURNS UUID[] AS $$
DECLARE
  v_group_ids UUID[];
  v_account_ids UUID[];
BEGIN
  v_group_ids := get_my_group_ids();

  IF v_group_ids IS NULL OR array_length(v_group_ids, 1) IS NULL THEN
    -- Still include own account
    RETURN ARRAY[auth.uid()];
  END IF;

  SELECT ARRAY_AGG(DISTINCT account_id) INTO v_account_ids
  FROM (
    -- Fellow disciples' app accounts
    SELECT d.app_account_id AS account_id
    FROM disciples d
    JOIN group_disciples gd ON gd.disciple_id = d.id
    WHERE gd.group_id = ANY(v_group_ids)
      AND gd.current_status = 'active'
      AND d.app_account_id IS NOT NULL

    UNION

    -- Leader/co-leader app accounts (by email)
    SELECT daa.id AS account_id
    FROM disciple_app_accounts daa
    JOIN dna_leaders dl ON LOWER(dl.email) = LOWER(daa.email)
    JOIN dna_groups g ON (g.leader_id = dl.id OR g.co_leader_id = dl.id)
    WHERE g.id = ANY(v_group_ids)

    UNION

    -- Always include own account
    SELECT auth.uid() AS account_id
  ) sub
  WHERE account_id IS NOT NULL;

  RETURN COALESCE(v_account_ids, ARRAY[auth.uid()]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_my_group_member_account_ids TO authenticated;

-- ============================================
-- 3. Helper: get_my_group_leader_ids()
-- ============================================
-- Returns dna_leaders IDs for leaders of the current user's groups.
CREATE OR REPLACE FUNCTION get_my_group_leader_ids()
RETURNS UUID[] AS $$
DECLARE
  v_group_ids UUID[];
  v_leader_ids UUID[];
BEGIN
  v_group_ids := get_my_group_ids();

  IF v_group_ids IS NULL OR array_length(v_group_ids, 1) IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  SELECT ARRAY_AGG(DISTINCT leader_id) INTO v_leader_ids
  FROM (
    SELECT leader_id FROM dna_groups WHERE id = ANY(v_group_ids) AND leader_id IS NOT NULL
    UNION
    SELECT co_leader_id FROM dna_groups WHERE id = ANY(v_group_ids) AND co_leader_id IS NOT NULL
  ) sub;

  RETURN COALESCE(v_leader_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_my_group_leader_ids TO authenticated;

-- ============================================
-- 4. Drop old policies and recreate with helpers
-- ============================================

-- disciples: use get_my_group_disciple_ids()
DROP POLICY IF EXISTS "Disciples can view fellow group members" ON disciples;
CREATE POLICY "Disciples can view fellow group members"
ON disciples FOR SELECT
USING (id = ANY(get_my_group_disciple_ids()));

-- disciple_app_accounts: use get_my_group_member_account_ids()
DROP POLICY IF EXISTS "Disciples can view group members app accounts" ON disciple_app_accounts;
CREATE POLICY "Disciples can view group members app accounts"
ON disciple_app_accounts FOR SELECT
USING (id = ANY(get_my_group_member_account_ids()));

-- dna_leaders: use get_my_group_leader_ids()
DROP POLICY IF EXISTS "Disciples can view their group leaders" ON dna_leaders;
CREATE POLICY "Disciples can view their group leaders"
ON dna_leaders FOR SELECT
USING (id = ANY(get_my_group_leader_ids()));

-- ============================================
-- END OF MIGRATION 042
-- ============================================
-- After running this:
--   - ALL RLS policies use SECURITY DEFINER helpers (no cross-table subqueries)
--   - disciples, disciple_app_accounts, dna_leaders policies are all simple
--     array membership checks that can't be blocked by cascading RLS
--   - Group members (including leaders) should all be visible in the chat
