-- Migration 026: Training Auth Unification
-- Migrates training data from Supabase Auth (auth.users) to unified users table
-- This allows training participants to use the same login as church/DNA leaders

-- ============================================================================
-- STEP 1: Create new training tables linked to unified users
-- ============================================================================

-- Training progress (replaces dna_leader_journeys for unified users)
CREATE TABLE IF NOT EXISTS user_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Current stage in the DNA Leader journey
  current_stage TEXT NOT NULL DEFAULT 'onboarding',
  -- Options: 'onboarding', 'training', 'launching', 'growing', 'multiplying'

  stage_started_at TIMESTAMPTZ DEFAULT NOW(),

  -- Milestone achievements (unlocks resources progressively)
  milestones JSONB DEFAULT '{}'::jsonb,
  -- Example:
  -- {
  --   "flow_assessment_complete": { "completed": true, "completed_at": "2026-01-30T10:00:00Z" },
  --   "manual_complete": { "completed": true, "completed_at": "2026-02-15T14:30:00Z" },
  --   "launch_guide_reviewed": { "completed": false },
  --   "first_group_created": { "completed": false }
  -- }

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_training_progress_user_id ON user_training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_training_progress_stage ON user_training_progress(current_stage);

-- Content unlocks for unified users
CREATE TABLE IF NOT EXISTS user_content_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Content identifier
  content_type TEXT NOT NULL,
  -- Options: 'flow_assessment', 'manual_session_1', 'manual_session_2', ...,
  --          'launch_guide', 'toolkit_90day', 'advanced_resources'

  -- Unlock status
  unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,

  -- What triggered the unlock
  unlock_trigger TEXT,
  -- Examples: 'flow_assessment_complete', 'manual_complete', 'first_group_created', 'signup'

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, content_type)
);

CREATE INDEX IF NOT EXISTS idx_user_content_unlocks_user_id ON user_content_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_unlocks_type ON user_content_unlocks(content_type);

-- Flow assessments for unified users
CREATE TABLE IF NOT EXISTS user_flow_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Assessment responses (1-5 ratings for each roadblock)
  roadblock_ratings JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Reflections (text responses to questions)
  reflections JSONB DEFAULT '{}'::jsonb,

  -- Top 2-3 roadblocks identified
  top_roadblocks TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Action plan for top roadblocks
  action_plan JSONB DEFAULT '{}'::jsonb,

  -- Accountability
  accountability_partner TEXT,
  accountability_date DATE,

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'completed'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Retake tracking (assessment can be retaken after 3 months)
  previous_assessment_id UUID REFERENCES user_flow_assessments(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_flow_assessments_user_id ON user_flow_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flow_assessments_status ON user_flow_assessments(status);
CREATE INDEX IF NOT EXISTS idx_user_flow_assessments_completed ON user_flow_assessments(completed_at);

-- ============================================================================
-- STEP 2: Add training_participant role support
-- ============================================================================

-- The role was already added in 025, but ensure constraint allows it
-- (This is a no-op if already correct)
DO $$
BEGIN
  -- Check if constraint exists and update if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_roles_role_check'
  ) THEN
    ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
  END IF;

  -- Add constraint with all roles
  ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
    CHECK (role IN ('church_leader', 'dna_leader', 'training_participant', 'admin'));
EXCEPTION WHEN OTHERS THEN
  -- Constraint might already be correct, that's fine
  NULL;
END $$;

-- ============================================================================
-- STEP 3: Migrate existing training participants from Supabase Auth
-- ============================================================================

-- First, find all users in Supabase Auth that have training data
-- and create them in the unified users table if they don't exist

-- Migrate from dna_leader_journeys (uses auth.users)
DO $$
DECLARE
  auth_user RECORD;
  unified_user_id UUID;
BEGIN
  -- Loop through auth users that have journey data
  FOR auth_user IN
    SELECT DISTINCT
      au.id as auth_id,
      au.email,
      au.raw_user_meta_data->>'name' as name,
      dlj.current_stage,
      dlj.milestones,
      dlj.stage_started_at
    FROM auth.users au
    JOIN dna_leader_journeys dlj ON dlj.user_id = au.id
    WHERE au.email IS NOT NULL
  LOOP
    -- Get or create user in unified users table
    SELECT id INTO unified_user_id FROM users WHERE email = auth_user.email;

    IF unified_user_id IS NULL THEN
      INSERT INTO users (email, name)
      VALUES (auth_user.email, auth_user.name)
      RETURNING id INTO unified_user_id;
    END IF;

    -- Add training_participant role if not exists
    INSERT INTO user_roles (user_id, role)
    VALUES (unified_user_id, 'training_participant')
    ON CONFLICT (user_id, role) WHERE church_id IS NULL DO NOTHING;

    -- Migrate training progress
    INSERT INTO user_training_progress (user_id, current_stage, milestones, stage_started_at)
    VALUES (unified_user_id, auth_user.current_stage, auth_user.milestones, auth_user.stage_started_at)
    ON CONFLICT (user_id) DO UPDATE SET
      current_stage = EXCLUDED.current_stage,
      milestones = EXCLUDED.milestones,
      updated_at = NOW();
  END LOOP;
END $$;

-- Migrate content unlocks from dna_content_unlocks
DO $$
DECLARE
  unlock_record RECORD;
  unified_user_id UUID;
BEGIN
  FOR unlock_record IN
    SELECT
      au.email,
      dcu.content_type,
      dcu.unlocked,
      dcu.unlocked_at,
      dcu.unlock_trigger
    FROM auth.users au
    JOIN dna_content_unlocks dcu ON dcu.user_id = au.id
    WHERE au.email IS NOT NULL
  LOOP
    -- Get user ID from unified users table
    SELECT id INTO unified_user_id FROM users WHERE email = unlock_record.email;

    IF unified_user_id IS NOT NULL THEN
      INSERT INTO user_content_unlocks (user_id, content_type, unlocked, unlocked_at, unlock_trigger)
      VALUES (unified_user_id, unlock_record.content_type, unlock_record.unlocked, unlock_record.unlocked_at, unlock_record.unlock_trigger)
      ON CONFLICT (user_id, content_type) DO UPDATE SET
        unlocked = EXCLUDED.unlocked,
        unlocked_at = EXCLUDED.unlocked_at;
    END IF;
  END LOOP;
END $$;

-- Migrate flow assessments from dna_flow_assessments
DO $$
DECLARE
  assessment_record RECORD;
  unified_user_id UUID;
BEGIN
  FOR assessment_record IN
    SELECT
      au.email,
      dfa.roadblock_ratings,
      dfa.reflections,
      dfa.top_roadblocks,
      dfa.action_plan,
      dfa.accountability_partner,
      dfa.accountability_date,
      dfa.is_draft,
      dfa.completed_at,
      dfa.created_at
    FROM auth.users au
    JOIN dna_flow_assessments dfa ON dfa.user_id = au.id
    WHERE au.email IS NOT NULL
  LOOP
    -- Get user ID from unified users table
    SELECT id INTO unified_user_id FROM users WHERE email = assessment_record.email;

    IF unified_user_id IS NOT NULL THEN
      INSERT INTO user_flow_assessments (
        user_id,
        roadblock_ratings,
        reflections,
        top_roadblocks,
        action_plan,
        accountability_partner,
        accountability_date,
        status,
        completed_at,
        created_at
      )
      VALUES (
        unified_user_id,
        assessment_record.roadblock_ratings,
        assessment_record.reflections,
        assessment_record.top_roadblocks,
        assessment_record.action_plan,
        assessment_record.accountability_partner,
        assessment_record.accountability_date,
        CASE WHEN assessment_record.is_draft THEN 'draft' ELSE 'completed' END,
        assessment_record.completed_at,
        assessment_record.created_at
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 4: Initialize training progress for existing users without it
-- ============================================================================

-- Any user with training_participant role should have training progress
INSERT INTO user_training_progress (user_id, current_stage)
SELECT DISTINCT ur.user_id, 'onboarding'
FROM user_roles ur
WHERE ur.role = 'training_participant'
  AND NOT EXISTS (
    SELECT 1 FROM user_training_progress utp WHERE utp.user_id = ur.user_id
  );

-- Initialize flow_assessment unlock for all training participants
INSERT INTO user_content_unlocks (user_id, content_type, unlocked, unlocked_at, unlock_trigger)
SELECT DISTINCT ur.user_id, 'flow_assessment', true, NOW(), 'signup'
FROM user_roles ur
WHERE ur.role = 'training_participant'
  AND NOT EXISTS (
    SELECT 1 FROM user_content_unlocks ucu
    WHERE ucu.user_id = ur.user_id AND ucu.content_type = 'flow_assessment'
  );

-- ============================================================================
-- STEP 5: Create helper function for initializing new training users
-- ============================================================================

CREATE OR REPLACE FUNCTION initialize_training_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Create training progress record
  INSERT INTO user_training_progress (user_id, current_stage)
  VALUES (p_user_id, 'onboarding')
  ON CONFLICT (user_id) DO NOTHING;

  -- Unlock flow assessment (first step in training)
  INSERT INTO user_content_unlocks (user_id, content_type, unlocked, unlocked_at, unlock_trigger)
  VALUES (p_user_id, 'flow_assessment', true, NOW(), 'signup')
  ON CONFLICT (user_id, content_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: Comments
-- ============================================================================

COMMENT ON TABLE user_training_progress IS 'Training journey progress for unified users';
COMMENT ON TABLE user_content_unlocks IS 'Content unlock status for unified users';
COMMENT ON TABLE user_flow_assessments IS 'Flow Assessment responses for unified users';
COMMENT ON FUNCTION initialize_training_user(UUID) IS 'Initialize training data for a new training participant';

-- ============================================================================
-- NOTE: Old tables (dna_leader_journeys, dna_content_unlocks, dna_flow_assessments)
-- are kept for now but will be deprecated. They reference auth.users(id).
-- After verifying the migration, you can drop them in a future migration.
-- ============================================================================
