-- ============================================
-- Migration 038: Retroactively Link Pre-Existing App Accounts
-- ============================================
-- Purpose: The auto-link trigger (migration 036) only fires on INSERT into
--          disciple_app_accounts. Disciples who signed up on the Daily DNA app
--          BEFORE the trigger was deployed never had the linking occur.
--          This one-time migration retroactively links all unlinked accounts
--          by matching email addresses (case-insensitive).
--
-- Safe to run multiple times (idempotent due to IS NULL checks).
-- ============================================

-- 1. Link disciples.app_account_id → disciple_app_accounts.id
UPDATE disciples d
SET app_account_id = daa.id
FROM disciple_app_accounts daa
WHERE LOWER(d.email) = LOWER(daa.email)
  AND d.app_account_id IS NULL;

-- 2. Link disciple_app_accounts.disciple_id → disciples.id
UPDATE disciple_app_accounts daa
SET disciple_id = d.id
FROM disciples d
WHERE LOWER(daa.email) = LOWER(d.email)
  AND daa.disciple_id IS NULL;

-- ============================================
-- END OF MIGRATION 038
-- ============================================
-- After running this, all pre-existing app accounts that match a disciple
-- by email will be linked. The DNA Hub will then show their app activity
-- on the disciple profile page.
