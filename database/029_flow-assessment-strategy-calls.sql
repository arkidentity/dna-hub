-- Migration 029: Rename Dam Assessment to Flow Assessment + Add Strategy Call Milestones
-- This migration:
-- 1. Renames all "Dam Assessment" references to "Flow Assessment" in milestones
-- 2. Adds strategy call milestones to each phase (1-5)

-- ============================================
-- PART 1: Rename Dam Assessment to Flow Assessment
-- ============================================

-- Update milestone titles
UPDATE milestones
SET title = REPLACE(title, 'Dam Assessment', 'Flow Assessment')
WHERE title LIKE '%Dam Assessment%';

-- Update milestone descriptions
UPDATE milestones
SET description = REPLACE(description, 'Dam Assessment', 'Flow Assessment')
WHERE description LIKE '%Dam Assessment%';

-- Also handle lowercase variations
UPDATE milestones
SET title = REPLACE(title, 'dam assessment', 'Flow Assessment')
WHERE title ILIKE '%dam assessment%';

UPDATE milestones
SET description = REPLACE(description, 'dam assessment', 'Flow Assessment')
WHERE description ILIKE '%dam assessment%';

-- ============================================
-- PART 2: Add Strategy Call Milestones to Each Phase
-- ============================================

-- Phase 1: Church Partnership - Add 2 strategy calls
INSERT INTO milestones (phase_id, title, description, display_order, is_key_milestone, church_id)
SELECT
  p.id,
  'Strategy Call 1',
  'First strategy session to discuss Phase 1 progress, answer questions, and plan next steps.',
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM milestones WHERE phase_id = p.id AND church_id IS NULL),
  false,
  NULL
FROM phases p
WHERE p.phase_number = 1
AND NOT EXISTS (
  SELECT 1 FROM milestones m
  WHERE m.phase_id = p.id
  AND m.title = 'Strategy Call 1'
  AND m.church_id IS NULL
);

INSERT INTO milestones (phase_id, title, description, display_order, is_key_milestone, church_id)
SELECT
  p.id,
  'Strategy Call 2',
  'Second strategy session to review Flow Assessment results and prepare for Phase 2.',
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM milestones WHERE phase_id = p.id AND church_id IS NULL),
  false,
  NULL
FROM phases p
WHERE p.phase_number = 1
AND NOT EXISTS (
  SELECT 1 FROM milestones m
  WHERE m.phase_id = p.id
  AND m.title = 'Strategy Call 2'
  AND m.church_id IS NULL
);

-- Phase 2: Leader Preparation - Add 2 strategy calls
INSERT INTO milestones (phase_id, title, description, display_order, is_key_milestone, church_id)
SELECT
  p.id,
  'Strategy Call 1',
  'First strategy session to discuss leader confirmation and co-leader pairing.',
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM milestones WHERE phase_id = p.id AND church_id IS NULL),
  false,
  NULL
FROM phases p
WHERE p.phase_number = 2
AND NOT EXISTS (
  SELECT 1 FROM milestones m
  WHERE m.phase_id = p.id
  AND m.title = 'Strategy Call 1'
  AND m.church_id IS NULL
);

INSERT INTO milestones (phase_id, title, description, display_order, is_key_milestone, church_id)
SELECT
  p.id,
  'Strategy Call 2',
  'Second strategy session to finalize leader teams and prepare for DNA Manual training.',
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM milestones WHERE phase_id = p.id AND church_id IS NULL),
  false,
  NULL
FROM phases p
WHERE p.phase_number = 2
AND NOT EXISTS (
  SELECT 1 FROM milestones m
  WHERE m.phase_id = p.id
  AND m.title = 'Strategy Call 2'
  AND m.church_id IS NULL
);

-- Phase 3: DNA Foundation - Add 2 strategy calls
INSERT INTO milestones (phase_id, title, description, display_order, is_key_milestone, church_id)
SELECT
  p.id,
  'Strategy Call 1',
  'First strategy session to check DNA Manual progress and address questions.',
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM milestones WHERE phase_id = p.id AND church_id IS NULL),
  false,
  NULL
FROM phases p
WHERE p.phase_number = 3
AND NOT EXISTS (
  SELECT 1 FROM milestones m
  WHERE m.phase_id = p.id
  AND m.title = 'Strategy Call 1'
  AND m.church_id IS NULL
);

INSERT INTO milestones (phase_id, title, description, display_order, is_key_milestone, church_id)
SELECT
  p.id,
  'Strategy Call 2',
  'Second strategy session to review DNA Manual completion and prepare for Launch Guide.',
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM milestones WHERE phase_id = p.id AND church_id IS NULL),
  false,
  NULL
FROM phases p
WHERE p.phase_number = 3
AND NOT EXISTS (
  SELECT 1 FROM milestones m
  WHERE m.phase_id = p.id
  AND m.title = 'Strategy Call 2'
  AND m.church_id IS NULL
);

-- Phase 4: Practical Preparation - Add 2 strategy calls
INSERT INTO milestones (phase_id, title, description, display_order, is_key_milestone, church_id)
SELECT
  p.id,
  'Strategy Call 1',
  'First strategy session to review Launch Guide progress and disciple recruitment.',
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM milestones WHERE phase_id = p.id AND church_id IS NULL),
  false,
  NULL
FROM phases p
WHERE p.phase_number = 4
AND NOT EXISTS (
  SELECT 1 FROM milestones m
  WHERE m.phase_id = p.id
  AND m.title = 'Strategy Call 1'
  AND m.church_id IS NULL
);

INSERT INTO milestones (phase_id, title, description, display_order, is_key_milestone, church_id)
SELECT
  p.id,
  'Strategy Call 2',
  'Second strategy session to finalize logistics and prepare for launch validation.',
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM milestones WHERE phase_id = p.id AND church_id IS NULL),
  false,
  NULL
FROM phases p
WHERE p.phase_number = 4
AND NOT EXISTS (
  SELECT 1 FROM milestones m
  WHERE m.phase_id = p.id
  AND m.title = 'Strategy Call 2'
  AND m.church_id IS NULL
);

-- Phase 5: Final Validation & Launch - Add 2 strategy calls
INSERT INTO milestones (phase_id, title, description, display_order, is_key_milestone, church_id)
SELECT
  p.id,
  'Strategy Call 1',
  'First strategy session to review launch readiness and address any final concerns.',
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM milestones WHERE phase_id = p.id AND church_id IS NULL),
  false,
  NULL
FROM phases p
WHERE p.phase_number = 5
AND NOT EXISTS (
  SELECT 1 FROM milestones m
  WHERE m.phase_id = p.id
  AND m.title = 'Strategy Call 1'
  AND m.church_id IS NULL
);

INSERT INTO milestones (phase_id, title, description, display_order, is_key_milestone, church_id)
SELECT
  p.id,
  'Strategy Call 2',
  'Final strategy session to celebrate launch and plan ongoing support.',
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM milestones WHERE phase_id = p.id AND church_id IS NULL),
  false,
  NULL
FROM phases p
WHERE p.phase_number = 5
AND NOT EXISTS (
  SELECT 1 FROM milestones m
  WHERE m.phase_id = p.id
  AND m.title = 'Strategy Call 2'
  AND m.church_id IS NULL
);

-- ============================================
-- Verification queries (run these to confirm)
-- ============================================

-- Check renamed milestones:
-- SELECT id, title, description FROM milestones WHERE title LIKE '%Flow Assessment%' OR description LIKE '%Flow Assessment%';

-- Check strategy call milestones:
-- SELECT p.phase_number, p.name, m.title, m.display_order
-- FROM milestones m
-- JOIN phases p ON m.phase_id = p.id
-- WHERE m.title LIKE 'Strategy Call%' AND m.church_id IS NULL
-- ORDER BY p.phase_number, m.display_order;
