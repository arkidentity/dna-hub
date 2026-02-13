-- ============================================
-- Migration 057: Fix Recurring Event Duplicates
--
-- Problem: Old recurring events where the parent row was stored
-- with is_recurring = false (before the fix), causing it to appear
-- alongside its instances in the GroupMeetings component which
-- filters on is_recurring = false.
--
-- Two scenarios to fix:
--
-- 1. Parent rows with is_recurring = false but have child instances
--    (parent_event_id pointing to them) → mark parent as is_recurring = true
--
-- 2. True duplicates — two rows with the same start_time, same group_id,
--    same title, and one has parent_event_id (instance) and one doesn't
--    (old-style parent stored incorrectly as is_recurring = false)
--    → delete the duplicate parent row
-- ============================================

-- Step 1: Fix parent rows that have children but are marked is_recurring = false
UPDATE dna_calendar_events
SET is_recurring = true
WHERE id IN (
  -- Find any row that has children pointing to it (i.e. it IS a parent)
  SELECT DISTINCT parent_event_id
  FROM dna_calendar_events
  WHERE parent_event_id IS NOT NULL
)
AND is_recurring = false;

-- Step 2: Log how many rows were fixed (informational)
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM dna_calendar_events
  WHERE id IN (
    SELECT DISTINCT parent_event_id
    FROM dna_calendar_events
    WHERE parent_event_id IS NOT NULL
  )
  AND is_recurring = true
  AND updated_at > NOW() - INTERVAL '1 minute';

  RAISE NOTICE 'Fixed % parent recurring event rows', fixed_count;
END $$;
