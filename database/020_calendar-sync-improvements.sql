-- Migration: Calendar Sync Improvements
-- Description: Expand call_type constraint, add church aliases for better matching
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. Expand call_type constraint to include all supported call types
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE scheduled_calls
DROP CONSTRAINT IF EXISTS scheduled_calls_call_type_check;

-- Add new constraint with all call types
ALTER TABLE scheduled_calls
ADD CONSTRAINT scheduled_calls_call_type_check
CHECK (call_type IN ('discovery', 'proposal', 'strategy', 'kickoff', 'assessment', 'onboarding', 'checkin'));

-- ============================================================================
-- 2. Add aliases column to churches for flexible name matching
-- ============================================================================

-- Add aliases array column (e.g., ['BLVD', 'Boulevard'] for Boulevard Church)
ALTER TABLE churches
ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';

-- Create index for faster alias lookups (using GIN for array containment queries)
CREATE INDEX IF NOT EXISTS idx_churches_aliases ON churches USING GIN (aliases);

-- ============================================================================
-- 3. Add detected_call_type to unmatched_calendar_events
-- ============================================================================

-- Store the detected call type so admins know what type of call it is
ALTER TABLE unmatched_calendar_events
ADD COLUMN IF NOT EXISTS detected_call_type TEXT;

-- ============================================================================
-- 4. Create function to check for duplicate completed calls
-- ============================================================================

-- Function to check if a call type should be blocked due to existing completed call
CREATE OR REPLACE FUNCTION should_block_duplicate_call(
  p_church_id UUID,
  p_call_type TEXT,
  p_google_event_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_existing_count INTEGER;
BEGIN
  -- Only block duplicates for discovery, proposal, and kickoff
  IF p_call_type NOT IN ('discovery', 'proposal', 'kickoff') THEN
    RETURN FALSE;
  END IF;

  -- Check for existing completed calls of this type
  -- Exclude the current event if it's an update (same google_event_id)
  SELECT COUNT(*) INTO v_existing_count
  FROM scheduled_calls
  WHERE church_id = p_church_id
    AND call_type = p_call_type
    AND completed = true
    AND (p_google_event_id IS NULL OR google_event_id != p_google_event_id);

  RETURN v_existing_count > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. Add comment documentation
-- ============================================================================

COMMENT ON COLUMN churches.aliases IS 'Alternative names/abbreviations for matching calendar events (e.g., ["BLVD"] for Boulevard Church)';
COMMENT ON COLUMN unmatched_calendar_events.detected_call_type IS 'The detected call type (discovery, proposal, etc.) for this unmatched event';
COMMENT ON FUNCTION should_block_duplicate_call IS 'Returns true if a new call should be blocked because a completed call of the same type already exists';

-- ============================================================================
-- Migration complete!
-- ============================================================================

-- Summary:
-- ✅ Expanded call_type constraint to include: kickoff, assessment, onboarding, checkin
-- ✅ Added aliases column to churches for flexible name matching
-- ✅ Added detected_call_type to unmatched_calendar_events
-- ✅ Created helper function for duplicate call prevention
