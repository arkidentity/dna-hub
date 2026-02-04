-- Migration 033: Fix milestone_resources Foreign Key
--
-- Problem: The milestone_resources table still has a FK to milestones_deprecated,
-- but after migration 032, all milestones are now in church_milestones with NEW UUIDs.
-- The milestone_id updates in 032 couldn't work properly because:
-- 1. The FK constraint was never dropped
-- 2. Global resources should link to template_milestones, not church_milestones
--
-- Solution: Change the architecture so milestone_resources links to template_milestones
-- and the dashboard query joins through source_milestone_id on church_milestones.

-- ============================================
-- PART 1: Drop Old Foreign Key Constraint
-- ============================================

-- Drop the constraint that references the deprecated milestones table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'milestone_resources'::regclass
        AND contype = 'f'
        AND conname LIKE '%milestone_id%'
    ) LOOP
        EXECUTE 'ALTER TABLE milestone_resources DROP CONSTRAINT ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped milestone_resources constraint: %', r.conname;
    END LOOP;
END $$;

-- Also try explicit name just in case
ALTER TABLE milestone_resources DROP CONSTRAINT IF EXISTS milestone_resources_milestone_id_fkey;

-- ============================================
-- PART 2: Recreate milestone_resources with template_milestones
-- ============================================

-- The milestone_resources table needs to link to template_milestones (not church_milestones)
-- because global resources are shared across all churches via the template system.

-- First, clear the table (the data is stale/orphaned anyway since milestone IDs changed)
TRUNCATE TABLE milestone_resources;

-- Add foreign key to template_milestones
ALTER TABLE milestone_resources
ADD CONSTRAINT milestone_resources_milestone_id_fkey
FOREIGN KEY (milestone_id) REFERENCES template_milestones(id) ON DELETE CASCADE;

-- ============================================
-- PART 3: Re-link Global Resources to Template Milestones
-- ============================================

-- Get the default template and link resources to its milestones
DO $$
DECLARE
    v_template_id UUID;
    v_phase_1_id UUID;
BEGIN
    -- Get the default template
    SELECT id INTO v_template_id FROM journey_templates WHERE is_default = TRUE LIMIT 1;

    -- Get Phase 1 ID
    SELECT id INTO v_phase_1_id FROM phases WHERE phase_number = 1;

    IF v_template_id IS NOT NULL AND v_phase_1_id IS NOT NULL THEN
        -- Link "Pastor's Guide to Flow Assessment" resource to template milestone
        -- First check if the resource and milestone exist
        INSERT INTO milestone_resources (milestone_id, resource_id, display_order)
        SELECT tm.id, gr.id, 1
        FROM template_milestones tm
        CROSS JOIN global_resources gr
        WHERE tm.template_id = v_template_id
          AND tm.title = 'Review Pastor''s Guide to Flow Assessment'
          AND gr.name = 'Pastor''s Guide to Dam Assessment'
        ON CONFLICT (milestone_id, resource_id) DO NOTHING;

        RAISE NOTICE 'Linked available resources to template milestones';
    END IF;
END $$;

-- ============================================
-- PART 4: Add Comments
-- ============================================

COMMENT ON TABLE milestone_resources IS 'Links global resources to TEMPLATE milestones. Church dashboards join via church_milestones.source_milestone_id';

-- ============================================
-- Verification
-- ============================================
-- Run these to verify:
-- SELECT * FROM milestone_resources;
-- SELECT tm.title, gr.name
-- FROM milestone_resources mr
-- JOIN template_milestones tm ON mr.milestone_id = tm.id
-- JOIN global_resources gr ON mr.resource_id = gr.id;
