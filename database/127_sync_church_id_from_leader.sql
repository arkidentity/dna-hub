-- Migration 127: Sync church_id from dna_leaders → disciple_app_accounts
--
-- Problem: When a leader is assigned to a church (dna_leaders.church_id is set),
-- their disciple_app_accounts row doesn't automatically get the church_id.
-- This causes "No church" to appear for those users in the all-disciples list,
-- which joins churches via disciple_app_accounts.church_id.
--
-- Fix 1: Trigger on dna_leaders UPDATE — when church_id changes, sync to the
--         matching disciple_app_accounts row (matched by email).
-- Fix 2: Trigger on disciple_app_accounts INSERT — when a new app account is
--         created, backfill church_id from dna_leaders if one exists.
-- Fix 3: One-time backfill for existing records that are already out of sync.

-- ============================================================
-- 1. TRIGGER FUNCTION: sync church_id when dna_leaders is updated
-- ============================================================
CREATE OR REPLACE FUNCTION sync_church_id_to_app_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Only act when church_id actually changed
  IF NEW.church_id IS DISTINCT FROM OLD.church_id THEN
    UPDATE disciple_app_accounts
    SET church_id = NEW.church_id
    WHERE LOWER(email) = LOWER(NEW.email)
      AND church_id IS DISTINCT FROM NEW.church_id;
  END IF;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION sync_church_id_to_app_account TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_sync_church_id_to_app_account ON dna_leaders;
CREATE TRIGGER trg_sync_church_id_to_app_account
  AFTER UPDATE OF church_id ON dna_leaders
  FOR EACH ROW
  EXECUTE FUNCTION sync_church_id_to_app_account();


-- ============================================================
-- 2. TRIGGER FUNCTION: backfill church_id when a new app account is created
-- ============================================================
CREATE OR REPLACE FUNCTION sync_church_id_on_app_account_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_church_id UUID;
BEGIN
  -- Only act if the new record has no church_id
  IF NEW.church_id IS NULL THEN
    SELECT dl.church_id INTO v_church_id
    FROM dna_leaders dl
    WHERE LOWER(dl.email) = LOWER(NEW.email)
      AND dl.church_id IS NOT NULL
    LIMIT 1;

    IF v_church_id IS NOT NULL THEN
      UPDATE disciple_app_accounts
      SET church_id = v_church_id
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION sync_church_id_on_app_account_create TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_sync_church_id_on_app_account_create ON disciple_app_accounts;
CREATE TRIGGER trg_sync_church_id_on_app_account_create
  AFTER INSERT ON disciple_app_accounts
  FOR EACH ROW
  EXECUTE FUNCTION sync_church_id_on_app_account_create();


-- ============================================================
-- 3. ONE-TIME BACKFILL: fix existing records already out of sync
-- ============================================================
UPDATE disciple_app_accounts daa
SET church_id = dl.church_id
FROM dna_leaders dl
WHERE LOWER(daa.email) = LOWER(dl.email)
  AND daa.church_id IS NULL
  AND dl.church_id IS NOT NULL;
