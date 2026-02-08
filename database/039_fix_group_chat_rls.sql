-- ============================================
-- Migration 039: Fix Group Chat RLS + Cross-Member Visibility
-- ============================================
-- Purpose: Fix two issues preventing group chat from working in the Daily DNA app:
--
--   1. MISSING CROSS-MEMBER SELECT on disciple_app_accounts:
--      The only SELECT policy allows `id = auth.uid()` (own record only).
--      But getGroupMembers() does a nested join:
--        group_disciples -> disciples -> disciple_app_accounts
--      to read display_name + avatar_url for ALL group members.
--      Without a cross-member policy, only the current user's sub-object
--      returns data; everyone else shows as "Unknown" with no avatar.
--
--   2. ENSURE link_disciple_account RPC re-fetches after linking:
--      The ensureDiscipleAccount() function calls the RPC but then returns
--      the ORIGINAL record (with disciple_id still null). The app proceeds
--      to getUserGroups() which sees null and returns [].
--      Fix: make the RPC return the linked disciple_id so the app can use it.
--
-- Also includes the retroactive linking from migration 038 (safe to re-run).
-- ============================================

-- ============================================
-- 1. Cross-member SELECT on disciple_app_accounts
-- ============================================
-- Allow authenticated users to read disciple_app_accounts rows
-- for other users who are in the same DNA group.
-- Only exposes: id, display_name, avatar_url (via the app's select clause).
CREATE POLICY "Disciples can view group members app accounts"
ON disciple_app_accounts FOR SELECT
USING (
  -- Always allow reading own record (redundant with existing policy but
  -- keeps this policy self-contained and avoids relying on policy ordering)
  id = auth.uid()
  OR
  -- Allow reading accounts of disciples who share a group with you
  id IN (
    SELECT d.app_account_id
    FROM disciples d
    JOIN group_disciples gd ON gd.disciple_id = d.id
    WHERE d.app_account_id IS NOT NULL
      AND gd.current_status = 'active'
      AND gd.group_id IN (
        -- Groups the current user belongs to
        SELECT gd2.group_id
        FROM group_disciples gd2
        JOIN disciples d2 ON gd2.disciple_id = d2.id
        JOIN disciple_app_accounts daa2 ON daa2.disciple_id = d2.id
        WHERE daa2.id = auth.uid()
          AND gd2.current_status = 'active'
      )
  )
);

-- ============================================
-- 2. Replace link_disciple_account RPC to return the linked disciple_id
-- ============================================
-- The original version returns VOID. The app calls it but has no way to know
-- if linking succeeded. We change it to return the disciple_id (or NULL),
-- so the app can immediately use it without a separate re-fetch.
-- Must DROP first because PostgreSQL cannot change return type in-place.
DROP FUNCTION IF EXISTS link_disciple_account(UUID, TEXT);

CREATE OR REPLACE FUNCTION link_disciple_account(
  p_account_id UUID,
  p_email TEXT
)
RETURNS UUID AS $$
DECLARE
  v_disciple_id UUID;
BEGIN
  -- Find matching disciple by email
  SELECT id INTO v_disciple_id
  FROM disciples
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;

  IF v_disciple_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Link disciple_app_accounts.disciple_id -> disciples.id
  UPDATE disciple_app_accounts
  SET disciple_id = v_disciple_id
  WHERE id = p_account_id
    AND disciple_id IS NULL;

  -- Link disciples.app_account_id -> disciple_app_accounts.id
  UPDATE disciples
  SET app_account_id = p_account_id
  WHERE id = v_disciple_id
    AND app_account_id IS NULL;

  RETURN v_disciple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the function is accessible to authenticated users
GRANT EXECUTE ON FUNCTION link_disciple_account TO authenticated;

-- ============================================
-- 3. Retroactive linking (from migration 038, safe to re-run)
-- ============================================
-- Link disciples.app_account_id -> disciple_app_accounts.id
UPDATE disciples d
SET app_account_id = daa.id
FROM disciple_app_accounts daa
WHERE LOWER(d.email) = LOWER(daa.email)
  AND d.app_account_id IS NULL;

-- Link disciple_app_accounts.disciple_id -> disciples.id
UPDATE disciple_app_accounts daa
SET disciple_id = d.id
FROM disciples d
WHERE LOWER(daa.email) = LOWER(d.email)
  AND daa.disciple_id IS NULL;

-- ============================================
-- END OF MIGRATION 039
-- ============================================
-- After running this migration:
--   1. Group members can see each other's display names and avatars
--   2. The link_disciple_account RPC returns the linked disciple_id
--   3. All pre-existing accounts are retroactively linked by email
--
-- IMPORTANT: Also update the Daily DNA app code (auth.js, groupsData.ts)
-- to handle the new RPC return value and add better error recovery.
