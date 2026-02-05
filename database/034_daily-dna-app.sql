-- Daily DNA App Schema
-- Migration: 034_daily-dna-app.sql
-- Purpose: Tables for Daily DNA disciple app integration
-- Created: 2025-02-04
--
-- This migration adds all tables needed for the Daily DNA mobile app
-- to share the DNA Hub Supabase database.

-- ============================================
-- SECTION 1: CORE DISCIPLE DATA
-- ============================================

-- ============================================
-- 1.1 DISCIPLE APP ACCOUNTS
-- Separate auth for disciples (distinct from DNA Hub users)
-- ============================================
CREATE TABLE disciple_app_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to disciple record (nullable for non-group users)
  disciple_id UUID REFERENCES disciples(id) ON DELETE SET NULL,

  -- Auth credentials
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  auth_provider TEXT CHECK (auth_provider IN ('email', 'google', 'apple', 'discord')),
  auth_provider_id TEXT,

  -- Profile
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC', -- For streak calculations

  -- Church white-labeling (inherited from group's church)
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  church_subdomain TEXT,

  -- Account status
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disciple_app_accounts_email ON disciple_app_accounts(email);
CREATE INDEX idx_disciple_app_accounts_disciple ON disciple_app_accounts(disciple_id);
CREATE INDEX idx_disciple_app_accounts_church ON disciple_app_accounts(church_id);

-- ============================================
-- 1.2 DISCIPLE JOURNAL ENTRIES
-- 3D Journal entries (Head/Heart/Hands)
-- ============================================
CREATE TABLE disciple_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,

  -- Sync tracking
  local_id TEXT NOT NULL, -- Client-generated UUID for sync

  -- Scripture reference
  scripture TEXT NOT NULL, -- e.g., "John 3:16"
  scripture_passage TEXT,  -- Full passage text
  bible_version_id INTEGER DEFAULT 111, -- YouVersion version ID

  -- 3D Dimensions
  head TEXT,  -- Information: What is this passage saying?
  heart TEXT, -- Transformation: God, what are You saying to me?
  hands TEXT, -- Activation: What action should I take?

  -- Timestamps
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, local_id)
);

CREATE INDEX idx_disciple_journal_account ON disciple_journal_entries(account_id);
CREATE INDEX idx_disciple_journal_sync ON disciple_journal_entries(account_id, updated_at DESC);
CREATE INDEX idx_disciple_journal_active ON disciple_journal_entries(account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_disciple_journal_date ON disciple_journal_entries(account_id, created_at DESC);

-- ============================================
-- 1.3 DISCIPLE PRAYER CARDS
-- Personal prayer cards for 4D Prayer
-- ============================================
CREATE TABLE disciple_prayer_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,

  -- Sync tracking
  local_id TEXT NOT NULL,

  -- Card content
  title TEXT NOT NULL,
  details TEXT,
  scripture TEXT, -- Optional scripture to pray over them
  photo_url TEXT, -- Optional photo

  -- Status
  status TEXT CHECK (status IN ('active', 'answered')) DEFAULT 'active',
  date_answered TIMESTAMPTZ,
  testimony TEXT, -- How was it answered?

  -- Usage tracking
  prayer_count INTEGER DEFAULT 0,
  last_prayed_at TIMESTAMPTZ,

  -- Timestamps
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, local_id)
);

CREATE INDEX idx_disciple_prayer_cards_account ON disciple_prayer_cards(account_id);
CREATE INDEX idx_disciple_prayer_cards_status ON disciple_prayer_cards(account_id, status);
CREATE INDEX idx_disciple_prayer_cards_active ON disciple_prayer_cards(account_id) WHERE deleted_at IS NULL AND status = 'active';

-- ============================================
-- 1.4 DISCIPLE PRAYER SESSIONS
-- Tracks prayer session completions
-- ============================================
CREATE TABLE disciple_prayer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,

  -- Session details
  duration_minutes INTEGER NOT NULL,
  cards_prayed INTEGER DEFAULT 0,

  -- Which phases did they complete?
  completed_revere BOOLEAN DEFAULT FALSE,
  completed_reflect BOOLEAN DEFAULT FALSE,
  completed_request BOOLEAN DEFAULT FALSE,
  completed_rest BOOLEAN DEFAULT FALSE,

  -- Sync tracking
  local_id TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, local_id)
);

CREATE INDEX idx_disciple_prayer_sessions_account ON disciple_prayer_sessions(account_id);
CREATE INDEX idx_disciple_prayer_sessions_date ON disciple_prayer_sessions(account_id, created_at DESC);

-- ============================================
-- 1.5 DISCIPLE TESTIMONIES
-- Testimony Builder using STORY framework
-- ============================================
CREATE TABLE disciple_testimonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,

  -- Sync tracking
  local_id TEXT NOT NULL,

  -- Metadata
  title TEXT NOT NULL,
  testimony_type TEXT CHECK (testimony_type IN (
    'salvation', 'healing', 'provision', 'breakthrough',
    'everyday_faithfulness', 'transformation',
    'relationship_restoration', 'direction_guidance'
  )),

  -- STORY Framework
  struggle TEXT,        -- S: Where were you before God intervened?
  turning_point TEXT,   -- T: When/how did God show up?
  outcome TEXT,         -- O: What changed as a result?
  reflection TEXT,      -- R: What did this teach you about God?
  your_invitation TEXT, -- Y: What hope can you offer others?

  -- Status
  status TEXT CHECK (status IN ('draft', 'complete')) DEFAULT 'draft',

  -- Timestamps
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, local_id)
);

CREATE INDEX idx_disciple_testimonies_account ON disciple_testimonies(account_id);
CREATE INDEX idx_disciple_testimonies_active ON disciple_testimonies(account_id) WHERE deleted_at IS NULL;

-- ============================================
-- 1.6 DISCIPLE PROGRESS
-- Streaks, badges, and engagement stats
-- ============================================
CREATE TABLE disciple_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Streaks
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  grace_day_used BOOLEAN DEFAULT FALSE, -- One grace day per streak

  -- Engagement totals
  total_journal_entries INTEGER DEFAULT 0,
  total_prayer_sessions INTEGER DEFAULT 0,
  total_prayer_cards INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,

  -- Badges (simple array for v1)
  badges TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disciple_progress_account ON disciple_progress(account_id);
CREATE INDEX idx_disciple_progress_streak ON disciple_progress(current_streak DESC);

-- ============================================
-- 1.7 DISCIPLE CREED PROGRESS
-- Tracks Creed Card mastery (cards are static in app)
-- ============================================
CREATE TABLE disciple_creed_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Cards mastered (IDs 1-50)
  cards_mastered INTEGER[] DEFAULT '{}',

  -- Study tracking
  last_studied_at TIMESTAMPTZ,
  total_study_sessions INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disciple_creed_progress_account ON disciple_creed_progress(account_id);

-- ============================================
-- SECTION 2: CONTENT & TEMPLATES
-- ============================================

-- NOTE: The following are static content stored in the app, not in the database:
-- - Daily Scriptures (Passage of the Day) - see /lib/scriptureData.ts
-- - Prayer Card Templates (4D Prayer) - see /lib/prayerData.ts

-- ============================================
-- SECTION 3: 90-DAY TOOLKIT
-- ============================================

-- ============================================
-- 3.1 TOOLKIT MODULES
-- 12-week content definitions
-- ============================================
CREATE TABLE toolkit_modules (
  id SERIAL PRIMARY KEY,

  -- Position in journey
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 3),  -- 1=Foundation, 2=Growth, 3=Multiplication
  week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 12),

  -- Content
  title TEXT NOT NULL,               -- e.g., "Life Assessment"
  subtitle TEXT,                     -- e.g., "Understanding Where You Are"
  description TEXT NOT NULL,         -- Brief overview for disciples
  teaching_content TEXT,             -- Short teaching content (NOT full leader content)

  -- Tool links (what tools this week uses)
  primary_tool TEXT,                 -- e.g., 'life_assessment', '3d_journal', '4d_prayer'
  tool_link TEXT,                    -- Deep link in app

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(week)
);

CREATE INDEX idx_toolkit_modules_month ON toolkit_modules(month);

-- ============================================
-- 3.2 TOOLKIT CHECKPOINTS
-- Checkpoint definitions per toolkit week
-- ============================================
CREATE TABLE toolkit_checkpoints (
  id SERIAL PRIMARY KEY,

  -- Links to module
  module_id INTEGER REFERENCES toolkit_modules(id) ON DELETE CASCADE NOT NULL,

  -- Checkpoint info
  checkpoint_key TEXT NOT NULL,      -- e.g., 'attended_meeting', 'completed_assessment'
  label TEXT NOT NULL,               -- Display label
  description TEXT,                  -- Optional description

  -- Tracking type
  tracking_type TEXT CHECK (tracking_type IN ('auto', 'self_marked', 'leader_controlled')) NOT NULL,
  -- auto: System detects (e.g., journal entry created)
  -- self_marked: Disciple checks off
  -- leader_controlled: Leader marks complete

  -- For auto-tracking: what triggers completion
  auto_trigger TEXT,                 -- e.g., 'journal_entry_created', 'assessment_submitted'

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  UNIQUE(module_id, checkpoint_key)
);

CREATE INDEX idx_toolkit_checkpoints_module ON toolkit_checkpoints(module_id);

-- ============================================
-- 3.3 DISCIPLE TOOLKIT PROGRESS
-- Individual progress through 90-Day Toolkit
-- ============================================
CREATE TABLE disciple_toolkit_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE,  -- Nullable for non-group users
  group_id UUID REFERENCES dna_groups(id) ON DELETE SET NULL,   -- Which group they're doing toolkit with

  -- Current position
  current_month INTEGER DEFAULT 1 CHECK (current_month BETWEEN 1 AND 3),
  current_week INTEGER DEFAULT 1 CHECK (current_week BETWEEN 1 AND 12),

  -- Month unlock status (auto-unlock based on completion)
  month_1_unlocked BOOLEAN DEFAULT TRUE,
  month_2_unlocked BOOLEAN DEFAULT FALSE,
  month_3_unlocked BOOLEAN DEFAULT FALSE,
  phase_2_unlocked BOOLEAN DEFAULT FALSE,  -- Post-toolkit, leader-controlled

  -- Dates
  started_at TIMESTAMPTZ DEFAULT NOW(),
  month_1_completed_at TIMESTAMPTZ,
  month_2_completed_at TIMESTAMPTZ,
  month_3_completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id)
);

CREATE INDEX idx_disciple_toolkit_progress_account ON disciple_toolkit_progress(account_id);
CREATE INDEX idx_disciple_toolkit_progress_group ON disciple_toolkit_progress(group_id);
CREATE INDEX idx_disciple_toolkit_progress_disciple ON disciple_toolkit_progress(disciple_id);

-- ============================================
-- 3.4 DISCIPLE CHECKPOINT COMPLETIONS
-- Tracks which checkpoints a disciple has completed
-- ============================================
CREATE TABLE disciple_checkpoint_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,
  checkpoint_id INTEGER REFERENCES toolkit_checkpoints(id) ON DELETE CASCADE NOT NULL,

  -- Completion info
  completed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Who marked it (for leader-controlled checkpoints)
  marked_by TEXT,  -- 'self', 'system', or leader name
  marked_by_id UUID, -- Leader ID if marked by leader

  -- Notes (optional)
  notes TEXT,

  UNIQUE(account_id, checkpoint_id)
);

CREATE INDEX idx_disciple_checkpoint_completions_account ON disciple_checkpoint_completions(account_id);

-- ============================================
-- SECTION 4: CHALLENGES
-- ============================================

-- ============================================
-- 4.1 CHALLENGE REGISTRATIONS
-- 3D Bible Challenge signups (open to all users)
-- ============================================
CREATE TABLE challenge_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,

  -- Challenge info
  challenge_name TEXT NOT NULL DEFAULT 'The 3D Bible Challenge',
  initial_days INTEGER NOT NULL CHECK (initial_days IN (7, 21, 50, 100, 365)),
  current_days INTEGER NOT NULL,     -- May increase if upgraded

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- User info (denormalized for display)
  display_name TEXT,
  email TEXT,

  -- Status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  badge_awarded BOOLEAN DEFAULT FALSE,

  -- Extended challenge tracking
  extended_to_days INTEGER,          -- If they upgraded mid-challenge

  -- Opt-in for text reminders
  phone TEXT,
  opted_in_texts BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_challenge_registrations_account ON challenge_registrations(account_id);
CREATE INDEX idx_challenge_registrations_active ON challenge_registrations(account_id, completed) WHERE completed = FALSE;
CREATE INDEX idx_challenge_registrations_dates ON challenge_registrations(start_date, end_date);

-- ============================================
-- SECTION 5: ASSESSMENTS
-- ============================================

-- ============================================
-- 5.1 LIFE ASSESSMENT QUESTIONS
-- 42 questions across 7 categories
-- ============================================
CREATE TABLE life_assessment_questions (
  id SERIAL PRIMARY KEY,

  -- Category
  category TEXT NOT NULL CHECK (category IN (
    'relationship_with_god',
    'spiritual_freedom',
    'identity_emotions',
    'relationships',
    'calling_purpose',
    'lifestyle_stewardship',
    'spiritual_fruit',
    'reflection'  -- Open-ended reflection questions
  )),

  -- Question
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('likert', 'multiple_choice', 'checkbox', 'open_ended')) NOT NULL,

  -- Options (for likert, multiple_choice, checkbox)
  options JSONB,  -- e.g., ["Never", "Rarely", "Sometimes", "Often", "Always"]

  -- For spiritual fruit specifically
  fruit_name TEXT,  -- e.g., "Love", "Joy", "Peace"

  -- Scoring weight (for likert questions)
  max_score INTEGER DEFAULT 5,

  -- Ordering
  sort_order INTEGER NOT NULL,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_life_assessment_questions_category ON life_assessment_questions(category);
CREATE INDEX idx_life_assessment_questions_active ON life_assessment_questions(is_active, sort_order);

-- ============================================
-- 5.2 LIFE ASSESSMENT RESPONSES
-- Disciple responses to Life Assessment
-- ============================================
CREATE TABLE life_assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,

  -- Assessment context
  assessment_type TEXT CHECK (assessment_type IN ('week_1', 'week_12')) NOT NULL,
  assignment_id UUID, -- Links to tool_assignments if assigned by leader

  -- Responses (JSONB for flexibility)
  responses JSONB NOT NULL DEFAULT '{}',  -- { "question_id": answer, ... }

  -- Scores by category (calculated on submission)
  category_scores JSONB,  -- { "relationship_with_god": 4.2, ... }
  overall_score DECIMAL(3,2),

  -- Status
  status TEXT CHECK (status IN ('in_progress', 'submitted')) DEFAULT 'in_progress',
  submitted_at TIMESTAMPTZ,

  -- Sync tracking
  local_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_life_assessment_responses_account ON life_assessment_responses(account_id);
CREATE INDEX idx_life_assessment_responses_type ON life_assessment_responses(account_id, assessment_type);
CREATE INDEX idx_life_assessment_responses_submitted ON life_assessment_responses(account_id, status) WHERE status = 'submitted';

-- ============================================
-- SECTION 6: DISCIPLESHIP MANAGEMENT
-- ============================================

-- ============================================
-- 6.1 TOOL ASSIGNMENTS
-- Leader assigns tools to disciples
-- ============================================
CREATE TABLE tool_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership (GROUP-based, not leader-based)
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE NOT NULL,
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE NOT NULL,

  -- Audit trail (who assigned, but no FK - survives leader removal)
  assigned_by_leader_id UUID,
  assigned_by_name TEXT, -- Denormalized for history

  -- Tool info
  tool_type TEXT NOT NULL CHECK (tool_type IN (
    'life_assessment_week1',
    'life_assessment_week12',
    'spiritual_gifts',
    'flow_assessment',
    'dam_assessment',
    '90_day_toolkit',
    'testimony_builder'
  )),

  -- Scheduling
  due_date DATE,
  week_number INTEGER, -- Which week in the journey

  -- Status
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',

  -- Notification tracking
  notified_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(group_id, disciple_id, tool_type)
);

CREATE INDEX idx_tool_assignments_group ON tool_assignments(group_id);
CREATE INDEX idx_tool_assignments_disciple ON tool_assignments(disciple_id);
CREATE INDEX idx_tool_assignments_pending ON tool_assignments(disciple_id, status) WHERE status = 'pending';
CREATE INDEX idx_tool_assignments_type ON tool_assignments(tool_type);

-- ============================================
-- 6.2 TOOL COMPLETIONS
-- Records when disciples complete tools
-- ============================================
CREATE TABLE tool_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  assignment_id UUID REFERENCES tool_assignments(id) ON DELETE SET NULL,
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,

  -- Tool info
  tool_type TEXT NOT NULL,

  -- Completion data
  completed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Results (varies by tool type)
  results JSONB DEFAULT '{}',
  -- For assessments: scores, responses, reflections
  -- For journal: entry count that session
  -- For prayer: session duration, cards prayed

  -- Sync tracking
  synced_from TEXT CHECK (synced_from IN ('app', 'web', 'import')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tool_completions_account ON tool_completions(account_id);
CREATE INDEX idx_tool_completions_assignment ON tool_completions(assignment_id);
CREATE INDEX idx_tool_completions_type ON tool_completions(account_id, tool_type);

-- ============================================
-- 6.3 JOURNEY CHECKPOINTS
-- Phase checkpoints that leaders mark complete
-- ============================================
CREATE TABLE journey_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE NOT NULL,
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE NOT NULL,

  -- Phase info (1-3 for disciples)
  phase INTEGER NOT NULL CHECK (phase BETWEEN 1 AND 3),
  checkpoint_key TEXT NOT NULL,
  -- Phase 1 (Foundation): 'life_assessment_done', 'first_journal', 'first_prayer_session'
  -- Phase 2 (Growth): 'spiritual_gifts_done', 'leading_discussion', 'testimony_complete'
  -- Phase 3 (Multiplication): 'life_assessment_final', 'multiplication_conversation', 'ready_to_lead'

  -- Completion
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by_leader_id UUID, -- No FK, survives leader removal
  completed_by_name TEXT,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(group_id, disciple_id, checkpoint_key)
);

CREATE INDEX idx_journey_checkpoints_group ON journey_checkpoints(group_id);
CREATE INDEX idx_journey_checkpoints_disciple ON journey_checkpoints(disciple_id);
CREATE INDEX idx_journey_checkpoints_phase ON journey_checkpoints(group_id, phase);

-- ============================================
-- 6.4 DISCIPLESHIP LOG
-- Unified timeline for notes, prayers, milestones
-- Replaces leader_notes and prayer_requests
-- ============================================
CREATE TABLE discipleship_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE NOT NULL,
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE NOT NULL,

  -- Author (no FK, survives leader removal)
  created_by_leader_id UUID,
  created_by_name TEXT,

  -- Entry type
  entry_type TEXT CHECK (entry_type IN ('note', 'prayer', 'milestone')) NOT NULL,

  -- Content
  content TEXT NOT NULL,

  -- For prayers specifically
  is_answered BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMPTZ,
  answer_notes TEXT,

  -- Privacy (hidden from church admins)
  is_private BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discipleship_log_group ON discipleship_log(group_id);
CREATE INDEX idx_discipleship_log_disciple ON discipleship_log(disciple_id);
CREATE INDEX idx_discipleship_log_type ON discipleship_log(group_id, entry_type);
CREATE INDEX idx_discipleship_log_created ON discipleship_log(group_id, created_at DESC);

-- ============================================
-- SECTION 7: NOTIFICATIONS
-- ============================================

-- ============================================
-- 7.1 DISCIPLE PUSH SUBSCRIPTIONS
-- Web Push API subscriptions
-- ============================================
CREATE TABLE disciple_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,

  -- Web Push API fields
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,

  -- Device info
  device_name TEXT,
  user_agent TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  failed_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, endpoint)
);

CREATE INDEX idx_disciple_push_subscriptions_account ON disciple_push_subscriptions(account_id);
CREATE INDEX idx_disciple_push_subscriptions_active ON disciple_push_subscriptions(account_id) WHERE is_active = TRUE;

-- ============================================
-- 7.2 DISCIPLE NOTIFICATION PREFS
-- Notification preferences per disciple
-- ============================================
CREATE TABLE disciple_notification_prefs (
  account_id UUID PRIMARY KEY REFERENCES disciple_app_accounts(id) ON DELETE CASCADE,

  -- Daily reminder
  daily_reminder_enabled BOOLEAN DEFAULT TRUE,
  daily_reminder_time TIME DEFAULT '08:00',

  -- Notification types
  streak_alerts BOOLEAN DEFAULT TRUE,
  assignment_alerts BOOLEAN DEFAULT TRUE,
  encouragement_alerts BOOLEAN DEFAULT TRUE,
  challenge_reminders BOOLEAN DEFAULT TRUE,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_start TIME DEFAULT '22:00',
  quiet_end TIME DEFAULT '07:00',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SECTION 8: SYNC TRACKING
-- ============================================

-- ============================================
-- 8.1 SYNC METADATA
-- Device sync tracking
-- ============================================
CREATE TABLE disciple_sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,

  -- Sync timestamps
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  last_journal_sync TIMESTAMPTZ,
  last_prayer_sync TIMESTAMPTZ,
  last_testimony_sync TIMESTAMPTZ,

  -- Device info
  device_name TEXT,
  app_version TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, device_id)
);

CREATE INDEX idx_disciple_sync_metadata_account ON disciple_sync_metadata(account_id);

-- ============================================
-- SECTION 9: SCHEMA MODIFICATIONS
-- ============================================

-- ============================================
-- 9.1 MODIFY DISCIPLES TABLE
-- Add link to app account
-- ============================================
ALTER TABLE disciples
ADD COLUMN IF NOT EXISTS app_account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_disciples_app_account ON disciples(app_account_id);

-- ============================================
-- 9.2 MODIFY DNA_GROUPS TABLE
-- Add journey tracking and make church_id nullable
-- ============================================

-- Make church_id nullable for independent groups (if not already)
ALTER TABLE dna_groups
ALTER COLUMN church_id DROP NOT NULL;

-- Add journey tracking columns
ALTER TABLE dna_groups
ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS journey_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS toolkit_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS toolkit_completed_at TIMESTAMPTZ;

-- ============================================
-- SECTION 10: ROW LEVEL SECURITY
-- ============================================

ALTER TABLE disciple_app_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciple_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciple_prayer_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciple_prayer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciple_testimonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciple_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciple_creed_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scriptures ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE toolkit_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE toolkit_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciple_toolkit_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciple_checkpoint_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipleship_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciple_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciple_notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciple_sync_metadata ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: Disciple App Account Access
-- ============================================

-- Disciples can view/update their own account
CREATE POLICY "Disciples can view own account"
ON disciple_app_accounts FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Disciples can update own account"
ON disciple_app_accounts FOR UPDATE
USING (id = auth.uid());

-- ============================================
-- RLS POLICIES: Journal Entries
-- ============================================

-- Disciples can CRUD their own entries
CREATE POLICY "Disciples can view own journal entries"
ON disciple_journal_entries FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can insert own journal entries"
ON disciple_journal_entries FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "Disciples can update own journal entries"
ON disciple_journal_entries FOR UPDATE
USING (account_id = auth.uid());

CREATE POLICY "Disciples can delete own journal entries"
ON disciple_journal_entries FOR DELETE
USING (account_id = auth.uid());

-- ============================================
-- RLS POLICIES: Prayer Cards
-- ============================================

CREATE POLICY "Disciples can view own prayer cards"
ON disciple_prayer_cards FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can insert own prayer cards"
ON disciple_prayer_cards FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "Disciples can update own prayer cards"
ON disciple_prayer_cards FOR UPDATE
USING (account_id = auth.uid());

CREATE POLICY "Disciples can delete own prayer cards"
ON disciple_prayer_cards FOR DELETE
USING (account_id = auth.uid());

-- ============================================
-- RLS POLICIES: Prayer Sessions
-- ============================================

CREATE POLICY "Disciples can view own prayer sessions"
ON disciple_prayer_sessions FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can insert own prayer sessions"
ON disciple_prayer_sessions FOR INSERT
WITH CHECK (account_id = auth.uid());

-- ============================================
-- RLS POLICIES: Testimonies
-- ============================================

CREATE POLICY "Disciples can view own testimonies"
ON disciple_testimonies FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can insert own testimonies"
ON disciple_testimonies FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "Disciples can update own testimonies"
ON disciple_testimonies FOR UPDATE
USING (account_id = auth.uid());

CREATE POLICY "Disciples can delete own testimonies"
ON disciple_testimonies FOR DELETE
USING (account_id = auth.uid());

-- ============================================
-- RLS POLICIES: Progress & Creed Progress
-- ============================================

CREATE POLICY "Disciples can view own progress"
ON disciple_progress FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can update own progress"
ON disciple_progress FOR UPDATE
USING (account_id = auth.uid());

CREATE POLICY "Disciples can insert own progress"
ON disciple_progress FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "Disciples can view own creed progress"
ON disciple_creed_progress FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can upsert own creed progress"
ON disciple_creed_progress FOR ALL
USING (account_id = auth.uid());

-- ============================================
-- RLS POLICIES: Content Tables (Public Read)
-- ============================================

CREATE POLICY "Anyone can view daily scriptures"
ON daily_scriptures FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Anyone can view prayer card templates"
ON prayer_card_templates FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Anyone can view toolkit modules"
ON toolkit_modules FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Anyone can view toolkit checkpoints"
ON toolkit_checkpoints FOR SELECT
USING (TRUE);

CREATE POLICY "Anyone can view life assessment questions"
ON life_assessment_questions FOR SELECT
USING (is_active = TRUE);

-- ============================================
-- RLS POLICIES: Toolkit Progress
-- ============================================

CREATE POLICY "Disciples can view own toolkit progress"
ON disciple_toolkit_progress FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can upsert own toolkit progress"
ON disciple_toolkit_progress FOR ALL
USING (account_id = auth.uid());

CREATE POLICY "Disciples can view own checkpoint completions"
ON disciple_checkpoint_completions FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can upsert own checkpoint completions"
ON disciple_checkpoint_completions FOR ALL
USING (account_id = auth.uid());

-- ============================================
-- RLS POLICIES: Challenge Registrations
-- ============================================

CREATE POLICY "Disciples can view own challenge registrations"
ON challenge_registrations FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can insert own challenge registrations"
ON challenge_registrations FOR INSERT
WITH CHECK (account_id = auth.uid());

CREATE POLICY "Disciples can update own challenge registrations"
ON challenge_registrations FOR UPDATE
USING (account_id = auth.uid());

-- ============================================
-- RLS POLICIES: Assessment Responses
-- ============================================

CREATE POLICY "Disciples can view own assessment responses"
ON life_assessment_responses FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can upsert own assessment responses"
ON life_assessment_responses FOR ALL
USING (account_id = auth.uid());

-- ============================================
-- RLS POLICIES: Tool Assignments (Disciples can view their own)
-- ============================================

CREATE POLICY "Disciples can view own tool assignments"
ON tool_assignments FOR SELECT
USING (disciple_id IN (
  SELECT d.id FROM disciples d
  JOIN disciple_app_accounts daa ON daa.id = d.app_account_id
  WHERE daa.id = auth.uid()
));

-- ============================================
-- RLS POLICIES: Tool Completions
-- ============================================

CREATE POLICY "Disciples can view own tool completions"
ON tool_completions FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can insert own tool completions"
ON tool_completions FOR INSERT
WITH CHECK (account_id = auth.uid());

-- ============================================
-- RLS POLICIES: Notifications
-- ============================================

CREATE POLICY "Disciples can view own push subscriptions"
ON disciple_push_subscriptions FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can manage own push subscriptions"
ON disciple_push_subscriptions FOR ALL
USING (account_id = auth.uid());

CREATE POLICY "Disciples can view own notification prefs"
ON disciple_notification_prefs FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can manage own notification prefs"
ON disciple_notification_prefs FOR ALL
USING (account_id = auth.uid());

-- ============================================
-- RLS POLICIES: Sync Metadata
-- ============================================

CREATE POLICY "Disciples can view own sync metadata"
ON disciple_sync_metadata FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "Disciples can manage own sync metadata"
ON disciple_sync_metadata FOR ALL
USING (account_id = auth.uid());

-- ============================================
-- SECTION 11: DATABASE FUNCTIONS
-- ============================================

-- ============================================
-- 11.1 CALCULATE DISCIPLE STREAK
-- Calculates current streak based on journal entries
-- ============================================
CREATE OR REPLACE FUNCTION calculate_disciple_streak(p_account_id UUID, p_timezone TEXT DEFAULT 'UTC')
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE;
  v_has_activity BOOLEAN;
  v_grace_used BOOLEAN := FALSE;
BEGIN
  -- Get today's date in user's timezone
  v_check_date := (NOW() AT TIME ZONE p_timezone)::DATE;

  -- Check for activity today first
  SELECT EXISTS (
    SELECT 1 FROM disciple_journal_entries
    WHERE account_id = p_account_id
      AND deleted_at IS NULL
      AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
  ) INTO v_has_activity;

  IF NOT v_has_activity THEN
    -- Check for activity yesterday (grace day check)
    v_check_date := v_check_date - INTERVAL '1 day';
    SELECT EXISTS (
      SELECT 1 FROM disciple_journal_entries
      WHERE account_id = p_account_id
        AND deleted_at IS NULL
        AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
    ) INTO v_has_activity;

    IF NOT v_has_activity THEN
      -- No activity today or yesterday, streak is 0
      RETURN 0;
    END IF;
    v_grace_used := TRUE;
  END IF;

  -- Count consecutive days with activity
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM disciple_journal_entries
      WHERE account_id = p_account_id
        AND deleted_at IS NULL
        AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
    ) INTO v_has_activity;

    IF v_has_activity THEN
      v_streak := v_streak + 1;
      v_check_date := v_check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;

    -- Safety limit
    IF v_streak > 1000 THEN EXIT; END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11.2 UPSERT JOURNAL ENTRY (for sync)
-- ============================================
CREATE OR REPLACE FUNCTION upsert_journal_entry(
  p_account_id UUID,
  p_local_id TEXT,
  p_scripture TEXT,
  p_scripture_passage TEXT,
  p_head TEXT,
  p_heart TEXT,
  p_hands TEXT,
  p_bible_version_id INTEGER,
  p_created_at TIMESTAMPTZ,
  p_updated_at TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO disciple_journal_entries (
    account_id, local_id, scripture, scripture_passage,
    head, heart, hands, bible_version_id, created_at, updated_at
  )
  VALUES (
    p_account_id, p_local_id, p_scripture, p_scripture_passage,
    p_head, p_heart, p_hands, p_bible_version_id, p_created_at, p_updated_at
  )
  ON CONFLICT (account_id, local_id)
  DO UPDATE SET
    scripture = EXCLUDED.scripture,
    scripture_passage = EXCLUDED.scripture_passage,
    head = EXCLUDED.head,
    heart = EXCLUDED.heart,
    hands = EXCLUDED.hands,
    bible_version_id = EXCLUDED.bible_version_id,
    updated_at = EXCLUDED.updated_at
  WHERE disciple_journal_entries.updated_at < EXCLUDED.updated_at
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11.3 UPSERT PRAYER CARD (for sync)
-- ============================================
CREATE OR REPLACE FUNCTION upsert_prayer_card(
  p_account_id UUID,
  p_local_id TEXT,
  p_title TEXT,
  p_details TEXT,
  p_scripture TEXT,
  p_status TEXT,
  p_prayer_count INTEGER,
  p_date_answered TIMESTAMPTZ,
  p_testimony TEXT,
  p_created_at TIMESTAMPTZ,
  p_updated_at TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO disciple_prayer_cards (
    account_id, local_id, title, details, scripture,
    status, prayer_count, date_answered, testimony,
    created_at, updated_at
  )
  VALUES (
    p_account_id, p_local_id, p_title, p_details, p_scripture,
    p_status, p_prayer_count, p_date_answered, p_testimony,
    p_created_at, p_updated_at
  )
  ON CONFLICT (account_id, local_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    details = EXCLUDED.details,
    scripture = EXCLUDED.scripture,
    status = EXCLUDED.status,
    prayer_count = GREATEST(disciple_prayer_cards.prayer_count, EXCLUDED.prayer_count),
    date_answered = EXCLUDED.date_answered,
    testimony = EXCLUDED.testimony,
    updated_at = EXCLUDED.updated_at
  WHERE disciple_prayer_cards.updated_at < EXCLUDED.updated_at
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11.4 UPDATE DISCIPLE PROGRESS
-- Called after journal/prayer activity
-- ============================================
CREATE OR REPLACE FUNCTION update_disciple_progress(p_account_id UUID)
RETURNS VOID AS $$
DECLARE
  v_timezone TEXT;
  v_streak INTEGER;
  v_journal_count INTEGER;
  v_prayer_count INTEGER;
  v_prayer_card_count INTEGER;
BEGIN
  -- Get user's timezone
  SELECT COALESCE(timezone, 'UTC') INTO v_timezone
  FROM disciple_app_accounts WHERE id = p_account_id;

  -- Calculate streak
  v_streak := calculate_disciple_streak(p_account_id, v_timezone);

  -- Count totals
  SELECT COUNT(*) INTO v_journal_count
  FROM disciple_journal_entries
  WHERE account_id = p_account_id AND deleted_at IS NULL;

  SELECT COUNT(*) INTO v_prayer_count
  FROM disciple_prayer_sessions
  WHERE account_id = p_account_id;

  SELECT COUNT(*) INTO v_prayer_card_count
  FROM disciple_prayer_cards
  WHERE account_id = p_account_id AND deleted_at IS NULL;

  -- Upsert progress
  INSERT INTO disciple_progress (
    account_id, current_streak, longest_streak, last_activity_date,
    total_journal_entries, total_prayer_sessions, total_prayer_cards
  )
  VALUES (
    p_account_id, v_streak, v_streak, (NOW() AT TIME ZONE v_timezone)::DATE,
    v_journal_count, v_prayer_count, v_prayer_card_count
  )
  ON CONFLICT (account_id)
  DO UPDATE SET
    current_streak = v_streak,
    longest_streak = GREATEST(disciple_progress.longest_streak, v_streak),
    last_activity_date = (NOW() AT TIME ZONE v_timezone)::DATE,
    total_journal_entries = v_journal_count,
    total_prayer_sessions = v_prayer_count,
    total_prayer_cards = v_prayer_card_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11.5 GET PASSAGE OF THE DAY
-- Returns today's scripture based on day of year
-- ============================================
CREATE OR REPLACE FUNCTION get_passage_of_the_day(p_cycle_year INTEGER DEFAULT 1)
RETURNS TABLE (
  id INTEGER,
  reference TEXT,
  theme TEXT,
  category TEXT,
  explanation TEXT
) AS $$
DECLARE
  v_day_of_year INTEGER;
  v_scripture_count INTEGER;
  v_scripture_index INTEGER;
BEGIN
  -- Get day of year (1-365)
  v_day_of_year := EXTRACT(DOY FROM CURRENT_DATE)::INTEGER;

  -- Count scriptures in this cycle
  SELECT COUNT(*) INTO v_scripture_count
  FROM daily_scriptures ds
  WHERE ds.cycle_year = p_cycle_year AND ds.is_active = TRUE;

  IF v_scripture_count = 0 THEN
    RETURN;
  END IF;

  -- Calculate which scripture to return (cycles through available scriptures)
  v_scripture_index := ((v_day_of_year - 1) % v_scripture_count) + 1;

  RETURN QUERY
  SELECT ds.id, ds.reference, ds.theme, ds.category, ds.explanation
  FROM daily_scriptures ds
  WHERE ds.cycle_year = p_cycle_year AND ds.is_active = TRUE
  ORDER BY COALESCE(ds.day_of_year, ds.sort_order, ds.id)
  LIMIT 1 OFFSET (v_scripture_index - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECTION 12: TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_disciple_app_accounts_updated_at
  BEFORE UPDATE ON disciple_app_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciple_journal_entries_updated_at
  BEFORE UPDATE ON disciple_journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciple_prayer_cards_updated_at
  BEFORE UPDATE ON disciple_prayer_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciple_testimonies_updated_at
  BEFORE UPDATE ON disciple_testimonies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciple_progress_updated_at
  BEFORE UPDATE ON disciple_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciple_creed_progress_updated_at
  BEFORE UPDATE ON disciple_creed_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_scriptures_updated_at
  BEFORE UPDATE ON daily_scriptures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciple_toolkit_progress_updated_at
  BEFORE UPDATE ON disciple_toolkit_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_registrations_updated_at
  BEFORE UPDATE ON challenge_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_life_assessment_responses_updated_at
  BEFORE UPDATE ON life_assessment_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tool_assignments_updated_at
  BEFORE UPDATE ON tool_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discipleship_log_updated_at
  BEFORE UPDATE ON discipleship_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciple_notification_prefs_updated_at
  BEFORE UPDATE ON disciple_notification_prefs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SECTION 13: GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION calculate_disciple_streak TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_journal_entry TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_prayer_card TO authenticated;
GRANT EXECUTE ON FUNCTION update_disciple_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_passage_of_the_day TO authenticated;
GRANT EXECUTE ON FUNCTION get_passage_of_the_day TO anon;

-- ============================================
-- END OF MIGRATION 034
-- ============================================

-- NOTES:
-- 1. Run seed scripts separately for:
--    - daily_scriptures (100 scriptures from ark-app data.js)
--    - prayer_card_templates (Revere/Reflect/Rest prompts)
--    - toolkit_modules (12 weeks)
--    - toolkit_checkpoints (per-week checkpoints)
--    - life_assessment_questions (42 questions)
--
-- 2. Data migration from existing tables:
--    - leader_notes → discipleship_log (entry_type = 'note')
--    - prayer_requests → discipleship_log (entry_type = 'prayer')
--
-- 3. Enable real-time subscriptions for:
--    - tool_assignments (leaders see when disciples complete)
--    - disciple_toolkit_progress (real-time progress updates)
