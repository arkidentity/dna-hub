-- Migration 141: Admin feature unlock override
-- Allows admins to bypass billing gates for specific churches (demos, managed accounts)

ALTER TABLE church_billing_status
  ADD COLUMN IF NOT EXISTS features_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS features_unlocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS features_unlocked_by TEXT; -- admin email who toggled it
