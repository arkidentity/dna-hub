-- Migration 032 Verification Script
-- Run this to confirm everything migrated correctly

-- 1. Check journey_templates was created
SELECT '1. Journey Templates:' as section;
SELECT * FROM journey_templates;

-- 2. Check template_milestones (should have Phase 0 & 1 milestones)
SELECT '2. Template Milestones:' as section;
SELECT tm.title, p.name as phase_name, p.phase_number, tm.display_order, tm.is_key_milestone
FROM template_milestones tm
JOIN phases p ON tm.phase_id = p.id
ORDER BY p.phase_number, tm.display_order;

-- 3. Check church_milestones per church
SELECT '3. Church Milestones Count:' as section;
SELECT c.name as church_name, c.status, COUNT(cm.id) as milestone_count
FROM churches c
LEFT JOIN church_milestones cm ON cm.church_id = c.id
GROUP BY c.id, c.name, c.status
ORDER BY c.name;

-- 4. Check church_progress still has valid data
SELECT '4. Church Progress Count:' as section;
SELECT c.name, COUNT(cp.id) as progress_records,
       SUM(CASE WHEN cp.completed THEN 1 ELSE 0 END) as completed_count
FROM churches c
LEFT JOIN church_progress cp ON cp.church_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;

-- 5. Verify FK constraints are correct
SELECT '5. FK Constraints on church_progress:' as section;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'church_progress'::regclass
AND contype = 'f';

-- 6. Check milestones_deprecated exists (old table renamed)
SELECT '6. Deprecated tables:' as section;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%deprecated%';

-- 7. Check churches have template applied
SELECT '7. Churches with template applied:' as section;
SELECT name, status, journey_template_id IS NOT NULL as has_template, template_applied_at
FROM churches
ORDER BY name;
