-- 032f: Diagnostic script - run this to understand the current state

-- ============================================
-- 1. Check ALL constraints on church_progress (not just foreign keys)
-- ============================================

SELECT 'ALL constraints on church_progress:' as info;
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'church_progress'::regclass;

-- ============================================
-- 2. Check if church_milestones table exists
-- ============================================

SELECT 'Does church_milestones exist?:' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'church_milestones'
) as church_milestones_exists;

-- ============================================
-- 3. Check all tables in public schema with 'milestone' in name
-- ============================================

SELECT 'Tables with milestone in name:' as info;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%milestone%';

-- ============================================
-- 4. Check for triggers on church_progress
-- ============================================

SELECT 'Triggers on church_progress:' as info;
SELECT tgname, tgtype, tgenabled, pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'church_progress'::regclass;

-- ============================================
-- 5. Check the specific milestone_id that's failing
-- ============================================

SELECT 'Checking the failing milestone_id:' as info;
SELECT '62c96ceb-0a77-40fc-a7a3-f793c670b734' as failing_id;

-- Is it in milestones?
SELECT 'In milestones table:' as info;
SELECT EXISTS (
    SELECT 1 FROM milestones WHERE id = '62c96ceb-0a77-40fc-a7a3-f793c670b734'
) as in_milestones;

-- Is it in church_progress?
SELECT 'In church_progress:' as info;
SELECT * FROM church_progress
WHERE milestone_id = '62c96ceb-0a77-40fc-a7a3-f793c670b734';

-- ============================================
-- 6. Count orphaned records
-- ============================================

SELECT 'Orphaned church_progress records (referencing non-existent milestones):' as info;
SELECT COUNT(*) as orphan_count
FROM church_progress cp
WHERE NOT EXISTS (SELECT 1 FROM milestones m WHERE m.id = cp.milestone_id);

-- ============================================
-- 7. Check if there's a view or function involved
-- ============================================

SELECT 'Views referencing church_progress:' as info;
SELECT viewname FROM pg_views
WHERE definition LIKE '%church_progress%'
AND schemaname = 'public';

-- ============================================
-- 8. List the first 5 orphaned milestone_ids
-- ============================================

SELECT 'First 5 orphaned milestone_ids:' as info;
SELECT DISTINCT cp.milestone_id
FROM church_progress cp
WHERE NOT EXISTS (SELECT 1 FROM milestones m WHERE m.id = cp.milestone_id)
LIMIT 5;
