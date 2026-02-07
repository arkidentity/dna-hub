-- Auto-Link Disciple App Accounts
-- Migration: 036_auto_link_disciple_accounts.sql
-- Purpose: When a disciple signs up on the Daily DNA app, auto-link their
--          app account to existing disciple records by matching email.
-- Created: 2025-02-06

-- ============================================
-- FUNCTION: Auto-link disciple app accounts
-- Runs AFTER INSERT on disciple_app_accounts.
-- Matches the new app account's email to an existing
-- disciples row and sets disciples.app_account_id.
-- ============================================
CREATE OR REPLACE FUNCTION auto_link_disciple_app_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Match by email (case-insensitive) and only if not already linked
  UPDATE disciples
  SET app_account_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)
    AND app_account_id IS NULL;

  -- Also set disciple_id on the app account if a match was found
  UPDATE disciple_app_accounts
  SET disciple_id = (
    SELECT id FROM disciples
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1
  )
  WHERE id = NEW.id
    AND disciple_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Fire after app account creation
-- ============================================
CREATE TRIGGER trg_auto_link_disciple_app_account
  AFTER INSERT ON disciple_app_accounts
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_disciple_app_account();
