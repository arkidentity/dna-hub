-- =====================================================
-- DNA TRAINING SYSTEM
-- =====================================================
-- Migration: 022
-- Description: Progressive SaaS platform for DNA Leader training
--              Supports Flow Assessment, DNA Manual, Launch Guide, 90-Day Toolkit
-- Created: 2026-01-30

-- =====================================================
-- TABLE: dna_leader_journeys
-- =====================================================
-- Tracks overall progression through DNA Leader training stages
-- Stages: 'onboarding' → 'training' → 'launching' → 'growing' → 'multiplying'

CREATE TABLE IF NOT EXISTS dna_leader_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

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
  --   "first_group_created": { "completed": false },
  --   "first_group_launched": { "completed": false },
  --   "first_multiplication": { "completed": false }
  -- }

  -- Achievement badges (for UI display, non-cheesy)
  badges JSONB DEFAULT '[]'::jsonb,
  -- Example: ["DNA Trained Leader", "Active Leader", "Multiplying Leader"]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Index for fast user lookups
CREATE INDEX idx_dna_leader_journeys_user_id ON dna_leader_journeys(user_id);
CREATE INDEX idx_dna_leader_journeys_stage ON dna_leader_journeys(current_stage);

-- =====================================================
-- TABLE: dna_training_modules
-- =====================================================
-- Tracks progress on individual training modules
-- Supports: Flow Assessment, DNA Manual (6 sessions), Launch Guide (5 phases), 90-Day Toolkit

CREATE TABLE IF NOT EXISTS dna_training_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Module type
  module_type TEXT NOT NULL,
  -- Options: 'flow_assessment', 'manual_session', 'launch_guide_phase', 'toolkit_week'

  -- Module identifier (e.g., 'session-1', 'phase-2', 'week-3')
  module_id TEXT NOT NULL,

  -- Completion status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Module-specific progress data (flexible JSONB for different module types)
  progress_data JSONB DEFAULT '{}'::jsonb,
  -- Examples:
  -- Flow Assessment: { "roadblock_ratings": {...}, "reflections": {...}, "action_plan": {...} }
  -- Manual Session: { "lessons_viewed": [...], "quiz_score": 85 }
  -- Launch Guide: { "checklist_items": [...], "notes": "..." }
  -- Toolkit Week: { "completed_activities": [...] }

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user per module
  UNIQUE(user_id, module_type, module_id)
);

-- Indexes for fast queries
CREATE INDEX idx_dna_training_modules_user_id ON dna_training_modules(user_id);
CREATE INDEX idx_dna_training_modules_type ON dna_training_modules(module_type);
CREATE INDEX idx_dna_training_modules_completed ON dna_training_modules(completed);
CREATE INDEX idx_dna_training_modules_user_type ON dna_training_modules(user_id, module_type);

-- =====================================================
-- TABLE: dna_flow_assessments
-- =====================================================
-- Stores Flow Assessment (7 Roadblocks) responses
-- Separate table for easier querying and comparison across retakes

CREATE TABLE IF NOT EXISTS dna_flow_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Assessment responses (1-5 ratings for each roadblock)
  roadblock_ratings JSONB NOT NULL,
  -- {
  --   "fear_of_failure": 4,
  --   "fear_of_conflict": 3,
  --   "fear_of_discomfort": 5,
  --   "fear_of_rejection": 2,
  --   "fear_of_loss_of_control": 4,
  --   "fear_of_financial_hardship": 1,
  --   "fear_of_change": 3
  -- }

  -- Reflections (text responses to questions)
  reflections JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "fear_of_failure": {
  --     "q1": "response...",
  --     "q2": "response...",
  --     ...
  --   },
  --   ...
  -- }

  -- Top 2-3 roadblocks identified
  top_roadblocks TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Action plan for top roadblocks
  action_plan JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "fear_of_failure": {
  --     "actions": ["Action 1", "Action 2"],
  --     "deadline": "2026-02-15"
  --   },
  --   ...
  -- }

  -- Accountability
  accountability_partner TEXT,
  accountability_date DATE,

  -- Draft vs. completed
  is_draft BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMPTZ,

  -- Retake tracking (assessment can be retaken after 3 months)
  previous_assessment_id UUID REFERENCES dna_flow_assessments(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_dna_flow_assessments_user_id ON dna_flow_assessments(user_id);
CREATE INDEX idx_dna_flow_assessments_completed ON dna_flow_assessments(completed_at);
CREATE INDEX idx_dna_flow_assessments_is_draft ON dna_flow_assessments(is_draft);

-- =====================================================
-- TABLE: dna_content_unlocks
-- =====================================================
-- Tracks which resources are unlocked for each user
-- Enables progressive content reveal

CREATE TABLE IF NOT EXISTS dna_content_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content identifier
  content_type TEXT NOT NULL,
  -- Options: 'flow_assessment', 'manual_session_1', 'manual_session_2', ...,
  --          'launch_guide', 'toolkit_90day', 'advanced_resources'

  -- Unlock status
  unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,

  -- What triggered the unlock
  unlock_trigger TEXT,
  -- Examples: 'flow_assessment_complete', 'manual_complete', 'first_group_created'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, content_type)
);

-- Indexes
CREATE INDEX idx_dna_content_unlocks_user_id ON dna_content_unlocks(user_id);
CREATE INDEX idx_dna_content_unlocks_unlocked ON dna_content_unlocks(unlocked);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE dna_leader_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_flow_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_content_unlocks ENABLE ROW LEVEL SECURITY;

-- dna_leader_journeys policies
CREATE POLICY "Users can view own journey"
  ON dna_leader_journeys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey"
  ON dna_leader_journeys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journey"
  ON dna_leader_journeys FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all journeys
CREATE POLICY "Admins can view all journeys"
  ON dna_leader_journeys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM church_leaders
      WHERE church_leaders.user_id = auth.uid()
      AND church_leaders.email IN ('thearkidentity@gmail.com', 'travis@arkidentity.com')
    )
  );

-- dna_training_modules policies
CREATE POLICY "Users can view own modules"
  ON dna_training_modules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own modules"
  ON dna_training_modules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own modules"
  ON dna_training_modules FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all modules
CREATE POLICY "Admins can view all modules"
  ON dna_training_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM church_leaders
      WHERE church_leaders.user_id = auth.uid()
      AND church_leaders.email IN ('thearkidentity@gmail.com', 'travis@arkidentity.com')
    )
  );

-- dna_flow_assessments policies
CREATE POLICY "Users can view own assessments"
  ON dna_flow_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON dna_flow_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments"
  ON dna_flow_assessments FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all assessments
CREATE POLICY "Admins can view all assessments"
  ON dna_flow_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM church_leaders
      WHERE church_leaders.user_id = auth.uid()
      AND church_leaders.email IN ('thearkidentity@gmail.com', 'travis@arkidentity.com')
    )
  );

-- dna_content_unlocks policies
CREATE POLICY "Users can view own unlocks"
  ON dna_content_unlocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unlocks"
  ON dna_content_unlocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unlocks"
  ON dna_content_unlocks FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Initialize DNA Leader Journey for new user
CREATE OR REPLACE FUNCTION initialize_dna_journey()
RETURNS TRIGGER AS $$
BEGIN
  -- Create journey record
  INSERT INTO dna_leader_journeys (user_id, current_stage, milestones)
  VALUES (
    NEW.user_id,
    'onboarding',
    '{
      "flow_assessment_complete": {"completed": false},
      "manual_complete": {"completed": false},
      "launch_guide_reviewed": {"completed": false},
      "first_group_created": {"completed": false}
    }'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Unlock Flow Assessment by default (first step)
  INSERT INTO dna_content_unlocks (user_id, content_type, unlocked, unlocked_at, unlock_trigger)
  VALUES (
    NEW.user_id,
    'flow_assessment',
    TRUE,
    NOW(),
    'initial_onboarding'
  )
  ON CONFLICT (user_id, content_type) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-initialize journey when DNA leader is created
CREATE TRIGGER init_dna_journey_on_leader_create
  AFTER INSERT ON dna_leaders
  FOR EACH ROW
  EXECUTE FUNCTION initialize_dna_journey();

-- Function: Update journey stage based on milestones
CREATE OR REPLACE FUNCTION update_dna_journey_stage()
RETURNS TRIGGER AS $$
DECLARE
  journey_record RECORD;
  new_stage TEXT;
BEGIN
  -- Get current journey
  SELECT * INTO journey_record
  FROM dna_leader_journeys
  WHERE user_id = NEW.user_id;

  -- Determine new stage based on milestones
  IF (journey_record.milestones->>'flow_assessment_complete')::jsonb->>'completed' = 'true'
     AND (journey_record.milestones->>'manual_complete')::jsonb->>'completed' = 'false' THEN
    new_stage := 'training';
  ELSIF (journey_record.milestones->>'manual_complete')::jsonb->>'completed' = 'true'
        AND (journey_record.milestones->>'first_group_created')::jsonb->>'completed' = 'false' THEN
    new_stage := 'launching';
  ELSIF (journey_record.milestones->>'first_group_created')::jsonb->>'completed' = 'true' THEN
    new_stage := 'growing';
  ELSE
    new_stage := journey_record.current_stage;
  END IF;

  -- Update stage if changed
  IF new_stage != journey_record.current_stage THEN
    UPDATE dna_leader_journeys
    SET current_stage = new_stage,
        stage_started_at = NOW(),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-update stage when milestones change
CREATE TRIGGER update_stage_on_milestone_change
  AFTER UPDATE OF milestones ON dna_leader_journeys
  FOR EACH ROW
  WHEN (OLD.milestones IS DISTINCT FROM NEW.milestones)
  EXECUTE FUNCTION update_dna_journey_stage();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE dna_leader_journeys IS 'Tracks overall DNA Leader training progression through stages';
COMMENT ON TABLE dna_training_modules IS 'Tracks progress on individual training modules (assessments, sessions, phases)';
COMMENT ON TABLE dna_flow_assessments IS 'Stores Flow Assessment (7 Roadblocks) responses and action plans';
COMMENT ON TABLE dna_content_unlocks IS 'Controls progressive content reveal based on user milestones';

COMMENT ON COLUMN dna_leader_journeys.current_stage IS 'Current stage: onboarding, training, launching, growing, multiplying';
COMMENT ON COLUMN dna_leader_journeys.milestones IS 'JSONB object tracking milestone achievements';
COMMENT ON COLUMN dna_leader_journeys.badges IS 'Array of earned achievement badges (non-cheesy)';

COMMENT ON COLUMN dna_training_modules.module_type IS 'Type: flow_assessment, manual_session, launch_guide_phase, toolkit_week';
COMMENT ON COLUMN dna_training_modules.module_id IS 'Module identifier (e.g., session-1, phase-2, week-3)';
COMMENT ON COLUMN dna_training_modules.progress_data IS 'Flexible JSONB for module-specific data';

COMMENT ON COLUMN dna_flow_assessments.roadblock_ratings IS 'JSONB with 1-5 ratings for each of 7 roadblocks';
COMMENT ON COLUMN dna_flow_assessments.top_roadblocks IS 'Array of 2-3 highest-rated roadblocks';
COMMENT ON COLUMN dna_flow_assessments.previous_assessment_id IS 'Links to previous assessment for comparison (retakes after 3 months)';
