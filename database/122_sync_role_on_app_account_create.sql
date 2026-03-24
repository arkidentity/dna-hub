-- Migration 122: Sync role to disciple_app_accounts on INSERT
--
-- Problem: The existing trigger (Migration 056) only fires when user_roles
-- is inserted/updated. But if the user_roles row already exists BEFORE the
-- disciple_app_accounts record is created (e.g. conference signup creates
-- the church_leader role, then the pastor later logs into the app), the
-- role column stays NULL.
--
-- Fix: Add an AFTER INSERT trigger on disciple_app_accounts that looks up
-- the highest-priority role from user_roles (via email match through users).

CREATE OR REPLACE FUNCTION sync_role_on_app_account_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Look up highest-priority role for this email
  SELECT ur.role INTO v_role
  FROM users u
  JOIN user_roles ur ON ur.user_id = u.id
  WHERE u.email = NEW.email
    AND ur.role IN ('dna_leader', 'church_leader', 'admin')
  ORDER BY
    CASE ur.role
      WHEN 'admin'         THEN 1
      WHEN 'church_leader' THEN 2
      WHEN 'dna_leader'    THEN 3
    END
  LIMIT 1;

  -- If a role was found, set it on the new record
  IF v_role IS NOT NULL THEN
    UPDATE disciple_app_accounts
    SET role = v_role
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION sync_role_on_app_account_create TO authenticated, service_role;

-- Create trigger
DROP TRIGGER IF EXISTS trg_sync_role_on_app_account_create ON disciple_app_accounts;
CREATE TRIGGER trg_sync_role_on_app_account_create
  AFTER INSERT ON disciple_app_accounts
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_on_app_account_create();
