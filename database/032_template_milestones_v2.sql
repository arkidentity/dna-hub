-- Migration 032 v2: Template-Based Milestone System
-- This is a CLEAN version that handles all edge cases
--
-- IMPORTANT: Run this ONLY if you've already dropped constraints via step1_drop_constraints.sql
-- OR if this is a fresh database without the partial migration state

-- ============================================
-- PART 1: Create New Tables (IF NOT EXISTS for idempotency)
-- ============================================

-- Journey Templates table (supports multiple templates in future)
CREATE TABLE IF NOT EXISTS journey_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template Milestones - Master milestone definitions
CREATE TABLE IF NOT EXISTS template_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES journey_templates(id) ON DELETE CASCADE,
    phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_url TEXT,
    resource_type VARCHAR(50),
    display_order INTEGER NOT NULL,
    is_key_milestone BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Church Milestones - Church-specific copies (fully editable)
CREATE TABLE IF NOT EXISTS church_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_url TEXT,
    resource_type VARCHAR(50),
    display_order INTEGER NOT NULL,
    is_key_milestone BOOLEAN DEFAULT FALSE,
    source_template_id UUID REFERENCES journey_templates(id),
    source_milestone_id UUID REFERENCES template_milestones(id),
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add journey_template_id to churches table
ALTER TABLE churches
ADD COLUMN IF NOT EXISTS journey_template_id UUID REFERENCES journey_templates(id);

ALTER TABLE churches
ADD COLUMN IF NOT EXISTS template_applied_at TIMESTAMPTZ;

-- ============================================
-- PART 2: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_template_milestones_template
ON template_milestones(template_id);

CREATE INDEX IF NOT EXISTS idx_template_milestones_phase
ON template_milestones(phase_id);

CREATE INDEX IF NOT EXISTS idx_church_milestones_church
ON church_milestones(church_id);

CREATE INDEX IF NOT EXISTS idx_church_milestones_phase
ON church_milestones(phase_id);

CREATE INDEX IF NOT EXISTS idx_church_milestones_church_phase
ON church_milestones(church_id, phase_id);

-- ============================================
-- PART 3: Create Default Template (only if not exists)
-- ============================================

INSERT INTO journey_templates (name, description, is_default, is_active)
SELECT
    'Standard DNA Journey',
    'The standard DNA Discipleship Framework implementation journey. Phase 0 (Onboarding) and Phase 1 (Church Partnership) come pre-populated. Phases 2-5 are customized per church.',
    TRUE,
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM journey_templates WHERE is_default = TRUE);

-- ============================================
-- PART 4: Populate Template Milestones (Phase 0 & 1 Only)
-- ============================================

DO $$
DECLARE
    v_template_id UUID;
    v_phase_0_id UUID;
    v_phase_1_id UUID;
BEGIN
    -- Get the default template
    SELECT id INTO v_template_id FROM journey_templates WHERE is_default = TRUE LIMIT 1;

    -- Get phase IDs
    SELECT id INTO v_phase_0_id FROM phases WHERE phase_number = 0;
    SELECT id INTO v_phase_1_id FROM phases WHERE phase_number = 1;

    -- Only insert if template_milestones is empty for this template
    IF NOT EXISTS (SELECT 1 FROM template_milestones WHERE template_id = v_template_id) THEN
        -- Phase 0: Onboarding milestones
        IF v_phase_0_id IS NOT NULL THEN
            INSERT INTO template_milestones (template_id, phase_id, title, description, display_order, is_key_milestone)
            VALUES
                (v_template_id, v_phase_0_id, 'Discovery Call Notes', 'Notes and outcomes from the initial discovery call.', 1, FALSE),
                (v_template_id, v_phase_0_id, 'Proposal Call Notes', 'Notes and outcomes from the proposal review call.', 2, FALSE),
                (v_template_id, v_phase_0_id, 'Agreement Call Notes', 'Notes and outcomes from the agreement finalization call.', 3, FALSE),
                (v_template_id, v_phase_0_id, 'Kick-off Notes', 'Notes and action items from the kick-off meeting.', 4, TRUE);
        END IF;

        -- Phase 1: Church Partnership milestones
        IF v_phase_1_id IS NOT NULL THEN
            INSERT INTO template_milestones (template_id, phase_id, title, description, display_order, is_key_milestone)
            VALUES
                (v_template_id, v_phase_1_id, 'Vision Alignment Meeting', 'Meet with church leadership to align on DNA vision and commitment.', 1, FALSE),
                (v_template_id, v_phase_1_id, 'Identify Church DNA Champion', 'Designate who will oversee DNA implementation at your church.', 2, FALSE),
                (v_template_id, v_phase_1_id, 'Leaders Complete Flow Assessment', 'Ensure all key leaders have completed the Flow Assessment.', 3, TRUE),
                (v_template_id, v_phase_1_id, 'Review Pastor''s Guide to Flow Assessment', 'Learn how to unpack the Flow Assessment results with your people.', 4, FALSE),
                (v_template_id, v_phase_1_id, 'Flow Assessment Debrief Meetings', 'Complete debrief meetings to discuss Flow Assessment results.', 5, TRUE);
        END IF;
    END IF;
END $$;

-- ============================================
-- PART 5: Drop Foreign Key Constraints (dynamic SQL)
-- ============================================

-- Drop all FK constraints on tables that reference milestones
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all foreign key constraints on church_progress
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'church_progress'::regclass
        AND contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE church_progress DROP CONSTRAINT ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped church_progress constraint: %', r.conname;
    END LOOP;

    -- Drop all foreign key constraints on milestone_attachments
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'milestone_attachments'::regclass
        AND contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE milestone_attachments DROP CONSTRAINT ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped milestone_attachments constraint: %', r.conname;
    END LOOP;

    -- Drop all foreign key constraints on notification_log
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'notification_log'::regclass
        AND contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE notification_log DROP CONSTRAINT ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped notification_log constraint: %', r.conname;
    END LOOP;

    -- Drop all foreign key constraints on scheduled_calls
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'scheduled_calls'::regclass
        AND contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE scheduled_calls DROP CONSTRAINT ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped scheduled_calls constraint: %', r.conname;
    END LOOP;
END $$;

-- Explicit drops as backup
ALTER TABLE church_progress DROP CONSTRAINT IF EXISTS church_progress_milestone_id_fkey;
ALTER TABLE milestone_attachments DROP CONSTRAINT IF EXISTS milestone_attachments_milestone_id_fkey;
ALTER TABLE notification_log DROP CONSTRAINT IF EXISTS notification_log_milestone_id_fkey;
ALTER TABLE scheduled_calls DROP CONSTRAINT IF EXISTS scheduled_calls_milestone_id_fkey;

-- ============================================
-- PART 6: Migrate Existing Church Data
-- ============================================

-- For each church (ALL churches, not just active), copy their current milestones
DO $$
DECLARE
    v_template_id UUID;
    v_church RECORD;
    v_milestone RECORD;
    v_new_milestone_id UUID;
    v_migrated_count INTEGER := 0;
BEGIN
    -- Get the default template
    SELECT id INTO v_template_id FROM journey_templates WHERE is_default = TRUE LIMIT 1;

    -- Loop through ALL churches (not just active - to capture all progress records)
    FOR v_church IN
        SELECT id, name FROM churches
    LOOP
        RAISE NOTICE 'Migrating milestones for church: %', v_church.name;

        -- Get all milestones visible to this church (template + custom)
        -- Exclude hidden milestones
        FOR v_milestone IN
            SELECT m.* FROM milestones m
            WHERE (m.church_id IS NULL OR m.church_id = v_church.id)
            AND NOT EXISTS (
                SELECT 1 FROM church_hidden_milestones chm
                WHERE chm.church_id = v_church.id AND chm.milestone_id = m.id
            )
            ORDER BY m.phase_id, m.display_order
        LOOP
            -- Check if this milestone already exists in church_milestones for this church
            -- (to handle re-runs)
            IF NOT EXISTS (
                SELECT 1 FROM church_milestones cm
                WHERE cm.church_id = v_church.id
                AND cm.title = v_milestone.title
                AND cm.phase_id = v_milestone.phase_id
            ) THEN
                -- Insert into church_milestones
                INSERT INTO church_milestones (
                    church_id,
                    phase_id,
                    title,
                    description,
                    resource_url,
                    resource_type,
                    display_order,
                    is_key_milestone,
                    source_template_id,
                    is_custom
                ) VALUES (
                    v_church.id,
                    v_milestone.phase_id,
                    v_milestone.title,
                    v_milestone.description,
                    v_milestone.resource_url,
                    v_milestone.resource_type,
                    v_milestone.display_order,
                    v_milestone.is_key_milestone,
                    v_template_id,
                    CASE WHEN v_milestone.church_id IS NOT NULL THEN TRUE ELSE FALSE END
                ) RETURNING id INTO v_new_milestone_id;

                v_migrated_count := v_migrated_count + 1;

                -- Update church_progress to point to new milestone
                UPDATE church_progress
                SET milestone_id = v_new_milestone_id
                WHERE church_id = v_church.id
                AND milestone_id = v_milestone.id;

                -- Update milestone_attachments to point to new milestone
                UPDATE milestone_attachments
                SET milestone_id = v_new_milestone_id
                WHERE church_id = v_church.id
                AND milestone_id = v_milestone.id;

                -- Update scheduled_calls to point to new milestone
                UPDATE scheduled_calls
                SET milestone_id = v_new_milestone_id
                WHERE church_id = v_church.id
                AND milestone_id = v_milestone.id;

                -- Update notification_log to point to new milestone
                UPDATE notification_log
                SET milestone_id = v_new_milestone_id
                WHERE church_id = v_church.id
                AND milestone_id = v_milestone.id;
            END IF;
        END LOOP;

        -- Mark template as applied
        UPDATE churches
        SET journey_template_id = v_template_id,
            template_applied_at = NOW()
        WHERE id = v_church.id;

    END LOOP;

    RAISE NOTICE 'Total milestones migrated: %', v_migrated_count;
END $$;

-- ============================================
-- PART 7: Clean Up Orphaned Records
-- ============================================

-- Delete any church_progress records that still point to old milestones
-- (these would be records for hidden milestones or other edge cases)
DELETE FROM church_progress
WHERE NOT EXISTS (SELECT 1 FROM church_milestones cm WHERE cm.id = church_progress.milestone_id);

-- Delete orphaned milestone_attachments
DELETE FROM milestone_attachments
WHERE NOT EXISTS (SELECT 1 FROM church_milestones cm WHERE cm.id = milestone_attachments.milestone_id);

-- Set milestone_id to NULL for orphaned scheduled_calls
UPDATE scheduled_calls
SET milestone_id = NULL
WHERE milestone_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM church_milestones cm WHERE cm.id = scheduled_calls.milestone_id);

-- Set milestone_id to NULL for orphaned notification_log
UPDATE notification_log
SET milestone_id = NULL
WHERE milestone_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM church_milestones cm WHERE cm.id = notification_log.milestone_id);

-- ============================================
-- PART 8: Verify Clean State Before Adding Constraints
-- ============================================

DO $$
DECLARE
    v_orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_orphan_count
    FROM church_progress cp
    WHERE NOT EXISTS (SELECT 1 FROM church_milestones cm WHERE cm.id = cp.milestone_id);

    IF v_orphan_count > 0 THEN
        RAISE EXCEPTION 'Still have % orphaned church_progress records!', v_orphan_count;
    END IF;

    RAISE NOTICE 'All church_progress records have valid milestone references';
END $$;

-- ============================================
-- PART 9: Rename Old Tables (Keep for Rollback)
-- ============================================

-- Only rename if not already renamed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'milestones' AND table_schema = 'public') THEN
        ALTER TABLE milestones RENAME TO milestones_deprecated;
        RAISE NOTICE 'Renamed milestones to milestones_deprecated';
    END IF;
END $$;

-- Drop the hidden milestones table (no longer needed)
DROP TABLE IF EXISTS church_hidden_milestones;

-- ============================================
-- PART 10: Recreate Foreign Key Constraints
-- ============================================

-- Add foreign key constraint on church_progress pointing to church_milestones
ALTER TABLE church_progress
ADD CONSTRAINT church_progress_milestone_id_fkey
FOREIGN KEY (milestone_id) REFERENCES church_milestones(id) ON DELETE CASCADE;

-- Add foreign key constraint on milestone_attachments pointing to church_milestones
ALTER TABLE milestone_attachments
ADD CONSTRAINT milestone_attachments_milestone_id_fkey
FOREIGN KEY (milestone_id) REFERENCES church_milestones(id) ON DELETE CASCADE;

-- ============================================
-- PART 11: Add Updated_at Triggers
-- ============================================

-- Drop triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS update_church_milestones_updated_at ON church_milestones;
DROP TRIGGER IF EXISTS update_journey_templates_updated_at ON journey_templates;

CREATE TRIGGER update_church_milestones_updated_at
    BEFORE UPDATE ON church_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journey_templates_updated_at
    BEFORE UPDATE ON journey_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 12: Add Comments
-- ============================================

COMMENT ON TABLE journey_templates IS 'Master journey templates that define the milestone structure';
COMMENT ON TABLE template_milestones IS 'Master milestone definitions within a journey template (Phase 0 and 1 only)';
COMMENT ON TABLE church_milestones IS 'Church-specific milestone copies - fully editable per church';
COMMENT ON COLUMN church_milestones.source_template_id IS 'Reference to the original template (for tracking)';
COMMENT ON COLUMN church_milestones.source_milestone_id IS 'Reference to the original template milestone (for tracking)';
COMMENT ON COLUMN church_milestones.is_custom IS 'TRUE if this milestone was manually added by admin (not from template)';

-- ============================================
-- VERIFICATION QUERIES (uncomment to run)
-- ============================================

-- Check template was created:
SELECT 'Templates created:' as info, COUNT(*) as count FROM journey_templates;

-- Check template milestones were created:
SELECT 'Template milestones:' as info, COUNT(*) as count FROM template_milestones;

-- Check church milestones were migrated:
SELECT 'Church milestones per church:' as info;
SELECT c.name as church_name, COUNT(cm.id) as milestone_count
FROM churches c
LEFT JOIN church_milestones cm ON cm.church_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;

-- Check constraints are in place:
SELECT 'Constraints on church_progress:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'church_progress'::regclass
AND contype = 'f';
