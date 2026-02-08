-- ============================================
-- Migration 041: Include Leader App Accounts in RLS
-- ============================================
-- The disciple_app_accounts policy from migration 040 only allows reading
-- accounts of fellow group members (via disciples table). But leaders are
-- in dna_leaders, not disciples. When a leader also has an app account,
-- other group members can't see their display_name/avatar.
--
-- Fix: Expand the policy to also include app accounts that match leader
-- emails for the user's groups.
-- ============================================

-- Drop the old policy
DROP POLICY IF EXISTS "Disciples can view group members app accounts" ON disciple_app_accounts;

-- Recreate with leader accounts included
CREATE POLICY "Disciples can view group members app accounts"
ON disciple_app_accounts FOR SELECT
USING (
  -- Own account
  id = auth.uid()
  OR
  -- Fellow group disciples' app accounts
  id IN (
    SELECT d.app_account_id
    FROM disciples d
    JOIN group_disciples gd ON gd.disciple_id = d.id
    WHERE d.app_account_id IS NOT NULL
      AND gd.group_id = ANY(get_my_group_ids())
  )
  OR
  -- Leader/co-leader app accounts (leaders may also use the app)
  email IN (
    SELECT dl.email
    FROM dna_leaders dl
    JOIN dna_groups g ON g.leader_id = dl.id OR g.co_leader_id = dl.id
    WHERE g.id = ANY(get_my_group_ids())
      AND dl.email IS NOT NULL
  )
);

-- ============================================
-- END OF MIGRATION 041
-- ============================================
