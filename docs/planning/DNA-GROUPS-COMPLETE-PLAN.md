# DNA Groups - Complete Implementation Plan

**Created:** February 3, 2026
**Status:** Planning Complete | Ready for Implementation
**Last Updated:** February 3, 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Discipleship Phases](#discipleship-phases)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [UI Pages & Components](#ui-pages--components)
7. [Daily DNA Integration](#daily-dna-integration)
8. [Privacy Matrix](#privacy-matrix)
9. [Implementation Phases](#implementation-phases)
10. [Open Questions](#open-questions)

---

## Executive Summary

### What We're Building

A comprehensive discipleship management system that allows DNA Leaders to:
- Track disciples through a 12-month journey (Phases 0-3)
- Assign tools from the Daily DNA app and view results
- Log notes and prayer requests for each disciple
- See engagement analytics (without seeing private content)
- Multiply groups when disciples are ready to lead

### Key Integrations

**DNA Hub** (Leader-facing) ↔ **Daily DNA App** (Disciple-facing)
- Same Supabase database
- DNA Hub triggers tool unlocks → Daily DNA unlocks for disciple
- Daily DNA sends completion events → DNA Hub stores PDFs in profiles

### Core Features Still Needed

| Feature | Status | Priority |
|---------|--------|----------|
| Leader Notes + Prayer Requests | Not Started | High |
| Disciple Profile Page | Not Started | High |
| Group Phase Advancement | Not Started | High |
| Co-Leader System | Not Started | High |
| Disciple Journey View | Not Started | High |
| Tool Assignment System | Not Started | Medium |
| Daily DNA Integration | Not Started | Medium |
| Engagement Analytics | Not Started | Medium |
| Multiplication Wizard | Not Started | Medium |
| Multiplication Tree | Not Started | Low |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              DNA HUB                                     │
│                     (Church & Leader Management)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │ Church Dashboard │  │ DNA Groups       │  │ DNA Training     │       │
│  │ (Roadmap 1)      │  │ (Roadmap 2)      │  │ (Roadmap 3)      │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│                              │                                           │
│                              ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    DNA GROUPS DASHBOARD                           │   │
│  │                                                                   │   │
│  │  • Group Management (phases, co-leaders)                         │   │
│  │  • Disciple Profiles (journey, notes, prayers, assessments)      │   │
│  │  • Tool Assignments (trigger tools in Daily DNA)                 │   │
│  │  • Analytics (engagement, completion, streaks)                   │   │
│  │  • Multiplication Tracking (family tree)                         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              │ API / Webhooks                            │
│                              ▼                                           │
└─────────────────────────────────────────────────────────────────────────┘
                               │
                               │ Shared Supabase Database
                               │
┌─────────────────────────────────────────────────────────────────────────┐
│                           DAILY DNA APP                                  │
│                        (Disciple-Facing PWA)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ 3D Journal   │ │ 4D Prayer    │ │ Creed Cards  │ │ Life         │   │
│  │ (Built) ✅   │ │ (Built) ✅   │ │ (Built) ✅   │ │ Assessment   │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ │ (To Build)   │   │
│                                                      └──────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                     │
│  │ Spiritual    │ │ Testimony    │ │ 90-Day       │                     │
│  │ Gifts Test   │ │ Builder      │ │ Toolkit      │                     │
│  │ (To Build)   │ │ (To Build)   │ │ (To Build)   │                     │
│  └──────────────┘ └──────────────┘ └──────────────┘                     │
│                                                                          │
│  • Receives tool unlock triggers from DNA Hub                           │
│  • Syncs completion events + PDFs back to DNA Hub                       │
│  • Tracks engagement metrics (streaks, time, frequency)                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Daily DNA App Details

- **Location:** `/Users/docgrfx/Documents/GitHub/dna-app/daily-dna/`
- **Stack:** Next.js 16 + React 19 + TypeScript + Supabase + Tailwind 4 (PWA)
- **Auth:** Supabase Auth (email/password, OAuth, magic links)
- **Database:** Same Supabase instance as DNA Hub
- **Status:** ~1 week from ready for implementation

**Currently Built:**
- 3D Journal (Head/Heart/Hands)
- 4D Prayer (Revere/Reflect/Request/Rest)
- Creed Cards

**To Be Built:**
- Life Assessment
- Spiritual Gifts Test
- Testimony Builder
- 90-Day Toolkit (disciple version)

---

## Discipleship Phases

Based on the DNA Launch Guide and 90-Day Toolkit:

| Phase | Name | Duration | Focus |
|-------|------|----------|-------|
| **Phase 0** | Pre-Launch | 6 weeks before | Leader prep, find co-leader, recruit disciples |
| **Phase 1** | Foundation | Months 1-3 (12 weeks) | Learn DNA tools, build trust, 90-Day Toolkit |
| **Phase 2** | Growth | Months 4-6 | Practice leading, take ownership |
| **Phase 3** | Multiplication | Months 7-12 | Launch new groups |

### Phase 0: Pre-Launch (6 weeks before first meeting)

**Focus:** Leader preparation and disciple recruitment

**Checkpoints:**
- [ ] Leader Self-Assessment completed
- [ ] Co-Leader secured
- [ ] Meeting time/location set
- [ ] Prayer list created and prayed over
- [ ] 2+ disciples committed
- [ ] First meeting scheduled
- [ ] DNA Group Agreement shared

### Phase 1: Foundation (Months 1-3 | 12 Weeks)

**Focus:** Learning core DNA tools, establishing trust, building safe environment

#### Month 1: Foundation (Weeks 1-4)
| Week | Topic | Tool |
|------|-------|------|
| Week 1 | Life Assessment | Life Assessment (baseline) |
| Week 2 | 3D Journal | 3D Journal introduction |
| Week 3 | 4D Prayer Rhythm | 4D Prayer introduction |
| Week 4 | Creed Cards | Creed Cards foundation |

#### Month 2: Deepening (Weeks 5-8)
| Week | Topic | Tool |
|------|-------|------|
| Week 5 | Q&A Deep Dive | Discussion |
| Week 6 | Listening Prayer Circle | Listening Prayer |
| Week 7 | Outreach/Mission Activity | Mission |
| Week 8 | Testimony Time | Testimony Builder |

#### Month 3: Breakthrough (Weeks 9-12)
| Week | Topic | Tool |
|------|-------|------|
| Week 9 | Breaking Strongholds | Reveal/Renounce/Replace |
| Week 10 | Identity Shift Workshop | Identity work |
| Week 11 | Spiritual Gifts Test | Spiritual Gifts |
| Week 12 | Life Assessment Revisited | Life Assessment (comparison) |

**Phase 1 Completion Criteria:**
- ✅ 80%+ attendance
- ✅ Engaging in group chat
- ✅ Demonstrating vulnerability and trust
- ✅ Teachable and receiving correction well
- ✅ Practicing spiritual disciplines independently
- ✅ Addressed at least one major stronghold
- ✅ Mastered DNA tools
- ✅ Expressing readiness to lead or facilitate

### Phase 2: Growth (Months 4-6)

**Focus:** From students to practitioners; give them "reps"

**Checkpoints:**
- [ ] Leading devotionals confidently
- [ ] Initiating spiritual conversations
- [ ] Hearing from God and sharing
- [ ] Showing emotional/spiritual maturity
- [ ] Handling correction well
- [ ] Demonstrating fruit of the Spirit
- [ ] Expressing desire to disciple others
- [ ] Consistent in spiritual disciplines

### Phase 3: Multiplication (Months 7-12)

**Focus:** Release disciples into leadership; launch new DNA groups

**Multiplication Readiness Checklist:**
- [ ] Can articulate the gospel clearly
- [ ] Leads self spiritually (consistent PB&J)
- [ ] Handles correction with humility
- [ ] Initiates spiritual conversations
- [ ] Demonstrates fruit of the Spirit
- [ ] Identified 2-3 potential disciples
- [ ] Completed full 12-month cycle
- [ ] Shows faithfulness in small things
- [ ] New DNA group launched

---

## Database Schema

### New Tables for DNA Hub

```sql
-- =============================================
-- DISCIPLE JOURNEY TRACKING
-- =============================================

-- Disciple phases (like church phases, but for individuals)
CREATE TABLE disciple_journey (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disciple_id UUID NOT NULL REFERENCES disciples(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES dna_groups(id) ON DELETE CASCADE,
    current_phase INTEGER DEFAULT 0, -- 0, 1, 2, 3
    phase_0_started_at TIMESTAMPTZ,
    phase_0_completed_at TIMESTAMPTZ,
    phase_1_started_at TIMESTAMPTZ,
    phase_1_completed_at TIMESTAMPTZ,
    phase_2_started_at TIMESTAMPTZ,
    phase_2_completed_at TIMESTAMPTZ,
    phase_3_started_at TIMESTAMPTZ,
    phase_3_completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active', -- active, multiplied, dropped_out, archived
    multiplied_to_group_id UUID REFERENCES dna_groups(id), -- If they became a leader
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(disciple_id, group_id)
);

-- Phase checkpoints (what needs to be completed in each phase)
CREATE TABLE disciple_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disciple_id UUID NOT NULL REFERENCES disciples(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES dna_groups(id) ON DELETE CASCADE,
    phase INTEGER NOT NULL, -- 0, 1, 2, 3
    checkpoint_key TEXT NOT NULL, -- e.g., 'week_1_life_assessment', 'week_2_3d_journal'
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES dna_leaders(id), -- Who marked it complete
    metadata JSONB, -- Store extra data (assessment_id, pdf_url, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(disciple_id, group_id, checkpoint_key)
);

-- =============================================
-- TOOL ASSIGNMENTS
-- =============================================

-- When a leader assigns a tool to a disciple
CREATE TABLE tool_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disciple_id UUID NOT NULL REFERENCES disciples(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES dna_groups(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES dna_leaders(id),
    tool_type TEXT NOT NULL, -- 'life_assessment', 'spiritual_gifts', 'testimony_builder', '90_day_toolkit'
    context TEXT, -- e.g., 'Week 1 Assessment', 'Week 12 Re-assessment'
    phase INTEGER, -- Which phase this is for
    week INTEGER, -- Which week (if applicable)
    due_date DATE,
    message TEXT, -- Optional message to disciple
    status TEXT DEFAULT 'pending', -- pending, sent, started, completed
    sent_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    result_pdf_url TEXT, -- URL to generated PDF
    result_data JSONB, -- Raw result data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENGAGEMENT ANALYTICS (from Daily DNA)
-- =============================================

-- Daily engagement snapshots (synced from Daily DNA)
CREATE TABLE disciple_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disciple_id UUID NOT NULL REFERENCES disciples(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    journal_entries INTEGER DEFAULT 0, -- Count for the day
    journal_time_minutes INTEGER DEFAULT 0,
    prayer_sessions INTEGER DEFAULT 0,
    prayer_time_minutes INTEGER DEFAULT 0,
    creed_cards_reviewed INTEGER DEFAULT 0,
    creed_cards_time_minutes INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,
    streak_current INTEGER DEFAULT 0,
    streak_longest INTEGER DEFAULT 0,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(disciple_id, date)
);

-- Weekly engagement summaries (aggregated)
CREATE TABLE disciple_engagement_weekly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disciple_id UUID NOT NULL REFERENCES disciples(id) ON DELETE CASCADE,
    week_start DATE NOT NULL, -- Monday of the week
    journal_days INTEGER DEFAULT 0, -- Days with journal entries
    prayer_days INTEGER DEFAULT 0,
    creed_days INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,
    consistency_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(disciple_id, week_start)
);

-- =============================================
-- CO-LEADER MANAGEMENT
-- =============================================

-- Group co-leaders (multiple allowed)
CREATE TABLE group_co_leaders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES dna_groups(id) ON DELETE CASCADE,
    leader_id UUID NOT NULL REFERENCES dna_leaders(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES dna_leaders(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending', -- pending, active, removed
    is_primary BOOLEAN DEFAULT FALSE, -- Original group creator
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, leader_id)
);

-- =============================================
-- MULTIPLICATION TRACKING
-- =============================================

-- Track multiplication lineage
CREATE TABLE multiplication_tree (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_group_id UUID REFERENCES dna_groups(id) ON DELETE SET NULL,
    child_group_id UUID NOT NULL REFERENCES dna_groups(id) ON DELETE CASCADE,
    multiplied_at TIMESTAMPTZ DEFAULT NOW(),
    multiplied_from_disciple_id UUID REFERENCES disciples(id), -- Who became the new leader
    notes TEXT,
    UNIQUE(child_group_id)
);

-- =============================================
-- LEADER/DISCIPLE NOTES & PRAYERS (Combined Log)
-- =============================================

-- Combined discipleship log (notes + prayers)
CREATE TABLE discipleship_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disciple_id UUID NOT NULL REFERENCES disciples(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES dna_groups(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES dna_leaders(id),
    entry_type TEXT NOT NULL, -- 'note', 'prayer_request', 'milestone'
    content TEXT NOT NULL,
    phase INTEGER, -- Which phase this relates to
    checkpoint_id UUID REFERENCES disciple_checkpoints(id), -- Optional link to checkpoint

    -- For prayer requests
    is_answered BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMPTZ,
    answer_note TEXT,

    -- For milestones
    milestone_type TEXT, -- 'phase_complete', 'tool_complete', 'breakthrough', etc.

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GROUP PHASE TRACKING (Update existing table)
-- =============================================

-- Updates to dna_groups table
ALTER TABLE dna_groups
    ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 0, -- 0, 1, 2, 3
    ADD COLUMN IF NOT EXISTS phase_0_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS phase_0_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS phase_1_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS phase_1_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS phase_2_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS phase_2_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS phase_3_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS phase_3_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS multiplied_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
```

### Shared Tables (DNA Hub ↔ Daily DNA)

```sql
-- =============================================
-- DISCIPLE ACCOUNTS (Links DNA Hub disciples to Daily DNA users)
-- =============================================

CREATE TABLE disciple_app_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disciple_id UUID NOT NULL REFERENCES disciples(id) ON DELETE CASCADE,
    daily_dna_user_id UUID NOT NULL, -- References auth.users in Supabase
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    linked_by UUID REFERENCES dna_leaders(id), -- Leader who sent the invite
    UNIQUE(disciple_id),
    UNIQUE(daily_dna_user_id)
);

-- =============================================
-- TOOL UNLOCK TRIGGERS (DNA Hub → Daily DNA)
-- =============================================

CREATE TABLE tool_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_dna_user_id UUID NOT NULL, -- The user in Daily DNA
    tool_type TEXT NOT NULL, -- 'life_assessment', 'spiritual_gifts', etc.
    assignment_id UUID REFERENCES tool_assignments(id), -- Link back to DNA Hub
    context TEXT, -- 'week_1', 'week_12', etc.
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Optional expiration
    completed_at TIMESTAMPTZ,
    result_data JSONB,
    UNIQUE(daily_dna_user_id, tool_type, context)
);

-- =============================================
-- COMPLETION EVENTS (Daily DNA → DNA Hub)
-- =============================================

CREATE TABLE tool_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_dna_user_id UUID NOT NULL,
    tool_type TEXT NOT NULL,
    context TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    result_data JSONB, -- The actual results
    pdf_url TEXT, -- Generated PDF location
    synced_to_hub BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMPTZ
);
```

---

## API Routes

### Group Management
```
PATCH /api/groups/[id]/phase          - Advance group phase
POST  /api/groups/[id]/co-leaders     - Invite co-leader
DELETE /api/groups/[id]/co-leaders/[leaderId] - Remove co-leader
POST  /api/groups/[id]/archive        - Archive/multiply group
```

### Disciple Management
```
GET   /api/groups/[id]/disciples/[discipleId]           - Get disciple profile
PATCH /api/groups/[id]/disciples/[discipleId]           - Update disciple
POST  /api/groups/[id]/disciples/[discipleId]/promote   - Promote to DNA leader
```

### Disciple Journey
```
GET   /api/groups/[id]/disciples/[discipleId]/journey       - Get journey with checkpoints
PATCH /api/groups/[id]/disciples/[discipleId]/phase         - Advance disciple phase
POST  /api/groups/[id]/disciples/[discipleId]/checkpoints   - Complete checkpoint
```

### Tool Assignments
```
GET   /api/groups/[id]/disciples/[discipleId]/assignments   - List assignments
POST  /api/groups/[id]/disciples/[discipleId]/assignments   - Create assignment (trigger tool)
```

### Discipleship Log (Notes + Prayers)
```
GET   /api/groups/[id]/disciples/[discipleId]/log           - Get all entries
POST  /api/groups/[id]/disciples/[discipleId]/log           - Add entry (note or prayer)
PATCH /api/groups/[id]/disciples/[discipleId]/log/[entryId] - Update entry
DELETE /api/groups/[id]/disciples/[discipleId]/log/[entryId]- Delete entry
PATCH /api/groups/[id]/disciples/[discipleId]/log/[entryId]/answer - Mark prayer answered
```

### Analytics
```
GET   /api/groups/[id]/disciples/[discipleId]/engagement    - Get engagement stats
GET   /api/groups/[id]/analytics                            - Group-level analytics
```

### Multiplication
```
GET   /api/leaders/[id]/multiplication-tree                 - Get leader's multiplication tree
POST  /api/groups/[id]/multiply                             - Multiply group into new groups
```

### Daily DNA Integration
```
POST  /api/integration/daily-dna/trigger-tool     - Trigger tool unlock in Daily DNA
POST  /api/integration/daily-dna/completion       - Webhook for tool completion
GET   /api/integration/daily-dna/sync-engagement  - Sync engagement data
```

---

## UI Pages & Components

### New Pages
```
/groups/[id]/disciples/[discipleId]              - Disciple profile page
/groups/[id]/disciples/[discipleId]/journey      - Journey view (phases & checkpoints)
/groups/[id]/disciples/[discipleId]/assessments  - All assessments (PDFs)
/groups/[id]/settings                            - Group settings (co-leaders, etc.)
/groups/[id]/multiply                            - Multiplication wizard
/groups/analytics                                - Leader's overall analytics
/groups/multiplication-tree                      - Visual multiplication tree
```

### Key Components
```
<DiscipleProfile />          - Main profile with all sections
<DiscipleJourney />          - Phase progress with checkpoints
<DiscipleshipLog />          - Combined notes + prayers timeline
<ToolAssignmentModal />      - Assign tool to disciple
<EngagementChart />          - Visualize app engagement
<PhaseAdvancement />         - Modal to advance phase
<CoLeaderInvite />           - Invite co-leader modal
<MultiplicationWizard />     - Guide through multiplication
<MultiplicationTree />       - Visual family tree
```

### UI Mockups

#### Disciple Profile Page
```
┌─────────────────────────────────────────────────────────────────┐
│ JOHN SMITH                                    Phase 1 • Week 3   │
│ john@email.com • (555) 123-4567              Joined Jan 15, 2026 │
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                       │
│  QUICK ACTIONS           │  JOURNEY PROGRESS                     │
│  ──────────────          │  ────────────────                     │
│  [+ Assign Tool]         │  ████████░░░░░░░░ 45%                 │
│  [+ Add Note]            │                                       │
│  [+ Prayer Request]      │  Current: Week 3 - Spiritual          │
│                          │           Disciplines                  │
│  ASSESSMENTS             │                                       │
│  ───────────             │  Pending: 3D Journal (4 more entries) │
│  📄 Life Assessment W1   │                                       │
│  📄 Spiritual Gifts      ├──────────────────────────────────────┤
│  ⏳ Life Assessment W8   │                                       │
│                          │  RECENT ACTIVITY                      │
│  ASSIGNED TOOLS          │  ───────────────                      │
│  ──────────────          │                                       │
│  ✅ Creed Cards (Done)   │  Feb 2 - Completed 3D Journal entry   │
│  ⏳ 3D Journal (3/7)     │  Feb 1 - Started Week 3               │
│  🔒 4D Prayer (Locked)   │  Jan 28 - Completed Creed Cards       │
│                          │  Jan 25 - Life Assessment submitted   │
│                          │                                       │
└──────────────────────────┴──────────────────────────────────────┘
```

#### Disciple Journey View
```
┌─────────────────────────────────────────────────────────────────┐
│ JOHN'S DISCIPLESHIP JOURNEY                        Phase 1 ████░░ │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Phase 0          Phase 1           Phase 2          Phase 3     │
│  Pre-Launch       Foundation        Growth           Multiply    │
│  ✅ Complete      ▶ In Progress     🔒 Locked        🔒 Locked   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ PHASE 1: FOUNDATION (Weeks 1-12)                        │     │
│  │                                                         │     │
│  │ Week 1: Life Assessment                        ✅       │     │
│  │   └─ Life Assessment (Week 1)                  ✅ PDF   │     │
│  │                                                         │     │
│  │ Week 2: 3D Journal                             ✅       │     │
│  │   └─ 3D Journal Introduction                   ✅       │     │
│  │                                                         │     │
│  │ Week 3: 4D Prayer                              ⏳       │     │
│  │   └─ 4D Prayer Rhythm                         In Progress│     │
│  │                                                         │     │
│  │ Week 4: Creed Cards                            🔒       │     │
│  │   └─ Creed Cards Foundation                   Locked   │     │
│  └─────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

#### Discipleship Log (Notes + Prayers)
```
┌─────────────────────────────────────────────────────────────────┐
│ DISCIPLESHIP LOG                                   [+ Add Entry] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Feb 3, 2026 • Note by Pastor Tom                                │
│  ─────────────────────────────────                               │
│  John opened up about his struggle with consistency in           │
│  quiet time. We discussed practical strategies. Follow up        │
│  next week on morning routine.                                   │
│                                                                   │
│  Feb 1, 2026 • 🙏 Prayer Request                    ✅ ANSWERED  │
│  ─────────────────────────────────                               │
│  Praying for John's job interview on Feb 5th.                   │
│  [Answered Feb 6: He got the job!]                               │
│                                                                   │
│  Jan 28, 2026 • Note by Pastor Tom                               │
│  ─────────────────────────────────                               │
│  Great first few weeks. John is engaged and asking good          │
│  questions. Seems hungry to grow.                                │
│                                                                   │
│  Jan 25, 2026 • 🙏 Prayer Request                                │
│  ─────────────────────────────────                               │
│  John's father is in the hospital. Praying for healing.         │
│  [Mark as Answered]                                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Multiplication Tree
```
┌─────────────────────────────────────────────────────────────────┐
│ MULTIPLICATION TREE                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Pastor Tom (You)                                                │
│  └── John Smith (Multiplied Jan 2026)                           │
│      └── Mike Johnson (In Progress)                              │
│      └── Sarah Williams (In Progress)                            │
│  └── Mary Jones (Phase 2)                                        │
│  └── David Brown (Phase 1)                                       │
│                                                                   │
│  Your Impact: 5 disciples, 1 multiplied, 2 grandchildren         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Daily DNA Integration

### Integration Flow

```
1. Leader assigns tool in DNA Hub
   └── DNA Hub creates tool_assignments record
   └── DNA Hub creates tool_unlocks record (shared table)
   └── Optional: Send notification to disciple

2. Disciple opens Daily DNA app
   └── Daily DNA checks tool_unlocks for user
   └── Tool is now available/unlocked
   └── Disciple completes tool

3. Daily DNA sends completion
   └── Daily DNA creates tool_completions record
   └── Daily DNA generates PDF (if applicable)
   └── Daily DNA uploads PDF to Supabase Storage

4. DNA Hub syncs completion
   └── DNA Hub reads tool_completions
   └── DNA Hub updates tool_assignments status
   └── DNA Hub stores PDF URL in disciple profile
   └── DNA Hub marks checkpoint complete (if linked)
```

### Tools & Assignment Rules

| Tool | Assignable | Multiple Times | Ongoing | Results |
|------|------------|----------------|---------|---------|
| Life Assessment | ✅ Yes | ✅ Yes (Week 1, Week 12, etc.) | No | PDF |
| Spiritual Gifts | ✅ Yes | ✅ Yes (rarely) | No | PDF |
| Testimony Builder | ✅ Yes | ✅ Yes | ✅ Yes (ongoing collection) | PDF per testimony |
| 90-Day Toolkit | ✅ Yes | No (once) | No | Completion status |
| 3D Journal | ❌ No | N/A | ✅ Yes | Engagement stats only |
| 4D Prayer | ❌ No | N/A | ✅ Yes | Engagement stats only |
| Creed Cards | ❌ No | N/A | ✅ Yes | Engagement stats only |

### Engagement Analytics (What Leaders See)

Leaders can see **usage statistics** but NOT **private content**:

**Visible to Leaders:**
- Number of journal entries per day/week
- Time spent journaling
- Number of prayer sessions
- Time spent in prayer
- Creed cards reviewed
- Current streak
- Longest streak
- Consistency score

**NOT Visible to Leaders (Private to Disciple):**
- Actual journal content (Head/Heart/Hands text)
- Personal prayer cards
- Specific prayers or requests in 4D Prayer

---

## Privacy Matrix

| Content | DNA Leader | Co-Leader | Church Admin | Disciple |
|---------|------------|-----------|--------------|----------|
| Leader Notes | ✅ Full | ✅ Full | ❌ | ❌ |
| Prayer Requests | ✅ Full | ✅ Full | ❌ | ❌ |
| Life Assessment PDFs | ✅ Full | ✅ Full | ❌ | Own only (in Daily DNA) |
| Spiritual Gifts Results | ✅ Full | ✅ Full | ❌ | Own only |
| Testimony Archive | ✅ Full | ✅ Full | ❌ | Own only |
| 3D Journal Content | ❌ Private | ❌ Private | ❌ | Own only |
| 4D Prayer Cards | ❌ Private | ❌ Private | ❌ | Own only |
| Engagement Analytics | ✅ Stats only | ✅ Stats only | ❌ | Own stats |
| Group Progress | ✅ Full | ✅ Full | ✅ Read-only | ❌ |
| Disciple Journey | ✅ Full | ✅ Full | ✅ Read-only | Own only |

---

## Implementation Phases

### Phase A: Core Discipleship (Priority: High)
**Estimated Time:** 2-3 weeks

1. **Discipleship Log** (discipleship_log table)
   - Add note functionality
   - Add prayer request functionality
   - Mark prayer as answered
   - Timeline view

2. **Disciple Profile Page**
   - Basic info display
   - Quick actions
   - Recent activity feed
   - Assessment PDFs section (placeholder)

3. **Group Phase Advancement**
   - Phase indicator on group page
   - Advance phase modal
   - Phase completion requirements

4. **Co-Leader System**
   - Invite co-leader (from existing DNA leaders)
   - Accept/decline invitation
   - Co-leader permissions (equal access)
   - Remove co-leader (primary only)

### Phase B: Journey Tracking (Priority: High)
**Estimated Time:** 2-3 weeks

1. **Disciple Journey View**
   - Phase progress visualization
   - Checkpoint list per phase
   - Phase advancement for disciples

2. **Phase Checkpoints**
   - Default checkpoint templates (from 90-Day Toolkit)
   - Mark checkpoints complete
   - Link checkpoints to tools

3. **Phase-based Progress Tracking**
   - Overall progress percentage
   - Current week indicator
   - Next steps guidance

### Phase C: Tool Integration (Priority: Medium)
**Estimated Time:** 3-4 weeks

1. **Tool Assignment System (DNA Hub)**
   - Assignment modal
   - Assignment list view
   - Status tracking (pending, sent, started, completed)

2. **Daily DNA Integration**
   - tool_unlocks table sync
   - tool_completions webhook
   - PDF storage in Supabase

3. **Build in Daily DNA:**
   - Life Assessment tool
   - Spiritual Gifts Test
   - PDF generation

### Phase D: Analytics & Multiplication (Priority: Medium)
**Estimated Time:** 2-3 weeks

1. **Engagement Sync**
   - Sync engagement data from Daily DNA
   - Daily/weekly aggregation
   - Streak tracking

2. **Analytics Dashboard**
   - Per-disciple engagement charts
   - Group-level analytics
   - Consistency scores

3. **Multiplication Wizard**
   - Archive original group
   - Create new groups
   - Assign disciples to new groups

4. **Multiplication Tree**
   - Visual family tree
   - Impact metrics

### Phase E: Advanced Features (Priority: Low)
**Estimated Time:** 2-3 weeks

1. **Testimony Builder Integration**
   - Assign testimony prompts
   - Archive of testimonies
   - PDF generation

2. **90-Day Toolkit Integration**
   - Weekly assignments
   - Completion tracking

3. **Advanced Analytics**
   - Group comparison
   - Church-wide DNA metrics
   - Trend analysis

---

## Open Questions

### 1. Daily DNA App Timeline
You mentioned it's about a week away. Should we:
- Wait for Life Assessment to be built in Daily DNA?
- Build it in DNA Hub first and migrate later?
- Build both in parallel?

### 2. Disciple Onboarding
When a leader adds a disciple, should we:
- Send them an email to create a Daily DNA account?
- Auto-create an account and send credentials?
- Wait until a tool is assigned to prompt account creation?

### 3. Phase Advancement
Should phases auto-advance when all checkpoints are complete, or require manual leader approval?

### 4. Engagement Sync Frequency
How often should we sync engagement data from Daily DNA?
- Real-time (on each journal/prayer entry)
- Daily batch (once per day)
- On-demand (when leader views profile)

### 5. Multiplication Flow
When a group multiplies:
- Does the original group get archived immediately?
- Or can it stay active while new groups start?
- Can a leader be in multiple active groups as leader?

### 6. Disciple → Leader Training
When a disciple is promoted to DNA Leader:
- Do they need to complete DNA Training first?
- Or is their 12-month journey sufficient?
- Should there be a "Fast Track" training option?

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| `DNA-GROUPS-PLAN.md` | Original DNA Groups plan (Phase 1) |
| `DNA-TRAINING-IMPLEMENTATION-PLAN.md` | Training platform roadmap |
| `NEXT-STEPS.md` | Overall project status |
| `/docs/resources/DNA Launch Guide.md` | Source for discipleship phases |
| `/docs/resources/90-day-toolkit/` | Week-by-week curriculum |

---

## Changelog

| Date | Change |
|------|--------|
| Feb 3, 2026 | Initial comprehensive plan created |
