-- ============================================
-- Migration 056: Add role to disciple_app_accounts
--
-- Leaders also use the Daily DNA app. When they log in,
-- the app needs to know their role so it can unlock pathway
-- months 2 & 3 automatically.
--
-- Strategy: add a `role` column to disciple_app_accounts,
-- populated via email lookup into users → user_roles.
-- A trigger keeps it in sync when user_roles changes.
-- ============================================

-- 1. Add role column (nullable — most users are plain disciples)
ALTER TABLE disciple_app_accounts
  ADD COLUMN IF NOT EXISTS role TEXT
  CHECK (role IN ('dna_leader', 'church_leader', 'admin') OR role IS NULL);

-- 2. Backfill existing rows by joining through email
UPDATE disciple_app_accounts daa
SET role = (
  SELECT ur.role
  FROM users u
  JOIN user_roles ur ON ur.user_id = u.id
  WHERE u.email = daa.email
    AND ur.role IN ('dna_leader', 'church_leader', 'admin')
  ORDER BY
    CASE ur.role
      WHEN 'admin'         THEN 1
      WHEN 'church_leader' THEN 2
      WHEN 'dna_leader'    THEN 3
    END
  LIMIT 1
);

-- 3. Function: sync role from user_roles → disciple_app_accounts on insert/update
CREATE OR REPLACE FUNCTION sync_app_account_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Get the email for this user_roles entry
  SELECT email INTO v_email FROM users WHERE id = NEW.user_id;

  IF v_email IS NOT NULL AND NEW.role IN ('dna_leader', 'church_leader', 'admin') THEN
    UPDATE disciple_app_accounts
    SET role = NEW.role
    WHERE email = v_email
      AND (role IS NULL OR
           -- Higher roles take precedence: admin > church_leader > dna_leader
           CASE NEW.role
             WHEN 'admin'         THEN 1
             WHEN 'church_leader' THEN 2
             WHEN 'dna_leader'    THEN 3
           END <
           CASE role
             WHEN 'admin'         THEN 1
             WHEN 'church_leader' THEN 2
             WHEN 'dna_leader'    THEN 3
             ELSE 99
           END);
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Trigger: fire after a user_roles row is inserted or updated
DROP TRIGGER IF EXISTS trg_sync_app_account_role ON user_roles;
CREATE TRIGGER trg_sync_app_account_role
  AFTER INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION sync_app_account_role();

-- 5. Update RLS: disciples can read their own role (already covered by existing policy)
--    No changes needed.
