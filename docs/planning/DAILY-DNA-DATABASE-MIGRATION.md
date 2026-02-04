# Daily DNA Database Migration Plan

> Consolidating Daily DNA app to use DNA Hub's Supabase database

## Overview

This document outlines the migration strategy for bringing Daily DNA app functionality into the DNA Hub database, enabling seamless integration between the DNA Groups Dashboard and the Daily DNA mobile app.

---

## Current State

### DNA Hub Database (Target)
**Tables already exist:**
- `users` - Unified user accounts
- `user_roles` - Role assignments (church_leader, dna_leader, training_participant, admin)
- `disciples` - Group participants (no login, token-based)
- `dna_groups` - Discipleship groups
- `group_disciples` - Group membership
- `dna_leaders` - DNA group leaders
- `user_training_progress` - Training journey progress
- `user_content_unlocks` - Content unlock status
- `user_flow_assessments` - Flow Assessment responses
- `life_assessments` - Week 1/8 assessments
- `leader_notes` - Private notes on disciples
- `prayer_requests` - Prayer tracking (leader-managed)

### Ark App Database (Source)
**Tables to migrate:**
- `journal_entries` - 3D Journal (Head/Heart/Hands)
- `prayer_cards` - Personal prayer requests (4D Prayer)
- `user_progress` - Streaks, badges, mastered cards
- `profiles` - User profile info
- `dna_progress` - DNA training progress (JSONB)
- `dna_dam_assessments` - Dam Assessment responses
- `push_subscriptions` - Web push notifications
- `notification_preferences` - Reminder settings

**Tables NOT needed:**
- Prayer Room tables (Ark-specific live feature)
- Events/RSVPs (Ark-specific)
- Community posts/likes (can add later)
- Challenge registrations (Ark-specific)

---

## Migration Mapping

### 1. Tables to CREATE (New in DNA Hub)

| New Table | Based On | Purpose |
|-----------|----------|---------|
| `disciple_app_accounts` | NEW | Links disciples to their Daily DNA app account |
| `disciple_journal_entries` | `journal_entries` | 3D Journal for disciples |
| `disciple_prayer_cards` | `prayer_cards` | Personal prayer cards for disciples |
| `disciple_progress` | `user_progress` | Streaks, badges for disciples |
| `disciple_push_subscriptions` | `push_subscriptions` | Push notifications for disciples |
| `disciple_notification_prefs` | `notification_preferences` | Notification settings |
| `tool_assignments` | NEW | Leader assigns tools to disciples |
| `tool_completions` | NEW | Tracks tool completion (syncs from app) |
| `journey_checkpoints` | NEW | Phase checkpoints for disciples |
| `discipleship_log` | NEW | Leader notes + prayer requests (replaces separate tables) |

### 2. Tables to EXTEND (Add columns)

| Existing Table | New Columns | Purpose |
|----------------|-------------|---------|
| `disciples` | `app_account_id` | Link to Daily DNA account |
| `dna_groups` | `current_week`, `journey_config` | Track group progress |

### 3. Tables that ALREADY EXIST (No changes needed)

| Table | Notes |
|-------|-------|
| `users` | Already has unified auth |
| `user_roles` | Already supports multiple roles |
| `user_flow_assessments` | Already has roadblock ratings |
| `user_training_progress` | For leaders, not disciples |

---

## New Table Schemas

### disciple_app_accounts
Links disciples to their Daily DNA app login.

```sql
CREATE TABLE disciple_app_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE NOT NULL,

  -- Auth (separate from DNA Hub users table - disciples have their own auth)
  email TEXT NOT NULL,
  password_hash TEXT, -- If using email/password
  auth_provider TEXT, -- 'email', 'google', 'discord', 'apple'
  auth_provider_id TEXT, -- External provider ID

  -- Profile
  display_name TEXT,
  avatar_url TEXT,

  -- Church white-labeling
  church_id UUID REFERENCES churches(id),
  church_subdomain TEXT, -- e.g., 'newlife' for newlife.dailydna.app

  -- Account status
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email)
);
```

### disciple_journal_entries
3D Journal entries for disciples.

```sql
CREATE TABLE disciple_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE NOT NULL,

  -- Sync tracking
  local_id TEXT, -- Client-generated ID for sync
  sync_token UUID DEFAULT gen_random_uuid(),

  -- Scripture
  scripture TEXT NOT NULL,
  scripture_passage TEXT,
  bible_version INTEGER DEFAULT 111, -- YouVersion version ID

  -- 3D Dimensions
  head TEXT, -- Information: What is this passage saying?
  heart TEXT, -- Transformation: God, what are You saying to me?
  hands TEXT, -- Activation: What action should I take?

  -- Timestamps
  deleted_at TIMESTAMPTZ, -- Soft delete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disciple_journal_disciple ON disciple_journal_entries(disciple_id);
CREATE INDEX idx_disciple_journal_local_id ON disciple_journal_entries(local_id);
CREATE INDEX idx_disciple_journal_sync ON disciple_journal_entries(disciple_id, updated_at DESC);
```

### disciple_prayer_cards
Personal prayer cards for 4D Prayer.

```sql
CREATE TABLE disciple_prayer_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE NOT NULL,

  -- Sync tracking
  local_id TEXT,

  -- Card content
  title TEXT NOT NULL,
  details TEXT,

  -- Status
  status TEXT CHECK (status IN ('active', 'answered')) DEFAULT 'active',
  date_answered TIMESTAMPTZ,
  testimony TEXT, -- How was it answered?

  -- Usage tracking
  prayer_count INTEGER DEFAULT 0,
  is_shared BOOLEAN DEFAULT FALSE, -- Shared with group?

  -- Timestamps
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### disciple_progress
Tracks streaks, badges, and engagement.

```sql
CREATE TABLE disciple_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Streaks
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,

  -- Engagement stats
  total_journal_entries INTEGER DEFAULT 0,
  total_prayer_sessions INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,

  -- Badges
  badges TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### tool_assignments
Leader assigns tools to disciples.

```sql
CREATE TABLE tool_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE NOT NULL,
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES dna_leaders(id) NOT NULL,

  -- Tool info
  tool_type TEXT NOT NULL,
  -- Options: 'life_assessment_week1', 'life_assessment_week8',
  --          'spiritual_gifts', 'flow_assessment', 'dam_assessment',
  --          '3d_journal', '4d_prayer'

  -- Scheduling
  due_date DATE,
  week_number INTEGER, -- Which week in the journey

  -- Status
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',

  -- Notification tracking
  notified_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tool_assignments_group ON tool_assignments(group_id);
CREATE INDEX idx_tool_assignments_disciple ON tool_assignments(disciple_id);
CREATE INDEX idx_tool_assignments_status ON tool_assignments(status);
```

### tool_completions
Tracks when disciples complete tools (syncs from Daily DNA app).

```sql
CREATE TABLE tool_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES tool_assignments(id) ON DELETE CASCADE,
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE NOT NULL,

  -- Tool info
  tool_type TEXT NOT NULL,

  -- Completion data
  completed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Results (depends on tool type)
  results JSONB DEFAULT '{}',
  -- For assessments: scores, ratings, reflections
  -- For journal: entry count that session
  -- For prayer: session duration, cards prayed over

  -- Sync tracking
  synced_from TEXT, -- 'app' or 'web'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tool_completions_disciple ON tool_completions(disciple_id);
CREATE INDEX idx_tool_completions_type ON tool_completions(tool_type);
```

### journey_checkpoints
Phase checkpoints that leaders mark complete.

```sql
CREATE TABLE journey_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE NOT NULL,
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE NOT NULL,

  -- Phase info (0-3 for disciples)
  phase INTEGER NOT NULL CHECK (phase BETWEEN 0 AND 3),
  checkpoint_key TEXT NOT NULL,
  -- Phase 0 (Invitation): 'invited', 'app_setup', 'intro_meeting'
  -- Phase 1 (Foundation): 'week1_complete', 'life_assessment_done', 'first_journal'
  -- Phase 2 (Growth): 'week4_complete', 'spiritual_gifts_done', 'leading_discussion'
  -- Phase 3 (Multiplication): 'week8_complete', 'life_assessment_final', 'multiplication_conversation'

  -- Completion
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES dna_leaders(id), -- Leader who marked it

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(group_id, disciple_id, checkpoint_key)
);

CREATE INDEX idx_journey_checkpoints_group ON journey_checkpoints(group_id);
CREATE INDEX idx_journey_checkpoints_disciple ON journey_checkpoints(disciple_id);
CREATE INDEX idx_journey_checkpoints_phase ON journey_checkpoints(phase);
```

### discipleship_log
Unified notes + prayer requests (replaces leader_notes + prayer_requests).

```sql
CREATE TABLE discipleship_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE NOT NULL,
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE NOT NULL,
  leader_id UUID REFERENCES dna_leaders(id) NOT NULL,

  -- Entry type
  entry_type TEXT CHECK (entry_type IN ('note', 'prayer', 'milestone')) NOT NULL,

  -- Content
  content TEXT NOT NULL,

  -- For prayers specifically
  is_answered BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMPTZ,
  answer_notes TEXT,

  -- Privacy
  is_private BOOLEAN DEFAULT TRUE, -- Hidden from church admins

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discipleship_log_group ON discipleship_log(group_id);
CREATE INDEX idx_discipleship_log_disciple ON discipleship_log(disciple_id);
CREATE INDEX idx_discipleship_log_type ON discipleship_log(entry_type);
```

---

## Sync Strategy

### Real-time Events (Instant)
These trigger immediately via Supabase real-time:
- Tool completions (assessment finished, journal saved)
- Phase checkpoint completions
- New prayer request marked answered

### Daily Batch (Aggregated)
Run nightly at 3 AM:
- Update `disciple_progress` (streak calculations, totals)
- Engagement analytics rollup
- Badge awards

### On-Demand (When Leader Views Profile)
Refresh with 5-minute cache:
- Latest journal entry count
- Recent prayer session stats
- Current streak

---

## Migration Steps

### Phase 1: Schema (Migration 034)
1. Create all new tables
2. Add indexes
3. Set up RLS policies
4. Create sync functions

### Phase 2: API Updates
1. Update DNA Groups Dashboard API to use new tables
2. Create Daily DNA sync endpoints
3. Add webhook handlers for tool completions

### Phase 3: Daily DNA Integration
1. Update Daily DNA app to point to DNA Hub database
2. Implement two-way sync for journal/prayer
3. Add tool assignment notifications

### Phase 4: Data Migration (If Needed)
1. Export active users from Ark App
2. Create `disciple_app_accounts` records
3. Link to existing `disciples` records where email matches

---

## White-Labeling Support

The `disciple_app_accounts.church_subdomain` field enables:
- `newlife.dailydna.app` → NewLife Church branding
- `grace.dailydna.app` → Grace Church branding

When a leader invites a disciple:
1. System checks leader's `church_id`
2. Gets church's subdomain from `churches.subdomain`
3. Invite link includes subdomain: `https://grace.dailydna.app/invite?token=xxx`
4. Disciple creates account, `church_subdomain` is set automatically

---

## Questions Resolved

| Question | Decision |
|----------|----------|
| Same database? | ✅ Yes - Daily DNA uses DNA Hub Supabase |
| Auth system? | Separate - disciples use `disciple_app_accounts`, not `users` |
| Sync method? | Hybrid - real-time for tools, batch for analytics |
| Phase advancement? | Manual - leader marks checkpoints complete |
| Co-leader permissions? | Add/remove disciples ✅, Assign tools ✅, Mark checkpoints ✅, Archive ❌, Invite co-leaders ❌ |

---

## Next Steps

1. Review this plan
2. Create migration 034 with new tables
3. Update DNA Groups Dashboard to use new schema
4. Build out Disciple Profile Page UI
5. Implement Daily DNA sync layer
