-- Migration 065: Fix disciple ↔ app account linking
--
-- Problem: The existing trigger (Migration 036) only fires on disciple_app_accounts INSERT.
-- If a disciple signed up in the Daily DNA app BEFORE their leader added them to a group
-- in the Hub (or before their disciples record was created), the trigger fires but finds
-- no disciples row → link never forms → disciples.app_account_id stays NULL → life
-- assessment data, pathway progress, and all other synced data is invisible to leaders.
--
-- Fix:
-- 1. Add a reverse trigger: when a disciples row is created/updated with an email,
--    look for a matching disciple_app_accounts row and link them.
-- 2. Backfill: one-time update to link all existing unlinked records by email.

-- ============================================
-- 1. Reverse trigger: disciples → disciple_app_accounts
-- ============================================

CREATE OR REPLACE FUNCTION auto_link_from_disciples()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act if email is set and app_account_id is not already linked
  IF NEW.email IS NULL OR NEW.app_account_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Find a matching disciple_app_accounts row by email
  UPDATE disciples
  SET app_account_id = daa.id
  FROM disciple_app_accounts daa
  WHERE LOWER(daa.email) = LOWER(NEW.email)
    AND disciples.id = NEW.id
    AND disciples.app_account_id IS NULL;

  -- Also set disciple_id on the app account if not already set
  UPDATE disciple_app_accounts
  SET disciple_id = NEW.id
  FROM disciples d
  WHERE LOWER(disciple_app_accounts.email) = LOWER(NEW.email)
    AND disciple_app_accounts.disciple_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION auto_link_from_disciples TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_auto_link_from_disciples ON disciples;
CREATE TRIGGER trg_auto_link_from_disciples
  AFTER INSERT OR UPDATE OF email ON disciples
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_from_disciples();

-- ============================================
-- 2. One-time backfill: link all existing unlinked disciples
-- ============================================

-- Update disciples.app_account_id where email matches a disciple_app_accounts row
UPDATE disciples d
SET app_account_id = daa.id
FROM disciple_app_accounts daa
WHERE LOWER(d.email) = LOWER(daa.email)
  AND d.app_account_id IS NULL
  AND d.email IS NOT NULL;

-- Update disciple_app_accounts.disciple_id where email matches a disciples row
UPDATE disciple_app_accounts daa
SET disciple_id = d.id
FROM disciples d
WHERE LOWER(daa.email) = LOWER(d.email)
  AND daa.disciple_id IS NULL
  AND daa.email IS NOT NULL;
