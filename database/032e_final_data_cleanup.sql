-- 032e: Final data cleanup
-- The constraint is correct, but there's orphaned data

-- ============================================
-- STEP 1: Check the orphaned records
-- ============================================

SELECT 'Orphaned church_progress records:' as info;
SELECT cp.id, cp.church_id, cp.milestone_id
FROM church_progress cp
WHERE NOT EXISTS (SELECT 1 FROM milestones m WHERE m.id = cp.milestone_id)
LIMIT 10;

SELECT 'Total orphaned:' as info, COUNT(*) as count
FROM church_progress cp
WHERE NOT EXISTS (SELECT 1 FROM milestones m WHERE m.id = cp.milestone_id);

-- ============================================
-- STEP 2: Delete the orphaned records
-- ============================================

DELETE FROM church_progress
WHERE NOT EXISTS (SELECT 1 FROM milestones m WHERE m.id = church_progress.milestone_id);

-- ============================================
-- STEP 3: Clean up other tables too
-- ============================================

DELETE FROM milestone_attachments
WHERE NOT EXISTS (SELECT 1 FROM milestones m WHERE m.id = milestone_attachments.milestone_id);

UPDATE scheduled_calls
SET milestone_id = NULL
WHERE milestone_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM milestones m WHERE m.id = scheduled_calls.milestone_id);

UPDATE notification_log
SET milestone_id = NULL
WHERE milestone_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM milestones m WHERE m.id = notification_log.milestone_id);

-- ============================================
-- STEP 4: Verify clean state
-- ============================================

SELECT 'After cleanup - orphaned count:' as info, COUNT(*) as count
FROM church_progress cp
WHERE NOT EXISTS (SELECT 1 FROM milestones m WHERE m.id = cp.milestone_id);

SELECT 'Final counts:' as info;
SELECT 'milestones' as table_name, COUNT(*) as count FROM milestones
UNION ALL
SELECT 'church_progress', COUNT(*) FROM church_progress
UNION ALL
SELECT 'milestone_attachments', COUNT(*) FROM milestone_attachments;

-- Now you should be able to run migration 032
