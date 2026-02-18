-- ============================================================
-- Migration 062: All Church Leaders → Cohort Trainers
--
-- 1. Backfill: ALL church_leaders (not just primary contact)
--    who also have a dna_leaders record → set role = 'trainer'
-- 2. Update the trigger function so future church_leaders are
--    also enrolled as trainers when their dna_leaders record
--    is inserted/updated with a church_id.
-- ============================================================

-- 1. Backfill: promote ALL church_leaders (by email match) to trainer
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
  LOOP
    -- Find their dna_leaders record (if any)
    SELECT id INTO v_leader_id FROM dna_leaders WHERE email = r.email LIMIT 1;

    IF v_leader_id IS NOT NULL THEN
      v_cohort_id := get_or_create_church_cohort(r.church_id);

      -- Upsert as trainer (regardless of is_primary_contact)
      INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
      VALUES (v_cohort_id, v_leader_id, 'trainer')
      ON CONFLICT (cohort_id, leader_id)
      DO UPDATE SET role = 'trainer';
    END IF;
  END LOOP;
END $$;

-- 2. Update the trigger function to check if the new leader is also
--    a church_leader for that church, and if so enroll as trainer.
CREATE OR REPLACE FUNCTION trg_auto_add_leader_to_cohort()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cohort_id UUID;
  v_is_church_leader BOOLEAN;
BEGIN
  -- Only act when church_id is set (and changed, or newly inserted)
  IF NEW.church_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.church_id IS DISTINCT FROM NEW.church_id) THEN

    v_cohort_id := get_or_create_church_cohort(NEW.church_id);

    -- Check if this dna_leader is also a church_leader for this church
    SELECT EXISTS (
      SELECT 1 FROM church_leaders
      WHERE email = NEW.email AND church_id = NEW.church_id
    ) INTO v_is_church_leader;

    IF v_is_church_leader THEN
      -- Enroll as trainer
      INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
      VALUES (v_cohort_id, NEW.id, 'trainer')
      ON CONFLICT (cohort_id, leader_id)
      DO UPDATE SET role = 'trainer';
    ELSE
      -- Enroll as regular leader
      INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
      VALUES (v_cohort_id, NEW.id, 'leader')
      ON CONFLICT (cohort_id, leader_id) DO NOTHING;
    END IF;

  END IF;
  RETURN NEW;
END;
$$;
