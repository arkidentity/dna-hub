-- ============================================
-- Migration 037: RLS Policies for Disciple App Users
-- ============================================
-- Purpose: Add missing RLS policies so disciples using the Daily DNA app
--          can create their accounts and read their group data.
--
-- Root cause: Migrations 034-036 added the disciple app tables and chat but
--             didn't add SELECT policies on the pre-existing tables
--             (dna_groups, group_disciples, disciples, dna_leaders) for
--             authenticated disciple users. Without these, all Supabase
--             client-side queries return empty results due to RLS blocking.
--
-- Also fixes: No INSERT policy on disciple_app_accounts, which prevented
--             the app from creating the account record on signup.
-- ============================================

-- ============================================
-- 1. disciple_app_accounts: Allow INSERT (signup)
-- ============================================
-- Disciples need INSERT to create their account record on first login.
-- The id must match auth.uid() (enforced by the app code).
CREATE POLICY "Disciples can create own account"
ON disciple_app_accounts FOR INSERT
WITH CHECK (id = auth.uid());

-- ============================================
-- 2. dna_groups: Allow disciples to read groups they belong to
-- ============================================
CREATE POLICY "Disciples can view their groups"
ON dna_groups FOR SELECT
USING (
  id IN (
    SELECT gd.group_id
    FROM group_disciples gd
    JOIN disciples d ON gd.disciple_id = d.id
    JOIN disciple_app_accounts daa ON daa.disciple_id = d.id
    WHERE daa.id = auth.uid()
      AND gd.current_status = 'active'
  )
);

-- ============================================
-- 3. group_disciples: Allow disciples to read memberships for their groups
-- ============================================
CREATE POLICY "Disciples can view group memberships"
ON group_disciples FOR SELECT
USING (
  group_id IN (
    SELECT gd2.group_id
    FROM group_disciples gd2
    JOIN disciples d ON gd2.disciple_id = d.id
    JOIN disciple_app_accounts daa ON daa.disciple_id = d.id
    WHERE daa.id = auth.uid()
      AND gd2.current_status = 'active'
  )
);

-- ============================================
-- 4. disciples: Allow disciples to read other disciples in their groups
-- ============================================
CREATE POLICY "Disciples can view fellow group members"
ON disciples FOR SELECT
USING (
  id IN (
    SELECT gd.disciple_id
    FROM group_disciples gd
    WHERE gd.group_id IN (
      SELECT gd2.group_id
      FROM group_disciples gd2
      JOIN disciples d ON gd2.disciple_id = d.id
      JOIN disciple_app_accounts daa ON daa.disciple_id = d.id
      WHERE daa.id = auth.uid()
        AND gd2.current_status = 'active'
    )
  )
);

-- ============================================
-- 5. dna_leaders: Allow disciples to read leader names for their groups
-- ============================================
CREATE POLICY "Disciples can view their group leaders"
ON dna_leaders FOR SELECT
USING (
  id IN (
    SELECT g.leader_id FROM dna_groups g
    WHERE g.id IN (
      SELECT gd.group_id
      FROM group_disciples gd
      JOIN disciples d ON gd.disciple_id = d.id
      JOIN disciple_app_accounts daa ON daa.disciple_id = d.id
      WHERE daa.id = auth.uid()
        AND gd.current_status = 'active'
    )
    UNION
    SELECT g.co_leader_id FROM dna_groups g
    WHERE g.co_leader_id IS NOT NULL
    AND g.id IN (
      SELECT gd.group_id
      FROM group_disciples gd
      JOIN disciples d ON gd.disciple_id = d.id
      JOIN disciple_app_accounts daa ON daa.disciple_id = d.id
      WHERE daa.id = auth.uid()
        AND gd.current_status = 'active'
    )
  )
);

-- ============================================
-- 6. RPC: Link disciple account (fallback for missed triggers)
-- ============================================
-- Called from the app when an account exists but disciple_id is null.
-- Handles accounts created before the auto-link trigger was added,
-- or cases where the trigger didn't fire.
CREATE OR REPLACE FUNCTION link_disciple_account(
  p_account_id UUID,
  p_email TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Link disciple_app_accounts.disciple_id → disciples.id
  UPDATE disciple_app_accounts
  SET disciple_id = (
    SELECT id FROM disciples
    WHERE LOWER(email) = LOWER(p_email)
    LIMIT 1
  )
  WHERE id = p_account_id
    AND disciple_id IS NULL;

  -- Link disciples.app_account_id → disciple_app_accounts.id
  UPDATE disciples
  SET app_account_id = p_account_id
  WHERE LOWER(email) = LOWER(p_email)
    AND app_account_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION link_disciple_account TO authenticated;

-- ============================================
-- END OF MIGRATION 037
-- ============================================
-- After running this migration, disciples who sign up on the Daily DNA app
-- will be able to:
--   1. Create their disciple_app_accounts record (INSERT)
--   2. See groups they belong to (SELECT on dna_groups, group_disciples)
--   3. See other group members (SELECT on disciples)
--   4. See leader names (SELECT on dna_leaders)
--   5. Send and read group chat messages (already covered by migration 035)
--   6. Auto-link existing accounts that missed the trigger (via RPC)
