-- Migration: 021_spiritual-gifts-assessment.sql
-- Description: Creates tables for Spiritual Gifts Assessment
-- Date: 2026-01-28

-- =============================================================================
-- SPIRITUAL GIFTS QUESTIONS
-- =============================================================================
-- Stores the 90 assessment questions (30 per tier)
CREATE TABLE spiritual_gifts_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Question metadata
  tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
  gift_category TEXT NOT NULL, -- e.g., 'mercy', 'prophecy', 'apostle'
  question_type TEXT NOT NULL CHECK (question_type IN ('likert', 'behavioral', 'desire', 'experience', 'confirmation')),
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL, -- Global order (1-90)

  -- For behavioral questions with multiple choice options
  option_a TEXT, -- Optional: for multiple choice scenarios
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tier, question_order)
);

-- Index for faster querying by tier
CREATE INDEX idx_spiritual_gifts_questions_tier ON spiritual_gifts_questions(tier);
CREATE INDEX idx_spiritual_gifts_questions_category ON spiritual_gifts_questions(gift_category);

-- =============================================================================
-- SPIRITUAL GIFTS ASSESSMENTS
-- =============================================================================
-- Stores assessment sessions (both DNA Group disciples and public users)
CREATE TABLE spiritual_gifts_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source tracking (DNA Group vs Public)
  source TEXT NOT NULL CHECK (source IN ('dna_group', 'public')),

  -- DNA Group context (nullable for public users)
  dna_leader_id UUID REFERENCES dna_leaders(id) ON DELETE SET NULL,
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE,
  group_id UUID REFERENCES dna_groups(id) ON DELETE SET NULL,

  -- Public user context (nullable for DNA disciples)
  email TEXT,
  full_name TEXT,
  phone TEXT,
  location TEXT, -- Zip code or city

  -- Assessment progress
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100), -- percentage

  -- Results: Tier 1 (Serving Gifts - Romans 12)
  tier1_primary TEXT, -- e.g., 'mercy'
  tier1_primary_score DECIMAL(5,2), -- Store score for analytics
  tier1_secondary TEXT,
  tier1_secondary_score DECIMAL(5,2),
  tier1_synopsis TEXT,

  -- Results: Tier 2 (Supernatural Gifts - 1 Cor 12)
  tier2_primary TEXT,
  tier2_primary_score DECIMAL(5,2),
  tier2_secondary TEXT,
  tier2_secondary_score DECIMAL(5,2),
  tier2_synopsis TEXT,

  -- Results: Tier 3 (Leadership Calling - Eph 4)
  tier3_primary TEXT,
  tier3_primary_score DECIMAL(5,2),
  tier3_secondary TEXT,
  tier3_secondary_score DECIMAL(5,2),
  tier3_synopsis TEXT,

  -- PDF and tokens
  pdf_url TEXT, -- S3 or Supabase Storage URL
  unique_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'), -- For viewing results

  -- Lead capture tracking
  claimed_free_teaching BOOLEAN DEFAULT FALSE,
  claimed_bundle BOOLEAN DEFAULT FALSE,
  bundle_claimed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_spiritual_gifts_assessments_disciple ON spiritual_gifts_assessments(disciple_id);
CREATE INDEX idx_spiritual_gifts_assessments_group ON spiritual_gifts_assessments(group_id);
CREATE INDEX idx_spiritual_gifts_assessments_leader ON spiritual_gifts_assessments(dna_leader_id);
CREATE INDEX idx_spiritual_gifts_assessments_email ON spiritual_gifts_assessments(email);
CREATE INDEX idx_spiritual_gifts_assessments_token ON spiritual_gifts_assessments(unique_token);
CREATE INDEX idx_spiritual_gifts_assessments_source ON spiritual_gifts_assessments(source);
CREATE INDEX idx_spiritual_gifts_assessments_completed ON spiritual_gifts_assessments(completed_at) WHERE completed_at IS NOT NULL;

-- =============================================================================
-- SPIRITUAL GIFTS RESPONSES
-- =============================================================================
-- Stores individual question responses (for detailed analytics)
CREATE TABLE spiritual_gifts_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  assessment_id UUID NOT NULL REFERENCES spiritual_gifts_assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES spiritual_gifts_questions(id) ON DELETE CASCADE,

  -- Response
  response_value INTEGER NOT NULL CHECK (response_value >= 1 AND response_value <= 5), -- Likert scale 1-5

  -- For behavioral multiple choice (if we need to track letter choice)
  response_option TEXT CHECK (response_option IN ('a', 'b', 'c', 'd')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each question can only be answered once per assessment
  UNIQUE(assessment_id, question_id)
);

-- Indexes
CREATE INDEX idx_spiritual_gifts_responses_assessment ON spiritual_gifts_responses(assessment_id);
CREATE INDEX idx_spiritual_gifts_responses_question ON spiritual_gifts_responses(question_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE spiritual_gifts_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spiritual_gifts_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE spiritual_gifts_responses ENABLE ROW LEVEL SECURITY;

-- Questions: Public read access (anyone can view questions)
CREATE POLICY "Questions are publicly readable"
  ON spiritual_gifts_questions
  FOR SELECT
  USING (true);

-- Assessments: Users can only read their own assessments
CREATE POLICY "Users can read their own assessments"
  ON spiritual_gifts_assessments
  FOR SELECT
  USING (
    -- DNA disciples can read their own
    (source = 'dna_group' AND disciple_id = auth.uid())
    OR
    -- Public users can read via token (handled in API, not RLS)
    (source = 'public')
  );

-- Assessments: DNA leaders can read assessments from their groups
CREATE POLICY "DNA leaders can read group assessments"
  ON spiritual_gifts_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dna_leaders
      WHERE dna_leaders.id = dna_leader_id
      AND dna_leaders.id IN (
        SELECT id FROM dna_leaders WHERE email = auth.jwt() ->> 'email'
      )
    )
  );

-- Assessments: Anyone can insert (for starting assessments)
CREATE POLICY "Anyone can create assessments"
  ON spiritual_gifts_assessments
  FOR INSERT
  WITH CHECK (true);

-- Assessments: Users can update their own assessments
CREATE POLICY "Users can update their own assessments"
  ON spiritual_gifts_assessments
  FOR UPDATE
  USING (
    (source = 'dna_group' AND disciple_id = auth.uid())
    OR
    (source = 'public') -- Public assessments updated via service role in API
  );

-- Responses: Users can read their own responses
CREATE POLICY "Users can read their own responses"
  ON spiritual_gifts_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM spiritual_gifts_assessments
      WHERE spiritual_gifts_assessments.id = assessment_id
      AND (
        (spiritual_gifts_assessments.source = 'dna_group' AND spiritual_gifts_assessments.disciple_id = auth.uid())
        OR
        (spiritual_gifts_assessments.source = 'public')
      )
    )
  );

-- Responses: Anyone can insert (for submitting answers)
CREATE POLICY "Anyone can insert responses"
  ON spiritual_gifts_responses
  FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_spiritual_gifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for assessments table
CREATE TRIGGER spiritual_gifts_assessments_updated_at
  BEFORE UPDATE ON spiritual_gifts_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_spiritual_gifts_updated_at();

-- Trigger for questions table
CREATE TRIGGER spiritual_gifts_questions_updated_at
  BEFORE UPDATE ON spiritual_gifts_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_spiritual_gifts_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE spiritual_gifts_questions IS 'Stores the 90 spiritual gifts assessment questions across 3 tiers';
COMMENT ON TABLE spiritual_gifts_assessments IS 'Stores assessment sessions for both DNA Group disciples and public users';
COMMENT ON TABLE spiritual_gifts_responses IS 'Stores individual question responses for detailed analytics';

COMMENT ON COLUMN spiritual_gifts_questions.tier IS '1 = Serving Gifts (Romans 12), 2 = Supernatural Gifts (1 Cor 12), 3 = Leadership Calling (Eph 4)';
COMMENT ON COLUMN spiritual_gifts_questions.question_type IS 'likert = 1-5 scale, behavioral = scenario, desire/experience = Tier 2 specific, confirmation = Tier 3 specific';
COMMENT ON COLUMN spiritual_gifts_assessments.source IS 'dna_group = sent by leader to disciple, public = standalone landing page';
COMMENT ON COLUMN spiritual_gifts_assessments.unique_token IS 'Used for public users to view results without login';
COMMENT ON COLUMN spiritual_gifts_responses.response_value IS 'Likert scale: 1 = Strongly Disagree, 5 = Strongly Agree';
