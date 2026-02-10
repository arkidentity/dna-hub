-- Migration 045: DNA Cohorts
-- Creates the DNA Cohort system for permanent leader peer communities
-- Run this in your Supabase SQL Editor

-- =====================
-- DNA COHORTS TABLE
-- =====================
-- The cohort itself (church-scoped, permanent peer community)
CREATE TABLE IF NOT EXISTS dna_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,  -- e.g. "Boulevard G1 — Spring 2026"
  generation INT,      -- 1, 2, 3... (optional, for tracking cohort generations)
  status TEXT CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  started_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- COHORT MEMBERS TABLE
-- =====================
-- Links DNA leaders to their cohort (all leaders at a church belong to cohort)
CREATE TABLE IF NOT EXISTS dna_cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES dna_cohorts(id) ON DELETE CASCADE NOT NULL,
  leader_id UUID REFERENCES dna_leaders(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('trainer', 'leader')) DEFAULT 'leader',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cohort_id, leader_id)
);

-- =====================
-- COHORT FEED POSTS TABLE
-- =====================
-- Trainer-authored announcements and updates (structured, not a free-for-all)
CREATE TABLE IF NOT EXISTS dna_cohort_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES dna_cohorts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES dna_leaders(id) ON DELETE CASCADE NOT NULL,
  post_type TEXT CHECK (post_type IN ('announcement', 'update', 'resource')) DEFAULT 'announcement',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- COHORT DISCUSSION TABLE
-- =====================
-- Open discussion forum where any DNA leader at the church can post + reply
CREATE TABLE IF NOT EXISTS dna_cohort_discussion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES dna_cohorts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES dna_leaders(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES dna_cohort_discussion(id) ON DELETE CASCADE,  -- for threading
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- MODIFY DNA_GROUPS TABLE
-- =====================
-- Add cohort support to existing dna_groups table
ALTER TABLE dna_groups
  ADD COLUMN IF NOT EXISTS group_type TEXT CHECK (group_type IN ('dna_group', 'training_cohort')) DEFAULT 'dna_group',
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES dna_cohorts(id) ON DELETE SET NULL;

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_dna_cohorts_church ON dna_cohorts(church_id);
CREATE INDEX IF NOT EXISTS idx_dna_cohorts_status ON dna_cohorts(status);
CREATE INDEX IF NOT EXISTS idx_dna_cohort_members_cohort ON dna_cohort_members(cohort_id);
CREATE INDEX IF NOT EXISTS idx_dna_cohort_members_leader ON dna_cohort_members(leader_id);
CREATE INDEX IF NOT EXISTS idx_dna_cohort_posts_cohort ON dna_cohort_posts(cohort_id);
CREATE INDEX IF NOT EXISTS idx_dna_cohort_posts_author ON dna_cohort_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_dna_cohort_posts_pinned ON dna_cohort_posts(pinned);
CREATE INDEX IF NOT EXISTS idx_dna_cohort_discussion_cohort ON dna_cohort_discussion(cohort_id);
CREATE INDEX IF NOT EXISTS idx_dna_cohort_discussion_author ON dna_cohort_discussion(author_id);
CREATE INDEX IF NOT EXISTS idx_dna_cohort_discussion_parent ON dna_cohort_discussion(parent_id);
CREATE INDEX IF NOT EXISTS idx_dna_groups_cohort ON dna_groups(cohort_id);

-- =====================
-- UPDATE TRIGGERS
-- =====================
CREATE TRIGGER update_dna_cohorts_updated_at
  BEFORE UPDATE ON dna_cohorts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dna_cohort_posts_updated_at
  BEFORE UPDATE ON dna_cohort_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dna_cohort_discussion_updated_at
  BEFORE UPDATE ON dna_cohort_discussion
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- RLS POLICIES
-- =====================

-- DNA Cohorts: Church leaders and admins can view their cohorts
ALTER TABLE dna_cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church leaders can view their cohorts"
  ON dna_cohorts FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM dna_leaders WHERE account_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM church_leaders WHERE account_id = auth.uid() AND church_id = dna_cohorts.church_id
    )
  );

CREATE POLICY "Service role has full access to cohorts"
  ON dna_cohorts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Cohort Members: Members can view other members in their cohort
ALTER TABLE dna_cohort_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cohort members can view their cohort members"
  ON dna_cohort_members FOR SELECT
  USING (
    cohort_id IN (
      SELECT cohort_id FROM dna_cohort_members WHERE leader_id IN (
        SELECT id FROM dna_leaders WHERE account_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role has full access to cohort members"
  ON dna_cohort_members FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Cohort Posts: All cohort members can read, only trainers can create
ALTER TABLE dna_cohort_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cohort members can view posts in their cohort"
  ON dna_cohort_posts FOR SELECT
  USING (
    cohort_id IN (
      SELECT cohort_id FROM dna_cohort_members WHERE leader_id IN (
        SELECT id FROM dna_leaders WHERE account_id = auth.uid()
      )
    )
  );

CREATE POLICY "Trainers can create posts in their cohort"
  ON dna_cohort_posts FOR INSERT
  WITH CHECK (
    cohort_id IN (
      SELECT cohort_id FROM dna_cohort_members
      WHERE leader_id = author_id
      AND role = 'trainer'
      AND leader_id IN (SELECT id FROM dna_leaders WHERE account_id = auth.uid())
    )
  );

CREATE POLICY "Trainers can update their own posts"
  ON dna_cohort_posts FOR UPDATE
  USING (author_id IN (SELECT id FROM dna_leaders WHERE account_id = auth.uid()));

CREATE POLICY "Service role has full access to cohort posts"
  ON dna_cohort_posts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Cohort Discussion: All cohort members can read and post
ALTER TABLE dna_cohort_discussion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cohort members can view discussion in their cohort"
  ON dna_cohort_discussion FOR SELECT
  USING (
    cohort_id IN (
      SELECT cohort_id FROM dna_cohort_members WHERE leader_id IN (
        SELECT id FROM dna_leaders WHERE account_id = auth.uid()
      )
    )
  );

CREATE POLICY "Cohort members can post in discussion"
  ON dna_cohort_discussion FOR INSERT
  WITH CHECK (
    cohort_id IN (
      SELECT cohort_id FROM dna_cohort_members WHERE leader_id IN (
        SELECT id FROM dna_leaders WHERE account_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authors can update their own discussion posts"
  ON dna_cohort_discussion FOR UPDATE
  USING (author_id IN (SELECT id FROM dna_leaders WHERE account_id = auth.uid()));

CREATE POLICY "Service role has full access to cohort discussion"
  ON dna_cohort_discussion FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================
-- COMMENTS
-- =====================
COMMENT ON TABLE dna_cohorts IS 'Church-scoped cohorts - permanent peer communities for DNA leaders';
COMMENT ON TABLE dna_cohort_members IS 'Links DNA leaders to their cohort. All leaders at a church belong to the cohort.';
COMMENT ON TABLE dna_cohort_posts IS 'Trainer-authored announcements and updates (Feed tab)';
COMMENT ON TABLE dna_cohort_discussion IS 'Open discussion forum for all DNA leaders in the cohort (Discussion tab)';
COMMENT ON COLUMN dna_groups.group_type IS 'dna_group = regular discipleship group, training_cohort = G1 training group of 4 leaders';
COMMENT ON COLUMN dna_groups.cohort_id IS 'Links training groups to their cohort program';
