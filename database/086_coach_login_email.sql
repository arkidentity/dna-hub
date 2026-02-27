-- Migration 086: Add login_email to dna_coaches
--
-- Problem: dna_coaches.email is used as both the public display email AND
-- the credential used to match a logged-in user to their coach profile.
-- When a coach's display email differs from their login email, the lookup fails.
--
-- Solution: Add login_email for the auth credential (separate from display email).
-- ensureCoachAccount() will use login_email (when set) for provisioning,
-- and the coach identity lookup will match on user_id (set after provisioning).

ALTER TABLE dna_coaches
  ADD COLUMN IF NOT EXISTS login_email TEXT;

-- Unique constraint: two coaches can't share a login email
CREATE UNIQUE INDEX IF NOT EXISTS idx_dna_coaches_login_email_unique
  ON dna_coaches (login_email)
  WHERE login_email IS NOT NULL;
