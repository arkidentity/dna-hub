-- ============================================================
-- Migration 061: Cohort Live Mode
--
-- 1. Add cohort_exempt to dna_cohort_members
-- 2. Auto-create cohort + auto-add members trigger:
--    - When a dna_leader's church_id is set, add them to that
--      church's active cohort (church_leader becomes trainer).
--    - If no cohort exists for the church yet, create one first.
-- 3. Add church_leaders to cohort membership (as 'trainer' role).
-- ============================================================

-- 1. Exempt flag — church leader can mark a dna_leader as not part of the cohort
ALTER TABLE dna_cohort_members
  ADD COLUMN IF NOT EXISTS cohort_exempt BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Helper function: ensure a church has an active cohort, return its id
CREATE OR REPLACE FUNCTION get_or_create_church_cohort(p_church_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cohort_id UUID;
  v_church_name TEXT;
BEGIN
  -- Look for an existing active cohort for this church
  SELECT id INTO v_cohort_id
  FROM dna_cohorts
  WHERE church_id = p_church_id AND status = 'active'
  LIMIT 1;

  IF v_cohort_id IS NOT NULL THEN
    RETURN v_cohort_id;
  END IF;

  -- None found — create one
  SELECT name INTO v_church_name FROM churches WHERE id = p_church_id;

  INSERT INTO dna_cohorts (church_id, name, generation, status, started_at)
  VALUES (
    p_church_id,
    COALESCE(v_church_name, 'Church') || ' G1',
    1,
    'active',
    CURRENT_DATE
  )
  RETURNING id INTO v_cohort_id;

  RETURN v_cohort_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_church_cohort TO authenticated;

-- 3. Function: add a dna_leader to their church's cohort (if not already there)
CREATE OR REPLACE FUNCTION add_leader_to_cohort(p_leader_id UUID, p_church_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cohort_id UUID;
BEGIN
  IF p_church_id IS NULL OR p_leader_id IS NULL THEN
    RETURN;
  END IF;

  v_cohort_id := get_or_create_church_cohort(p_church_id);

  -- Add as 'leader' if not already a member
  INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
  VALUES (v_cohort_id, p_leader_id, 'leader')
  ON CONFLICT (cohort_id, leader_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION add_leader_to_cohort TO authenticated;

-- 4. Trigger: when a dna_leaders row is inserted or church_id is updated,
--    auto-add them to that church's cohort
CREATE OR REPLACE FUNCTION trg_auto_add_leader_to_cohort()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act when church_id is set (and changed, or newly inserted)
  IF NEW.church_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.church_id IS DISTINCT FROM NEW.church_id) THEN
    PERFORM add_leader_to_cohort(NEW.id, NEW.church_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_add_leader_to_cohort ON dna_leaders;
CREATE TRIGGER trg_auto_add_leader_to_cohort
  AFTER INSERT OR UPDATE OF church_id ON dna_leaders
  FOR EACH ROW
  EXECUTE FUNCTION trg_auto_add_leader_to_cohort();

-- 5. Backfill: add all existing dna_leaders to their church cohort
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, church_id FROM dna_leaders WHERE church_id IS NOT NULL
  LOOP
    PERFORM add_leader_to_cohort(r.id, r.church_id);
  END LOOP;
END $$;

-- 6. Backfill: add church_leaders as 'trainer' in their church cohort.
--    church_leaders are NOT in the dna_leaders table, so we use a
--    separate join approach. We store them via the dna_leaders lookup
--    by email — if a church_leader is also a dna_leader (same email),
--    they get promoted to trainer.
DO $$
DECLARE
  r RECORD;
  v_cohort_id UUID;
  v_leader_id UUID;
BEGIN
  FOR r IN
    SELECT cl.church_id, cl.email
    FROM church_leaders cl
    WHERE cl.church_id IS NOT NULL
      AND cl.is_primary_contact = TRUE
  LOOP
    -- Find their dna_leaders record (if any)
    SELECT id INTO v_leader_id FROM dna_leaders WHERE email = r.email LIMIT 1;

    IF v_leader_id IS NOT NULL THEN
      v_cohort_id := get_or_create_church_cohort(r.church_id);

      -- Upsert as trainer
      INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
      VALUES (v_cohort_id, v_leader_id, 'trainer')
      ON CONFLICT (cohort_id, leader_id)
      DO UPDATE SET role = 'trainer';
    END IF;
  END LOOP;
END $$;

-- 7. Index for exempt flag queries
CREATE INDEX IF NOT EXISTS idx_dna_cohort_members_exempt
  ON dna_cohort_members(cohort_id, cohort_exempt)
  WHERE cohort_exempt = FALSE;
