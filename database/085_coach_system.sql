-- 085_coach_system.sql
-- Elevates DNA coaches to first-class citizens:
--   1. Add phone field to dna_coaches
--   2. Link coach profile to a login account (user_id FK)
--   3. Add church-level coach assignment (churches.coach_id FK)
--   4. Add dna_coach to user_roles role CHECK constraint
--
-- NOTE: churches.coach_id is entirely separate from church_demo_settings.coach_id
-- (established in migration 084). The demo system FK is untouched.

-- ── 1. Add phone field to dna_coaches ─────────────────────────────────────────
ALTER TABLE dna_coaches
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ── 2. Link coach profile to a login account ──────────────────────────────────
-- user_id is nullable: a coach profile can exist before having a login account.
-- ON DELETE SET NULL: deleting the user row does not cascade-delete the coach profile.
ALTER TABLE dna_coaches
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dna_coaches_user_id ON dna_coaches(user_id);

-- Prevent duplicate coach profiles for the same email (partial: allows NULL emails)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dna_coaches_email_unique
  ON dna_coaches(email) WHERE email IS NOT NULL;

-- ── 3. Church-level coach assignment ──────────────────────────────────────────
-- ON DELETE SET NULL: deleting a coach unassigns them from churches, preserving data.
ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES dna_coaches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_churches_coach_id ON churches(coach_id);

-- ── 4. Add dna_coach to user_roles role CHECK constraint ──────────────────────
-- Uses DO block to safely drop and recreate the constraint.
-- Re-adding grants is not needed here (this is a CHECK constraint, not a function).
DO $$
BEGIN
  ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
  ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
    CHECK (role IN ('church_leader', 'dna_leader', 'training_participant', 'admin', 'dna_coach'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
