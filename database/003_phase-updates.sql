-- DNA Church Hub - Phase 1 & 2 Milestone Updates
-- Run this in your Supabase SQL Editor
-- Created: January 2026

-- =====================
-- STEP 1: Add target_date to church_progress
-- =====================
ALTER TABLE church_progress ADD COLUMN IF NOT EXISTS target_date DATE;

-- =====================
-- STEP 2: Delete old Phase 1 milestones
-- =====================
DELETE FROM milestones WHERE phase_id = (SELECT id FROM phases WHERE phase_number = 1);

-- =====================
-- STEP 3: Delete old Phase 2 milestones
-- =====================
DELETE FROM milestones WHERE phase_id = (SELECT id FROM phases WHERE phase_number = 2);

-- =====================
-- STEP 4: Insert new Phase 1 milestones
-- =====================
INSERT INTO milestones (phase_id, title, description, resource_type, display_order, is_key_milestone) VALUES
((SELECT id FROM phases WHERE phase_number = 1),
 'Vision Alignment Meeting',
 'Church leadership meets to align on DNA vision and commitment. Cast vision for multiplication discipleship and secure buy-in from key leaders.',
 NULL, 1, TRUE),

((SELECT id FROM phases WHERE phase_number = 1),
 'Identify Church DNA Champion',
 'Designate who will oversee DNA implementation at your church. This person will be the primary point of contact and accountability.',
 NULL, 2, FALSE),

((SELECT id FROM phases WHERE phase_number = 1),
 'Leaders Complete Dam Assessment',
 'Potential DNA leaders (4-6 people) take the Dam Assessment in the ARK app to identify internal obstacles to multiplication.',
 'link', 3, TRUE),

((SELECT id FROM phases WHERE phase_number = 1),
 'Review Pastor''s Guide to Dam Assessment',
 'Pastor/champion learns how to debrief the Dam Assessment with leaders. Understand how to have meaningful conversations about results.',
 'pdf', 4, FALSE),

((SELECT id FROM phases WHERE phase_number = 1),
 'Dam Assessment Debrief Meetings',
 'One-on-one meetings (30 min each) with each potential leader to discuss their Dam Assessment results, pray together, and assess readiness.',
 NULL, 5, TRUE);

-- =====================
-- STEP 5: Insert new Phase 2 milestones
-- =====================
INSERT INTO milestones (phase_id, title, description, resource_type, display_order, is_key_milestone) VALUES
((SELECT id FROM phases WHERE phase_number = 2),
 'Confirm Committed Leaders',
 'Based on Dam Assessment debriefs, confirm which leaders are ready and committed to move forward with DNA training.',
 NULL, 1, TRUE),

((SELECT id FROM phases WHERE phase_number = 2),
 'Pair Leaders with Co-Leaders',
 'Each DNA leader identifies and commits a co-leader partner. No solo leaders - this is essential for multiplication.',
 NULL, 2, FALSE),

((SELECT id FROM phases WHERE phase_number = 2),
 'Order DNA Manuals',
 'Order physical DNA Discipleship Manuals for each leader and co-leader.',
 'link', 3, FALSE),

((SELECT id FROM phases WHERE phase_number = 2),
 'Schedule DNA Manual Sessions',
 'Set dates for the 6-week DNA Manual cohort sessions. Block calendars and confirm all leaders can attend.',
 NULL, 4, TRUE);

-- =====================
-- STEP 6: Update Phase descriptions to match new flow
-- =====================
UPDATE phases
SET description = 'Establish the foundation for DNA implementation. Align church leadership, identify your DNA champion, and prepare potential leaders through the Dam Assessment process.'
WHERE phase_number = 1;

UPDATE phases
SET description = 'Finalize your DNA leader team. Confirm committed leaders from the Dam Assessment process, pair them with co-leaders, and prepare for DNA Manual training.',
    duration_weeks = 3
WHERE phase_number = 2;

-- =====================
-- VERIFICATION: Check the new milestones
-- =====================
-- Run this to verify:
-- SELECT p.phase_number, p.name as phase_name, m.display_order, m.title, m.is_key_milestone
-- FROM milestones m
-- JOIN phases p ON m.phase_id = p.id
-- WHERE p.phase_number IN (1, 2)
-- ORDER BY p.phase_number, m.display_order;
