-- =============================================
-- Migration 028: Launch Guide Support
-- Adds metadata column and updated_at to user_content_unlocks
-- for tracking checklist progress in Launch Guide phases
-- =============================================

-- Add metadata column to store additional progress data
-- This is used for:
-- - Launch Guide checklist items completed
-- - Phase completion status
-- - Manual lesson progress
ALTER TABLE user_content_unlocks
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add updated_at column for tracking last update time
ALTER TABLE user_content_unlocks
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comment explaining the metadata structure
COMMENT ON COLUMN user_content_unlocks.metadata IS 'JSON object for storing additional progress data. For launch guide phases: { checklistCompleted: string[], completed: boolean, completedAt: timestamp }. For manual sessions: { lessonsCompleted: number[], completed: boolean }';

-- Create index on metadata for JSONB queries if needed
CREATE INDEX IF NOT EXISTS idx_user_content_unlocks_metadata ON user_content_unlocks USING GIN (metadata);

-- =============================================
-- Update content_type options documentation
-- =============================================
-- Content types now include:
-- - 'flow_assessment' - Flow Assessment unlocked/completed
-- - 'manual_session_1' through 'manual_session_6' - DNA Manual sessions
-- - 'launch_guide' - Overall Launch Guide access
-- - 'launch_guide_phase_0' through 'launch_guide_phase_3' - Individual phases
-- - 'toolkit_90day' - 90-Day Toolkit
-- - 'advanced_resources' - Advanced resources section

-- =============================================
-- Unlock Launch Guide for users who completed the manual
-- =============================================
-- This ensures existing users who have completed the manual
-- can access the launch guide

INSERT INTO user_content_unlocks (user_id, content_type, unlocked, unlocked_at, unlock_trigger, metadata)
SELECT
  utp.user_id,
  'launch_guide',
  true,
  NOW(),
  'manual_complete',
  '{}'::jsonb
FROM user_training_progress utp
WHERE utp.milestones->>'manual_complete' IS NOT NULL
  AND (utp.milestones->'manual_complete'->>'completed')::boolean = true
  AND NOT EXISTS (
    SELECT 1 FROM user_content_unlocks ucu
    WHERE ucu.user_id = utp.user_id
    AND ucu.content_type = 'launch_guide'
  );

-- =============================================
-- Initialize phase 0 for users with launch guide access
-- =============================================
INSERT INTO user_content_unlocks (user_id, content_type, unlocked, unlocked_at, unlock_trigger, metadata)
SELECT
  ucu.user_id,
  'launch_guide_phase_0',
  true,
  NOW(),
  'launch_guide_unlocked',
  '{"checklistCompleted": []}'::jsonb
FROM user_content_unlocks ucu
WHERE ucu.content_type = 'launch_guide'
  AND ucu.unlocked = true
  AND NOT EXISTS (
    SELECT 1 FROM user_content_unlocks ucu2
    WHERE ucu2.user_id = ucu.user_id
    AND ucu2.content_type = 'launch_guide_phase_0'
  );

-- =============================================
-- Grant service role access (for API operations)
-- =============================================
-- Note: RLS policies should already exist from migration 026
-- but we ensure service role can update the new columns

-- Verify the table has proper service role access
DO $$
BEGIN
  -- Drop existing policy if it exists and recreate
  DROP POLICY IF EXISTS user_content_unlocks_service ON user_content_unlocks;

  CREATE POLICY user_content_unlocks_service ON user_content_unlocks
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION
  WHEN undefined_object THEN
    -- Policy doesn't exist, create it
    CREATE POLICY user_content_unlocks_service ON user_content_unlocks
      FOR ALL TO service_role USING (true) WITH CHECK (true);
END $$;
