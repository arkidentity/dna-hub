-- ============================================================
-- Migration 076: National Cohort for Independent DNA Leaders
--
-- Independent DNA leaders (dna_leaders.church_id IS NULL) have
-- no cohort. This migration:
--
-- 1. Creates a "DNA Hub" sentinel church record that acts as the
--    owner of the national cohort (satisfies the NOT NULL FK on
--    dna_cohorts.church_id without schema changes).
-- 2. Creates the "National Cohort" dna_cohorts record.
-- 3. Stores the national cohort ID in a new app_settings table
--    (or a known fixed value) so triggers can reference it.
-- 4. Updates trg_auto_add_leader_to_cohort so that leaders with
--    church_id IS NULL are enrolled in the national cohort
--    instead of being skipped.
-- 5. Backfills all existing independent dna_leaders.
-- ============================================================

-- -------------------------------------------------------
-- 1. Ensure a sentinel "DNA Hub" church exists.
--    We use a fixed UUID so this is idempotent and referenceable.
-- -------------------------------------------------------
DO $$
BEGIN
  INSERT INTO churches (id, name, contact_email)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    'DNA Hub',
    'info@dnadiscipleship.com'
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- -------------------------------------------------------
-- 2. Create the National Cohort (idempotent).
--    Also uses a fixed UUID so triggers can reference it cheaply.
-- -------------------------------------------------------
DO $$
BEGIN
  INSERT INTO dna_cohorts (id, church_id, name, generation, status, started_at)
  VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',  -- DNA Hub sentinel church
    'National Cohort',
    1,
    'active',
    CURRENT_DATE
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- -------------------------------------------------------
-- 3. Helper function: return the national cohort ID
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_national_cohort_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT '00000000-0000-0000-0000-000000000002'::UUID;
$$;

GRANT EXECUTE ON FUNCTION get_national_cohort_id TO authenticated;

-- -------------------------------------------------------
-- 4. Update the trigger function to handle church_id IS NULL
--    → enroll in national cohort as 'leader'
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_auto_add_leader_to_cohort()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cohort_id UUID;
  v_is_church_leader BOOLEAN;
BEGIN
  -- Case A: church_id is set (and changed or newly inserted)
  IF NEW.church_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.church_id IS DISTINCT FROM NEW.church_id) THEN

    v_cohort_id := get_or_create_church_cohort(NEW.church_id);

    -- Check if this dna_leader is also a church_leader for this church
    SELECT EXISTS (
      SELECT 1 FROM church_leaders
      WHERE email = NEW.email AND church_id = NEW.church_id
    ) INTO v_is_church_leader;

    IF v_is_church_leader THEN
      INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
      VALUES (v_cohort_id, NEW.id, 'trainer')
      ON CONFLICT (cohort_id, leader_id)
      DO UPDATE SET role = 'trainer';
    ELSE
      INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
      VALUES (v_cohort_id, NEW.id, 'leader')
      ON CONFLICT (cohort_id, leader_id) DO NOTHING;
    END IF;

  -- Case B: church_id is NULL → enroll in national cohort
  ELSIF NEW.church_id IS NULL AND (TG_OP = 'INSERT' OR OLD.church_id IS DISTINCT FROM NEW.church_id) THEN

    INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
    VALUES (get_national_cohort_id(), NEW.id, 'leader')
    ON CONFLICT (cohort_id, leader_id) DO NOTHING;

  END IF;

  -- Case C: leader was independent and is now assigned to a church
  --         → remove from national cohort (they now belong to their church cohort)
  IF TG_OP = 'UPDATE'
    AND OLD.church_id IS NULL
    AND NEW.church_id IS NOT NULL
  THEN
    DELETE FROM dna_cohort_members
    WHERE cohort_id = get_national_cohort_id()
      AND leader_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger already exists — no need to recreate it, the function replacement above
-- is picked up automatically since the trigger calls the function by name.

-- -------------------------------------------------------
-- 5. Backfill: enroll all existing independent dna_leaders
--    in the national cohort
-- -------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM dna_leaders WHERE church_id IS NULL
  LOOP
    INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
    VALUES (get_national_cohort_id(), r.id, 'leader')
    ON CONFLICT (cohort_id, leader_id) DO NOTHING;
  END LOOP;
END $$;
