-- Migration: Simplify Fireflies Integration for AI Meeting Notes Only
-- Description: Remove full transcript storage, keep only AI summaries + action items
--              Add milestone linking and church notes capability

-- ============================================================================
-- 1. Drop unnecessary tables (full transcript storage)
-- ============================================================================

-- Drop tables we don't need (full transcripts, unmatched meetings, etc.)
DROP TABLE IF EXISTS meeting_transcripts CASCADE;
DROP TABLE IF EXISTS unmatched_fireflies_meetings CASCADE;

-- Keep fireflies_webhook_log for debugging
-- Keep fireflies_settings for API configuration

-- ============================================================================
-- 2. Update scheduled_calls table for milestone linking
-- ============================================================================

-- Add milestone_id to link meetings to specific milestones
ALTER TABLE scheduled_calls
ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL;

-- Create index for faster milestone lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_milestone_id
ON scheduled_calls(milestone_id);

-- ============================================================================
-- 3. Update church_progress table for church notes
-- ============================================================================

-- Add church_notes field so churches can add their own notes to milestones
ALTER TABLE church_progress
ADD COLUMN IF NOT EXISTS church_notes TEXT;

-- ============================================================================
-- 4. Update fireflies_settings for simplified workflow
-- ============================================================================

-- Remove auto_share_with_churches (we'll make this admin-controlled per call)
ALTER TABLE fireflies_settings
DROP COLUMN IF EXISTS auto_share_with_churches;

-- ============================================================================
-- 5. Update RLS policies for church notes
-- ============================================================================

-- Allow churches to update their own notes in church_progress
DROP POLICY IF EXISTS church_progress_church_update ON church_progress;

CREATE POLICY church_progress_church_update ON church_progress
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM church_leaders cl
      WHERE cl.church_id = church_progress.church_id
        AND cl.email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM church_leaders cl
      WHERE cl.church_id = church_progress.church_id
        AND cl.email = auth.jwt() ->> 'email'
    )
  );

-- ============================================================================
-- 6. Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN scheduled_calls.milestone_id IS 'Links this call to a specific milestone in the DNA journey';
COMMENT ON COLUMN scheduled_calls.ai_summary IS 'AI-generated meeting summary from Fireflies (admin only, until approved)';
COMMENT ON COLUMN scheduled_calls.action_items IS 'AI-extracted action items from Fireflies meeting';
COMMENT ON COLUMN scheduled_calls.visible_to_church IS 'Whether church can view the AI meeting notes';
COMMENT ON COLUMN church_progress.church_notes IS 'Church-written notes for this milestone (separate from AI notes)';

-- ============================================================================
-- 7. Update webhook log structure
-- ============================================================================

-- Add milestone_id to webhook log for tracking
ALTER TABLE fireflies_webhook_log
ADD COLUMN IF NOT EXISTS matched_milestone_id UUID REFERENCES milestones(id);

-- ============================================================================
-- 8. Migration complete!
-- ============================================================================

-- Summary:
-- ✅ Removed meeting_transcripts table (don't store full transcripts)
-- ✅ Removed unmatched_fireflies_meetings table (simpler workflow)
-- ✅ Added milestone_id to scheduled_calls (link notes to milestones)
-- ✅ Added church_notes to church_progress (churches can add their notes)
-- ✅ Updated RLS policies (churches can edit their notes)
-- ✅ Kept fireflies_webhook_log (debugging)
-- ✅ Kept fireflies_settings (API config)
