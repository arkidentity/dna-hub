-- DNA Church Hub Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- CHURCHES TABLE
-- =====================
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending_assessment',
  -- pending_assessment, awaiting_call, active, completed, paused

  -- Timeline (set by admin after strategy call)
  start_date DATE,
  phase_1_start DATE,
  phase_1_target DATE,
  phase_2_start DATE,
  phase_2_target DATE,
  phase_3_start DATE,
  phase_3_target DATE,
  phase_4_start DATE,
  phase_4_target DATE,
  phase_5_start DATE,
  phase_5_target DATE,

  -- Current progress
  current_phase INTEGER DEFAULT 0, -- 0 = not started, 1-5 = active phase

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- CHURCH LEADERS TABLE
-- =====================
CREATE TABLE church_leaders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100), -- Senior Pastor, Associate Pastor, Discipleship Director, etc.
  is_primary_contact BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- CHURCH ASSESSMENTS TABLE
-- =====================
CREATE TABLE church_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,

  -- Contact Info
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  church_name VARCHAR(255) NOT NULL,
  church_city VARCHAR(100),
  church_state VARCHAR(50),
  church_website TEXT,

  -- Church Context
  congregation_size VARCHAR(50),
  current_discipleship_approach TEXT,
  why_interested TEXT,

  -- Leadership Readiness
  identified_leaders INTEGER, -- Number of potential DNA leaders
  leaders_completed_dna BOOLEAN DEFAULT FALSE,
  pastor_commitment_level VARCHAR(50), -- fully_committed, exploring, delegating

  -- Implementation Timeline
  desired_launch_timeline VARCHAR(50),
  potential_barriers TEXT,

  -- Expectations
  first_year_goals TEXT,
  support_needed TEXT,

  -- Additional
  how_heard_about_us VARCHAR(100),
  additional_questions TEXT,

  -- Strategy Call
  call_already_booked BOOLEAN DEFAULT FALSE,
  call_scheduled_at TIMESTAMP WITH TIME ZONE,
  call_notes TEXT,

  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- PHASES TABLE (Template)
-- =====================
CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_number INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  display_order INTEGER NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default phases
INSERT INTO phases (phase_number, name, description, duration_weeks, display_order) VALUES
(1, 'Church Partnership', 'Establish the foundation for DNA implementation with church leadership alignment and initial setup.', 4, 1),
(2, 'Leader Preparation', 'Identify, recruit, and begin preparing potential DNA leaders for their journey.', 4, 2),
(3, 'DNA Foundation', 'Leaders go through the 6-session DNA Manual and establish core understanding.', 6, 3),
(4, 'Practical Preparation', 'Complete the 8-Week Toolkit experience and finalize launch preparations.', 8, 4),
(5, 'Final Validation & Launch', 'Complete readiness assessment and launch first DNA groups.', 8, 5);

-- =====================
-- MILESTONES TABLE (Template)
-- =====================
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_url TEXT, -- Link to PDF, video, or external resource
  resource_type VARCHAR(50), -- pdf, video, link, guide
  display_order INTEGER NOT NULL,
  is_key_milestone BOOLEAN DEFAULT FALSE, -- Triggers notification when completed

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Phase 1 Milestones
INSERT INTO milestones (phase_id, title, description, resource_type, display_order, is_key_milestone) VALUES
((SELECT id FROM phases WHERE phase_number = 1), 'Complete Dam Assessment', 'Take the Dam Assessment in the ARK app to understand your starting point.', 'link', 1, TRUE),
((SELECT id FROM phases WHERE phase_number = 1), 'Vision Alignment Meeting', 'Meet with church leadership to align on DNA vision and commitment.', NULL, 2, FALSE),
((SELECT id FROM phases WHERE phase_number = 1), 'Review Pastor''s Guide to Dam Assessment', 'Learn how to unpack the Dam Assessment with your people.', 'pdf', 3, FALSE),
((SELECT id FROM phases WHERE phase_number = 1), 'Identify Church DNA Champion', 'Designate who will oversee DNA implementation at your church.', NULL, 4, FALSE),
((SELECT id FROM phases WHERE phase_number = 1), 'Set Implementation Timeline', 'Work with ARK to establish your church''s DNA timeline.', NULL, 5, TRUE);

-- Insert Phase 2 Milestones
INSERT INTO milestones (phase_id, title, description, resource_type, display_order, is_key_milestone) VALUES
((SELECT id FROM phases WHERE phase_number = 2), 'Complete Leader Identification Worksheet', 'Identify 4-6 potential DNA leaders in your congregation.', 'pdf', 1, FALSE),
((SELECT id FROM phases WHERE phase_number = 2), 'Vision Cast to Potential Leaders', 'Share the DNA vision with identified potential leaders.', 'guide', 2, FALSE),
((SELECT id FROM phases WHERE phase_number = 2), 'Leaders Commit to DNA Journey', 'Secure commitment from at least 2-3 leaders to proceed.', NULL, 3, TRUE),
((SELECT id FROM phases WHERE phase_number = 2), 'Pair Leaders with Co-Leaders', 'Ensure each DNA leader has a co-leader partner.', NULL, 4, FALSE),
((SELECT id FROM phases WHERE phase_number = 2), 'Order DNA Manuals', 'Order physical DNA Discipleship Manuals for each leader.', 'link', 5, FALSE);

-- Insert Phase 3 Milestones
INSERT INTO milestones (phase_id, title, description, resource_type, display_order, is_key_milestone) VALUES
((SELECT id FROM phases WHERE phase_number = 3), 'Session 1: The DNA of a Disciple', 'Complete DNA Manual Session 1.', 'pdf', 1, FALSE),
((SELECT id FROM phases WHERE phase_number = 3), 'Session 2: The Great Commission', 'Complete DNA Manual Session 2.', 'pdf', 2, FALSE),
((SELECT id FROM phases WHERE phase_number = 3), 'Session 3: Multiplication Mindset', 'Complete DNA Manual Session 3.', 'pdf', 3, FALSE),
((SELECT id FROM phases WHERE phase_number = 3), 'Session 4: The DNA Process', 'Complete DNA Manual Session 4.', 'pdf', 4, FALSE),
((SELECT id FROM phases WHERE phase_number = 3), 'Session 5: Leading a DNA Group', 'Complete DNA Manual Session 5.', 'pdf', 5, FALSE),
((SELECT id FROM phases WHERE phase_number = 3), 'Session 6: Multiplication Planning', 'Complete DNA Manual Session 6.', 'pdf', 6, FALSE),
((SELECT id FROM phases WHERE phase_number = 3), 'DNA Manual Completed', 'All leaders have completed the 6-session DNA Manual.', NULL, 7, TRUE);

-- Insert Phase 4 Milestones
INSERT INTO milestones (phase_id, title, description, resource_type, display_order, is_key_milestone) VALUES
((SELECT id FROM phases WHERE phase_number = 4), 'Begin 8-Week Toolkit Experience', 'Leaders start the 8-Week Toolkit as participants.', 'pdf', 1, FALSE),
((SELECT id FROM phases WHERE phase_number = 4), 'Week 2 Checkpoint', 'Complete weeks 1-2 of the toolkit.', NULL, 2, FALSE),
((SELECT id FROM phases WHERE phase_number = 4), 'Week 4 Checkpoint', 'Complete weeks 3-4 of the toolkit.', NULL, 3, FALSE),
((SELECT id FROM phases WHERE phase_number = 4), 'Week 6 Checkpoint', 'Complete weeks 5-6 of the toolkit.', NULL, 4, FALSE),
((SELECT id FROM phases WHERE phase_number = 4), 'Complete 8-Week Toolkit', 'All leaders have completed the full toolkit experience.', NULL, 5, TRUE),
((SELECT id FROM phases WHERE phase_number = 4), 'Review DNA Launch Guide', 'Study the Launch Guide for group facilitation.', 'pdf', 6, FALSE),
((SELECT id FROM phases WHERE phase_number = 4), 'Identify First Group Members', 'Each leader identifies 3-4 people to invite to their first group.', NULL, 7, FALSE),
((SELECT id FROM phases WHERE phase_number = 4), 'Set Launch Date', 'Confirm launch date for first DNA groups.', NULL, 8, TRUE);

-- Insert Phase 5 Milestones
INSERT INTO milestones (phase_id, title, description, resource_type, display_order, is_key_milestone) VALUES
((SELECT id FROM phases WHERE phase_number = 5), 'Complete DNA Readiness Quiz', 'All leaders pass the readiness assessment.', 'link', 1, TRUE),
((SELECT id FROM phases WHERE phase_number = 5), 'Final Prep Meeting', 'Meet with all DNA leaders for final preparation and prayer.', NULL, 2, FALSE),
((SELECT id FROM phases WHERE phase_number = 5), 'Extend Invitations', 'Leaders personally invite their identified group members.', NULL, 3, FALSE),
((SELECT id FROM phases WHERE phase_number = 5), 'Launch Week 1', 'First DNA groups officially begin!', NULL, 4, TRUE),
((SELECT id FROM phases WHERE phase_number = 5), 'Week 4 Check-in', 'First month review with DNA leaders.', NULL, 5, FALSE),
((SELECT id FROM phases WHERE phase_number = 5), 'Week 8 Evaluation', 'Mid-point evaluation and adjustments.', NULL, 6, FALSE),
((SELECT id FROM phases WHERE phase_number = 5), 'Begin Multiplication Planning', 'Start identifying future leaders from current groups.', NULL, 7, TRUE),
((SELECT id FROM phases WHERE phase_number = 5), 'Phase 5 Complete - Groups Running', 'DNA groups are successfully running and multiplying.', NULL, 8, TRUE);

-- =====================
-- CHURCH PROGRESS TABLE
-- =====================
CREATE TABLE church_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,

  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES church_leaders(id),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(church_id, milestone_id)
);

-- =====================
-- MAGIC LINK TOKENS TABLE
-- =====================
CREATE TABLE magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID REFERENCES church_leaders(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- NOTIFICATION LOG TABLE
-- =====================
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id),
  notification_type VARCHAR(50) NOT NULL, -- milestone_completed, phase_completed, etc.
  sent_to VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_church_leaders_church_id ON church_leaders(church_id);
CREATE INDEX idx_church_leaders_email ON church_leaders(email);
CREATE INDEX idx_church_assessments_church_id ON church_assessments(church_id);
CREATE INDEX idx_church_progress_church_id ON church_progress(church_id);
CREATE INDEX idx_milestones_phase_id ON milestones(phase_id);
CREATE INDEX idx_magic_link_tokens_token ON magic_link_tokens(token);
CREATE INDEX idx_magic_link_tokens_leader_id ON magic_link_tokens(leader_id);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_progress ENABLE ROW LEVEL SECURITY;

-- Policies will be added based on authentication setup

-- =====================
-- UPDATED_AT TRIGGER
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_churches_updated_at
  BEFORE UPDATE ON churches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_church_leaders_updated_at
  BEFORE UPDATE ON church_leaders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_church_progress_updated_at
  BEFORE UPDATE ON church_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
