-- ============================================
-- Migration 040: Fix RLS Circular Dependencies
-- ============================================
-- ROOT CAUSE: All RLS policies for disciple-app users use subqueries that
-- join across RLS-protected tables (group_disciples ↔ disciples ↔
-- disciple_app_accounts). PostgreSQL applies RLS to tables referenced
-- inside policy subqueries too, creating circular dependencies:
--
--   group_disciples policy → FROM group_disciples (SELF-REFERENCE!)
--   group_disciples policy → JOIN disciple_app_accounts (which has RLS)
--   disciple_app_accounts policy (039) → JOIN group_disciples (MUTUAL RECURSION)
--
-- PostgreSQL either raises "infinite recursion detected" errors or returns
-- empty result sets. The app sees "No groups yet" even though the data exists.
--
-- FIX: Create a single SECURITY DEFINER helper function that returns the
-- authenticated user's group IDs. Because it's SECURITY DEFINER, it runs
-- as the function owner (postgres) and bypasses RLS entirely — breaking
-- the circular chain. All policies then call this function instead of
-- doing cross-table joins.
-- ============================================

-- ============================================
-- 1. SECURITY DEFINER helper: get_my_group_ids()
-- ============================================
-- Returns an array of group_ids for the currently authenticated user.
-- Bypasses RLS because it runs as the function owner.
CREATE OR REPLACE FUNCTION get_my_group_ids()
RETURNS UUID[] AS $$
DECLARE
  v_disciple_id UUID;
  v_group_ids UUID[];
BEGIN
  -- Get the disciple_id linked to this auth user
  SELECT disciple_id INTO v_disciple_id
  FROM disciple_app_accounts
  WHERE id = auth.uid();

  IF v_disciple_id IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  -- Get all active group memberships
  SELECT ARRAY_AGG(group_id) INTO v_group_ids
  FROM group_disciples
  WHERE disciple_id = v_disciple_id
    AND current_status = 'active';

  RETURN COALESCE(v_group_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_my_group_ids TO authenticated;

-- ============================================
-- 2. Drop ALL old problematic policies
-- ============================================

-- From migration 037:
DROP POLICY IF EXISTS "Disciples can view their groups" ON dna_groups;
DROP POLICY IF EXISTS "Disciples can view group memberships" ON group_disciples;
DROP POLICY IF EXISTS "Disciples can view fellow group members" ON disciples;
DROP POLICY IF EXISTS "Disciples can view their group leaders" ON dna_leaders;

-- From migration 039:
DROP POLICY IF EXISTS "Disciples can view group members app accounts" ON disciple_app_accounts;

-- From migration 035 (group_messages also has the same cross-table joins):
DROP POLICY IF EXISTS "Members can view group messages" ON group_messages;
DROP POLICY IF EXISTS "Members can send messages" ON group_messages;

-- ============================================
-- 3. Recreate ALL policies using the helper function
-- ============================================

-- dna_groups: disciples can see groups they belong to
CREATE POLICY "Disciples can view their groups"
ON dna_groups FOR SELECT
USING (id = ANY(get_my_group_ids()));

-- group_disciples: disciples can see memberships in their groups
CREATE POLICY "Disciples can view group memberships"
ON group_disciples FOR SELECT
USING (group_id = ANY(get_my_group_ids()));

-- disciples: disciples can see other disciples in their groups
CREATE POLICY "Disciples can view fellow group members"
ON disciples FOR SELECT
USING (
  id IN (
    SELECT gd.disciple_id
    FROM group_disciples gd
    WHERE gd.group_id = ANY(get_my_group_ids())
  )
);

-- dna_leaders: disciples can see leaders of their groups
CREATE POLICY "Disciples can view their group leaders"
ON dna_leaders FOR SELECT
USING (
  id IN (
    SELECT g.leader_id FROM dna_groups g WHERE g.id = ANY(get_my_group_ids())
    UNION
    SELECT g.co_leader_id FROM dna_groups g WHERE g.co_leader_id IS NOT NULL AND g.id = ANY(get_my_group_ids())
  )
);

-- disciple_app_accounts: disciples can see group members' app accounts
-- (for display_name and avatar_url in the chat member list)
CREATE POLICY "Disciples can view group members app accounts"
ON disciple_app_accounts FOR SELECT
USING (
  id = auth.uid()
  OR id IN (
    SELECT d.app_account_id
    FROM disciples d
    JOIN group_disciples gd ON gd.disciple_id = d.id
    WHERE d.app_account_id IS NOT NULL
      AND gd.group_id = ANY(get_my_group_ids())
  )
);

-- group_messages: members can read messages in their groups
CREATE POLICY "Members can view group messages"
ON group_messages FOR SELECT
USING (group_id = ANY(get_my_group_ids()));

-- group_messages: members can send messages to their groups
CREATE POLICY "Members can send messages"
ON group_messages FOR INSERT
WITH CHECK (
  sender_account_id = auth.uid()
  AND group_id = ANY(get_my_group_ids())
);

-- ============================================
-- END OF MIGRATION 040
-- ============================================
-- After running this migration:
--   1. All circular RLS dependencies are eliminated
--   2. get_my_group_ids() is the single source of truth for membership checks
--   3. All policies are simple: "is this row's group_id in my groups?"
--   4. Group chat will load correctly for linked disciples
--
-- NOTE: The existing policies from migration 034 are still intact:
--   - "Disciples can view own account" (SELECT on disciple_app_accounts)
--   - "Disciples can update own account" (UPDATE on disciple_app_accounts)
--   - "Disciples can create own account" (INSERT, from 037)
--   - "Senders can update own messages" (UPDATE on group_messages)
--   - "Users manage own read receipts" (ALL on group_message_reads)
-- These don't have circular dependencies and remain unchanged.
