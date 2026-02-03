-- Migration 031: Cleanup Dam Assessment references + Remove default strategy call milestones
-- This migration:
-- 1. Fixes remaining "Dam Assessment" references in phase descriptions
-- 2. Removes default strategy call milestones from phases 1-5 (admin will add custom calls)

-- ============================================
-- PART 1: Fix Dam Assessment in Phase Descriptions
-- ============================================

-- Phase 1 description
UPDATE phases
SET description = 'Establish the foundation for DNA implementation. Align church leadership, identify your DNA champion, and prepare potential leaders through the Flow Assessment process.'
WHERE phase_number = 1;

-- Phase 2 description
UPDATE phases
SET description = 'Finalize your DNA leader team. Confirm committed leaders from the Flow Assessment process, pair them with co-leaders, and prepare for DNA Manual training.'
WHERE phase_number = 2;

-- ============================================
-- PART 2: Fix Dam Assessment in Milestone Titles and Descriptions
-- ============================================

-- Update any remaining milestone titles (case-insensitive)
UPDATE milestones
SET title = REPLACE(title, 'Dam Assessment', 'Flow Assessment')
WHERE title ILIKE '%Dam Assessment%';

UPDATE milestones
SET title = REPLACE(title, 'dam assessment', 'Flow Assessment')
WHERE title ILIKE '%dam assessment%';

-- Update any remaining milestone descriptions
UPDATE milestones
SET description = REPLACE(description, 'Dam Assessment', 'Flow Assessment')
WHERE description ILIKE '%Dam Assessment%';

UPDATE milestones
SET description = REPLACE(description, 'dam assessment', 'Flow Assessment')
WHERE description ILIKE '%dam assessment%';

-- Also fix "Dam Debrief" references
UPDATE milestones
SET title = REPLACE(title, 'Dam Assessment Debrief', 'Flow Assessment Debrief')
WHERE title ILIKE '%Dam Assessment Debrief%';

UPDATE milestones
SET description = REPLACE(description, 'Dam Assessment', 'Flow Assessment')
WHERE description ILIKE '%Dam Assessment%';

-- ============================================
-- PART 3: Remove Default Strategy Call Milestones
-- ============================================

-- Delete template strategy call milestones from all phases
-- These are template milestones (church_id IS NULL)
-- Admin will add custom call milestones as needed per church

DELETE FROM milestones
WHERE title IN ('Strategy Call 1', 'Strategy Call 2')
AND church_id IS NULL;

-- Also delete the old Phase 0 "Strategy Call" or "Strategy Call Notes" template if it exists
DELETE FROM milestones
WHERE title IN ('Strategy Call', 'Strategy Call Notes')
AND church_id IS NULL;

-- ============================================
-- Verification queries (run these to confirm)
-- ============================================

-- Check for any remaining Dam Assessment references:
-- SELECT id, title, description FROM milestones WHERE title ILIKE '%dam%' OR description ILIKE '%dam%';
-- SELECT phase_number, description FROM phases WHERE description ILIKE '%dam%';

-- Check strategy call milestones are gone (should return empty for templates):
-- SELECT p.phase_number, m.title, m.church_id
-- FROM milestones m
-- JOIN phases p ON m.phase_id = p.id
-- WHERE m.title ILIKE '%strategy call%' AND m.church_id IS NULL;

-- Note: Custom strategy call milestones (church_id IS NOT NULL) are preserved
