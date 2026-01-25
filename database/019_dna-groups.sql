-- DNA Groups System Schema
-- Migration: 019_dna-groups.sql
-- Purpose: Tables for DNA Groups management (Roadmap 2)
-- Created: 2026-01-24

-- ============================================
-- 1. DNA LEADERS
-- Users who lead discipleship groups
-- ============================================
CREATE TABLE dna_leaders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,

  -- Church affiliation (nullable - can be independent)
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,

  -- Invitation tracking
  invited_by UUID, -- church_leader.id or admin
  invited_by_type TEXT CHECK (invited_by_type IN ('church_admin', 'super_admin')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE, -- When they complete signup

  -- Magic link token for signup
  signup_token TEXT UNIQUE,
  signup_token_expires_at TIMESTAMP WITH TIME ZONE,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dna_leaders_email ON dna_leaders(email);
CREATE INDEX idx_dna_leaders_church_id ON dna_leaders(church_id);
CREATE INDEX idx_dna_leaders_signup_token ON dna_leaders(signup_token);

-- ============================================
-- 2. DNA GROUPS
-- Discipleship groups led by DNA leaders
-- ============================================
CREATE TABLE dna_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name TEXT NOT NULL,

  -- Leadership
  leader_id UUID REFERENCES dna_leaders(id) NOT NULL,
  co_leader_id UUID REFERENCES dna_leaders(id), -- Optional

  -- Church affiliation (nullable - can be independent)
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,

  -- Group lifecycle phases
  current_phase TEXT CHECK (current_phase IN (
    'pre-launch',      -- Planning/inviting stage
    'invitation',      -- Week 0-1: Invitations sent, group forming
    'foundation',      -- Week 1-4: Building foundation
    'growth',          -- Week 5-8: Group maturing
    'multiplication'   -- Week 8+: Preparing to multiply
  )) DEFAULT 'pre-launch',

  -- Timeline
  start_date DATE NOT NULL,
  multiplication_target_date DATE, -- When do they plan to multiply?

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dna_groups_leader_id ON dna_groups(leader_id);
CREATE INDEX idx_dna_groups_co_leader_id ON dna_groups(co_leader_id);
CREATE INDEX idx_dna_groups_church_id ON dna_groups(church_id);
CREATE INDEX idx_dna_groups_current_phase ON dna_groups(current_phase);

-- ============================================
-- 3. DISCIPLES
-- Group participants (no login - token-based access only)
-- ============================================
CREATE TABLE disciples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,

  -- If they graduate to DNA leader, link here
  promoted_to_leader_id UUID REFERENCES dna_leaders(id),
  promoted_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_disciples_email ON disciples(email);

-- ============================================
-- 4. GROUP DISCIPLES (Join Table)
-- Links disciples to groups with membership info
-- ============================================
CREATE TABLE group_disciples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE,
  disciple_id UUID REFERENCES disciples(id) NOT NULL,

  joined_date DATE NOT NULL,
  current_status TEXT CHECK (current_status IN (
    'active',      -- Currently in group
    'completed',   -- Finished 8 weeks successfully
    'dropped'      -- Left group early
  )) DEFAULT 'active',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(group_id, disciple_id) -- Can't join same group twice
);

CREATE INDEX idx_group_disciples_group_id ON group_disciples(group_id);
CREATE INDEX idx_group_disciples_disciple_id ON group_disciples(disciple_id);

-- ============================================
-- 5. LIFE ASSESSMENTS
-- Week 1 and Week 8 assessments for disciples
-- ============================================
CREATE TABLE life_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disciple_id UUID REFERENCES disciples(id) NOT NULL,
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE,

  -- Assessment timing
  assessment_week INTEGER CHECK (assessment_week IN (1, 8)),

  -- Token-based access (no login required)
  token TEXT NOT NULL UNIQUE,
  token_expires_at TIMESTAMP WITH TIME ZONE,

  -- Responses stored as JSONB
  -- Structure: { "q1": "answer", "q2": 3, "q3": ["option1", "option2"], ... }
  responses JSONB NOT NULL DEFAULT '{}',

  -- Status tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Reminder tracking
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_life_assessments_token ON life_assessments(token);
CREATE INDEX idx_life_assessments_disciple_id ON life_assessments(disciple_id);
CREATE INDEX idx_life_assessments_group_id ON life_assessments(group_id);

-- ============================================
-- 6. LEADER NOTES
-- Private notes on disciples (leader/co-leader only)
-- NOT visible to church admins
-- ============================================
CREATE TABLE leader_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE,
  disciple_id UUID REFERENCES disciples(id) NOT NULL,
  leader_id UUID REFERENCES dna_leaders(id) NOT NULL,

  note_text TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leader_notes_group_id ON leader_notes(group_id);
CREATE INDEX idx_leader_notes_disciple_id ON leader_notes(disciple_id);

-- ============================================
-- 7. PRAYER REQUESTS
-- Prayer tracking for disciples (leader/co-leader only)
-- NOT visible to church admins
-- ============================================
CREATE TABLE prayer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE,
  disciple_id UUID REFERENCES disciples(id) NOT NULL,

  request_text TEXT NOT NULL,
  answered BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMP WITH TIME ZONE,
  answer_note TEXT, -- Optional note about how prayer was answered

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prayer_requests_group_id ON prayer_requests(group_id);
CREATE INDEX idx_prayer_requests_disciple_id ON prayer_requests(disciple_id);

-- ============================================
-- 8. LEADER HEALTH CHECKINS
-- 6-month health assessments for DNA leaders
-- Summary visible to church admins, full responses to leader only
-- ============================================
CREATE TABLE leader_health_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID REFERENCES dna_leaders(id) NOT NULL,

  -- Church affiliation at time of checkin (snapshot)
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,

  -- Responses stored as JSONB (full detail - leader & super admin only)
  responses JSONB NOT NULL DEFAULT '{}',

  -- Summary for church admins (no full responses)
  overall_score DECIMAL(3,2), -- e.g., 3.75 out of 5
  status TEXT CHECK (status IN ('healthy', 'caution', 'needs_attention')) DEFAULT 'healthy',
  flag_areas JSONB DEFAULT '[]',
  -- e.g., [{"area": "burnout", "level": "red"}, {"area": "community", "level": "green"}]

  -- Scheduling
  due_date DATE NOT NULL, -- When the checkin is due
  reminder_sent_at TIMESTAMP WITH TIME ZONE, -- Last reminder email
  reminder_count INTEGER DEFAULT 0,

  -- Status tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Access token
  token TEXT UNIQUE,
  token_expires_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leader_health_checkins_leader_id ON leader_health_checkins(leader_id);
CREATE INDEX idx_leader_health_checkins_church_id ON leader_health_checkins(church_id);
CREATE INDEX idx_leader_health_checkins_token ON leader_health_checkins(token);
CREATE INDEX idx_leader_health_checkins_due_date ON leader_health_checkins(due_date);
CREATE INDEX idx_leader_health_checkins_status ON leader_health_checkins(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE dna_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciples ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_disciples ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_health_checkins ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added in a separate migration
-- once the authentication flow is finalized. Policies will enforce:
-- 1. DNA Leaders can CRUD their own groups, disciples, notes, prayers
-- 2. Co-leaders have same permissions as primary leader for their groups
-- 3. Church admins can READ groups/disciples where church_id matches (not notes/prayers)
-- 4. Church admins can READ leader health checkin summaries (not full responses)
-- 5. Super admin (Travis) has full access to everything
-- 6. Life assessments and health checkins use token-based access (no auth required)

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create triggers for tables with updated_at column
CREATE TRIGGER update_dna_leaders_updated_at
  BEFORE UPDATE ON dna_leaders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dna_groups_updated_at
  BEFORE UPDATE ON dna_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
