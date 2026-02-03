-- 032d: Supabase-compatible cleanup
-- Works within Supabase's permission constraints

-- ============================================
-- STEP 1: Check current state first
-- ============================================

SELECT 'Current tables:' as info;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('milestones', 'milestones_deprecated', 'church_milestones', 'church_hidden_milestones');

SELECT 'Current constraints on church_progress:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'church_progress'::regclass
AND contype = 'f';

-- ============================================
-- STEP 2: Restore milestones table FIRST (before touching constraints)
-- ============================================

DO $$
BEGIN
    -- If both exist, we need to keep the original milestones
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'milestones')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'milestones_deprecated') THEN
        -- milestones exists, drop the deprecated backup
        DROP TABLE IF EXISTS milestones_deprecated CASCADE;
        RAISE NOTICE 'Dropped milestones_deprecated (milestones already exists)';
    -- If only deprecated exists, rename it back
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'milestones_deprecated')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'milestones') THEN
        ALTER TABLE milestones_deprecated RENAME TO milestones;
        RAISE NOTICE 'Renamed milestones_deprecated back to milestones';
    ELSE
        RAISE NOTICE 'milestones table is in expected state';
    END IF;
END $$;

-- ============================================
-- STEP 3: Drop the foreign key constraint FIRST
-- ============================================

-- Try multiple possible constraint names
ALTER TABLE church_progress DROP CONSTRAINT IF EXISTS church_progress_milestone_id_fkey;
ALTER TABLE church_progress DROP CONSTRAINT IF EXISTS church_progress_milestone_id_fkey1;
ALTER TABLE church_progress DROP CONSTRAINT IF EXISTS fk_church_progress_milestone;

ALTER TABLE milestone_attachments DROP CONSTRAINT IF EXISTS milestone_attachments_milestone_id_fkey;
ALTER TABLE milestone_attachments DROP CONSTRAINT IF EXISTS milestone_attachments_milestone_id_fkey1;

-- ============================================
-- STEP 4: Now we can safely delete orphaned data
-- ============================================

-- Delete from church_progress where milestone doesn't exist in milestones
-- At this point there's no FK constraint so this will work
DELETE FROM church_progress
WHERE NOT EXISTS (
    SELECT 1 FROM milestones m WHERE m.id = church_progress.milestone_id
);

-- Same for milestone_attachments
DELETE FROM milestone_attachments
WHERE NOT EXISTS (
    SELECT 1 FROM milestones m WHERE m.id = milestone_attachments.milestone_id
);

-- Clear milestone_id from other tables
UPDATE scheduled_calls
SET milestone_id = NULL
WHERE milestone_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM milestones m WHERE m.id = scheduled_calls.milestone_id
);

UPDATE notification_log
SET milestone_id = NULL
WHERE milestone_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM milestones m WHERE m.id = notification_log.milestone_id
);

-- ============================================
-- STEP 5: Drop partial migration tables
-- ============================================

DROP TABLE IF EXISTS church_milestones CASCADE;
DROP TABLE IF EXISTS template_milestones CASCADE;
DROP TABLE IF EXISTS journey_templates CASCADE;

-- ============================================
-- STEP 6: Remove columns from churches
-- ============================================

ALTER TABLE churches DROP COLUMN IF EXISTS journey_template_id;
ALTER TABLE churches DROP COLUMN IF EXISTS template_applied_at;

-- ============================================
-- STEP 7: Recreate church_hidden_milestones
-- ============================================

DROP TABLE IF EXISTS church_hidden_milestones CASCADE;

CREATE TABLE church_hidden_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    hidden_at TIMESTAMPTZ DEFAULT NOW(),
    hidden_by TEXT,
    UNIQUE(church_id, milestone_id)
);

CREATE INDEX IF NOT EXISTS idx_church_hidden_milestones_church
ON church_hidden_milestones(church_id);

CREATE INDEX IF NOT EXISTS idx_church_hidden_milestones_milestone
ON church_hidden_milestones(milestone_id);

-- ============================================
-- STEP 8: Recreate foreign key constraints
-- ============================================

-- Only add if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'church_progress'::regclass
        AND conname = 'church_progress_milestone_id_fkey'
    ) THEN
        ALTER TABLE church_progress
        ADD CONSTRAINT church_progress_milestone_id_fkey
        FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint to church_progress';
    ELSE
        RAISE NOTICE 'FK constraint already exists on church_progress';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'milestone_attachments'::regclass
        AND conname = 'milestone_attachments_milestone_id_fkey'
    ) THEN
        ALTER TABLE milestone_attachments
        ADD CONSTRAINT milestone_attachments_milestone_id_fkey
        FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK constraint to milestone_attachments';
    ELSE
        RAISE NOTICE 'FK constraint already exists on milestone_attachments';
    END IF;
END $$;

-- ============================================
-- Verification
-- ============================================

SELECT 'Final state:' as info;

SELECT 'milestones' as table_name, COUNT(*) as count FROM milestones
UNION ALL
SELECT 'church_progress', COUNT(*) FROM church_progress
UNION ALL
SELECT 'milestone_attachments', COUNT(*) FROM milestone_attachments
UNION ALL
SELECT 'church_hidden_milestones', COUNT(*) FROM church_hidden_milestones;

SELECT 'Final constraints on church_progress:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'church_progress'::regclass
AND contype = 'f';

-- If this shows the constraint pointing to milestones(id), you're ready to run 032
