# DNA Groups Dashboard - Complete Implementation Plan

**Version:** 1.3
**Last Updated:** 2026-01-26
**Status:** Phase 1 Nearly Complete | Disciple Profile Design In Progress

---

## Implementation Progress

### Completed

#### Database Schema (Migration: `019_dna-groups.sql`)
- [x] `dna_leaders` table - DNA group leaders
- [x] `dna_groups` table - Discipleship groups
- [x] `disciples` table - Group participants
- [x] `group_disciples` table - Join table
- [x] `life_assessments` table - Week 1/8 assessments
- [x] `leader_notes` table - Private notes
- [x] `prayer_requests` table - Prayer tracking
- [x] `leader_health_checkins` table - 6-month leader health assessments
- [x] All indexes created
- [x] RLS enabled (policies pending)
- [x] Updated triggers for `updated_at`

#### TypeScript Types (`/src/lib/types.ts`)
- [x] `DNALeader` interface
- [x] `DNAGroup` interface
- [x] `DNAGroupPhase` type
- [x] `Disciple` interface
- [x] `GroupDisciple` interface
- [x] `LifeAssessment` interface
- [x] `LeaderNote` interface
- [x] `PrayerRequest` interface
- [x] `LeaderHealthCheckin` interface
- [x] `HealthCheckinStatus` type
- [x] `HealthFlagArea` interface
- [x] Extended types for UI (with details, membership, etc.)

#### Authentication (`/src/lib/auth.ts`)
- [x] `createDNALeaderSession()` - Create session cookie
- [x] `getDNALeaderSession()` - Get current session
- [x] `clearDNALeaderSession()` - Log out
- [x] `getDNALeaderByEmail()` - Find leader by email
- [x] `createDNALeaderMagicLinkToken()` - For re-authentication
- [x] `verifyDNALeaderMagicLinkToken()` - Verify magic link

#### DNA Leader Invitation System
- [x] `POST /api/dna-leaders/invite` - Invite DNA leader (church admin or super admin)
- [x] `GET /api/dna-leaders/invite` - List pending invitations
- [x] `GET /api/dna-leaders/verify-token` - Validate signup token
- [x] `POST /api/dna-leaders/activate` - Complete signup, create session
- [x] `/groups/signup` page - DNA leader activation form

#### Email Templates (`/src/lib/email.ts`)
- [x] `sendDNALeaderInvitationEmail()` - Initial invitation
- [x] `sendDNALeaderMagicLinkEmail()` - Re-authentication

#### Authentication Flow
- [x] `POST /api/auth/magic-link` - Updated to support both user types
- [x] `GET /api/auth/verify-dna-leader` - Magic link verification for DNA leaders
- [x] `POST /api/auth/logout-dna-leader` - Log out DNA leader
- [x] `/login` page - Updated to work for both church leaders and DNA leaders

#### DNA Leader Dashboard
- [x] `/groups` page - Dashboard landing (shows groups, stats)
- [x] `GET /api/groups/dashboard` - Dashboard data API

#### Group Management
- [x] `/groups/new` page - Create new group form
- [x] `POST /api/groups` - Create group
- [x] `GET /api/groups` - List groups for current leader
- [x] `/groups/[id]` page - Group detail view with disciples
- [x] `GET /api/groups/[id]` - Get group with disciples
- [x] `PATCH /api/groups/[id]` - Update group details

#### Disciple Management
- [x] `POST /api/groups/[id]/disciples` - Add disciple to group
- [x] `GET /api/groups/[id]/disciples` - List disciples in group
- [x] Add disciple modal in group detail page

#### Church Integration (DNA Groups Tab)
- [x] Church Dashboard DNA Groups tab (`/dashboard` → DNA Groups)
- [x] Admin Church View DNA Groups tab (`/admin/church/[id]` → DNA Groups)
- [x] `GET /api/churches/[churchId]/dna-groups` - Fetch DNA leaders and groups for a church
- [x] `GroupsTab` component (shared between church and admin views)
- [x] Invite DNA leader modal (from DNA Groups tab)
- [x] Stats display (active leaders, groups, disciples, pending invites)
- [x] DNA leaders list with health status indicators
- [x] Groups display with phase badges and disciple counts

#### Admin DNA Leaders Section
- [x] DNA Leaders tab in main admin page (`/admin` → DNA Leaders tab)
- [x] `GET /api/admin/dna-leaders` - List all DNA leaders with stats
- [x] `DNALeadersTab` component with filtering and invite modal
- [x] Invite independent DNA leaders (not tied to any church)
- [x] Filter by type (independent/church-affiliated) and status (active/pending)
- [x] Stats display (active leaders, pending invites, total groups, total disciples)

### In Progress

#### Phase 1: Foundation
- [ ] RLS policies for all tables

### Not Started

#### Phase 2: Group Management
- [ ] Leader notes CRUD
- [ ] Prayer requests CRUD
- [ ] **Disciple profile page (DESIGN IN PROGRESS)**
- [ ] Edit group modal
- [ ] Phase change confirmation

**IMPORTANT DESIGN DECISIONS (Jan 26, 2026):**

The disciple profile page is undergoing significant redesign to align with the DNA Launch Guide framework:

**Terminology Changes:**
- Disciple phases → **Disciple Milestones** (to differentiate from Church Phases and DNA Launch Guide Phases)
- Checkpoints → Specific trackable items within milestones
- Status values: `active`, `multiplied`, `dropped_out`

**5 Disciple Milestones (Draft):**
1. **Milestone 1: Foundation** - 8-week DNA group journey + initial growth (Week 1-8)
2. **Milestone 2: Application** - Spiritual disciplines becoming habits (Month 3 target)
3. **Milestone 3: Growth** - Spiritual maturity and leadership capacity (Month 6 target)
4. **Milestone 4: Multiplication Prep** - Preparing to co-lead (Month 9-12 target)
5. **Milestone 5: Leading** - Co-leading a DNA group (becomes DNA Leader when complete)

**Key Design Principles:**
- NO fixed week counts (6-12 month journey, flexible pacing)
- Gateway criteria for advancing between milestones (leader approval + checkpoints)
- Integrated "Discipleship Journey" accordion (all-in-one view)
- Combined Leader Notes + Prayer Requests (single chronological log with date stamps)
- Assessment comparison as downloadable PDF (side-by-side Week 1 vs Week 8)
- Custom checkpoints (leaders can add ad-hoc events)
- Mission trip required at some milestone (TBD which one)

**Still To Be Decided:**
- [ ] Finalize Milestone 2-4 checkpoint lists (using DNA Launch Guide checklists as base)
- [ ] Define Week 1-8 tool/topic names for Milestone 1 checkpoints
- [ ] Determine where Mission Trip checkpoint belongs (M2, M3, or M4?)
- [ ] Gateway mechanics: auto-unlock vs manual leader approval?
- [ ] Alumni tracking: how to display "Multiplied" disciples who became DNA Leaders?
- [ ] Complete Life Assessment structure (42 questions) before building comparison feature
- [ ] Custom checkpoint UX: free-form text vs templates vs both?

#### Phase 3: Life Assessment Tool
- [ ] Assessment form (42 questions)
- [ ] Auto-save functionality
- [ ] PDF generation
- [ ] Results display
- [ ] Week 1 vs Week 8 comparison
- [ ] Send assessment to disciples

#### Phase 4: Additional Church Features
- [ ] Read-only group detail view for church admins
- [ ] Advanced stats and filtering

#### Phase 5: Polish & Launch
- [ ] Leader health check-in system
- [ ] Mobile responsive testing
- [ ] Error handling
- [ ] Documentation

---

## Disciple Milestones Design (In Progress)

**Last Updated:** 2026-01-26

### Overview

Disciples progress through 5 developmental milestones (NOT fixed week counts) with specific accomplishments, character development, and gateway criteria for advancement. Timeline is flexible (6-12+ months total) based on individual growth.

### Terminology Clarification

| Church Implementation | DNA Group Launch (Leaders) | Discipleship (Individuals) |
|----------------------|----------------------------|---------------------------|
| **Phases** (5) | **Phases** (from Launch Guide) | **Milestones** (5) |
| Church Partnership, Leader Prep, etc. | Pre-Launch, Foundation, Growth, Multiplication, Sustain | Foundation, Application, Growth, Multiplication Prep, Leading |

**Within Discipleship Milestones:**
- **Checkpoints** = Specific trackable items (e.g., "Week 1 Assessment", "Mission Trip", "Led Devotional")
- **Notes** = Leader observations attached to checkpoints (combined with prayer requests)

### Milestone 1: Foundation

**Purpose:** Complete initial DNA group journey and establish spiritual basics

**Checkpoints:**
- ☐ Week 1: Introduction & Week 1 Assessment
- ☐ Week 2: [Tool Name - TBD]
- ☐ Week 3: [Tool Name - TBD]
- ☐ Week 4: [Tool Name - TBD]
- ☐ Week 5: [Tool Name - TBD]
- ☐ Week 6: [Tool Name - TBD]
- ☐ Week 7: [Tool Name - TBD]
- ☐ Week 8: Conclusion & Week 8 Assessment
- ☐ Attendance: 80%+ (6/8 sessions minimum)
- [+ Add Custom Checkpoint] - Leaders can add ad-hoc events

**Accomplishments:**
- Complete Week 1 Life Assessment (baseline)
- Participate actively in DNA group sessions
- Complete Week 8 Life Assessment (growth measurement)
- Demonstrate basic understanding of core biblical principles

**Character/Skills Development:**
- Consistent attendance and engagement
- Openness to learning
- Willingness to share and be vulnerable
- Basic prayer habits

**Gateway to Milestone 2:**
- All 8 weeks completed
- Both assessments completed (Week 1 + Week 8)
- Leader observes consistent participation
- Leader approves readiness

**Assessment Comparison:**
- When Week 8 is complete, system auto-generates comparison PDF
- PDF shows side-by-side questions/answers (Week 1 | Week 8)
- Scored sections show numeric growth
- Written sections show full text responses
- Leader can download, share with disciple, or add to notes

---

### Milestone 2: Application (Month 3 Target)

**Purpose:** Move from learning to living out faith daily

**Checkpoints (from DNA Launch Guide "Foundation Checklist"):**
- ☐ Consistent attendance (80%+)
- ☐ Active in group communication
- ☐ Demonstrates vulnerability and trust
- ☐ Teachable and receives correction well
- ☐ Practicing spiritual disciplines independently
- ☐ Addressed at least one major stronghold/lie
- ☐ Led or served in some capacity
- [+ Add Custom Checkpoint]

**Accomplishments (DRAFT - needs refinement):**
- Demonstrate regular personal Bible study/prayer
- Share testimony with the group
- Serve in some capacity (church, community, group)
- Begin inviting others to explore faith

**Character/Skills Development:**
- Self-discipline in spiritual practices
- Growing biblical literacy
- Servant-heartedness
- Evangelistic awareness

**Gateway to Milestone 3:**
- Majority of checkpoints observed
- Leader approves readiness

**OPEN QUESTIONS:**
- Should we use DNA Launch Guide checklist verbatim or create new checkpoints?
- What specific accomplishments should unlock this milestone?

---

### Milestone 3: Growth (Month 6 Target)

**Purpose:** Develop spiritual maturity and leadership capacity

**Checkpoints (from DNA Launch Guide "Growth Checklist"):**
- ☐ Leading devotionals confidently
- ☐ Initiating spiritual conversations
- ☐ Hearing from God and sharing insights
- ☐ Showing emotional/spiritual maturity
- ☐ Handling correction well
- ☐ Demonstrating fruit of the Spirit
- ☐ Expressing desire to disciple others
- ☐ Consistent in spiritual disciplines
- ☐ **Mission Trip participation** *(required - TBD if this is the right milestone)*
- [+ Add Custom Checkpoint]

**Accomplishments (DRAFT - needs refinement):**
- Demonstrate regular personal Bible study/prayer
- Share faith story with non-believer
- Co-facilitate group discussion (1-2 times)
- Complete "Disciplemaker Training" module (?)

**Character/Skills Development:**
- Leadership initiative
- Teachability + ability to teach
- Heart for the lost
- Relational investment in others

**Gateway to Milestone 4:**
- All checkpoints demonstrated
- Mission trip completed (if required here)
- Leader approves readiness

**OPEN QUESTIONS:**
- Is Mission Trip better in Milestone 2, 3, or 4?
- What is "Disciplemaker Training" and does it exist?

---

### Milestone 4: Multiplication Prep (Month 9-12 Target)

**Purpose:** Prepare to co-lead a DNA group

**Checkpoints (from DNA Launch Guide "Multiplication Readiness"):**
- ☐ Articulates the gospel clearly
- ☐ Leads self spiritually (consistent devotion)
- ☐ Handles correction with humility
- ☐ Initiates spiritual conversations regularly
- ☐ Demonstrates fruit of the Spirit consistently
- ☐ Has identified 2-3 people to disciple
- ☐ Co-facilitated group discussions (3+ times)
- ☐ Shows faithfulness in small things
- ☐ **6-Month Leader Health Check-in completed**
- [+ Add Custom Checkpoint]

**Accomplishments (DRAFT - needs refinement):**
- Identify 2-3 potential disciples to invest in
- Co-facilitate group sessions regularly
- Share faith story with non-believer
- Complete 6-Month Leader Health Check-in

**Character/Skills Development:**
- Facilitator skills (asking good questions, guiding discussion)
- Pastoral care (listening, praying for others, following up)
- Spiritual authority (teaching with confidence)
- Humility (receiving feedback from lead leader)

**Gateway to Milestone 5:**
- All checkpoints demonstrated
- Health check-in shows spiritual/emotional health
- Has 2-3 committed disciples ready to start a group
- Leader approves readiness

**OPEN QUESTIONS:**
- What exactly is the 6-Month Leader Health Check-in? Same as leader_health_checkins table?
- Is this check-in for the disciple or for the DNA Leader?

---

### Milestone 5: Leading (Active Co-Leader)

**Purpose:** Co-lead full DNA group cycle

**Checkpoints:**
- ☐ Co-leading DNA group (Week 1)
- ☐ Co-leading DNA group (Week 2)
- ☐ Co-leading DNA group (Week 3)
- ☐ Co-leading DNA group (Week 4)
- ☐ Co-leading DNA group (Week 5)
- ☐ Co-leading DNA group (Week 6)
- ☐ Co-leading DNA group (Week 7)
- ☐ Co-leading DNA group (Week 8)
- ☐ Shepherding 2-3 disciples personally
- ☐ Complete second full cycle as lead DNA leader
- [+ Add Custom Checkpoint]

**Accomplishments:**
- Co-facilitate full DNA group cycle (8 weeks)
- Lead prayer/discussion regularly
- Shepherd 2-3 disciples personally
- Successfully complete second cycle as lead DNA leader

**Character/Skills Development:**
- Facilitator skills (asking good questions, guiding discussion)
- Pastoral care (listening, praying for others, following up)
- Spiritual authority (teaching with confidence)
- Multiplication mindset (raising up next generation)

**Gateway to "Multiplied" Status:**
- Successfully co-led full 8-week cycle
- Ready to lead own group independently
- **Status auto-updates to "Multiplied"**
- Disciple now becomes a **DNA Leader** in the system

**OPEN QUESTIONS:**
- Does the disciple profile stay in the original group as "Alumni"?
- Or do they disappear from the disciple list entirely?
- Should there be a separate "Alumni" tab in the group view?

---

### Disciple Status Values

- **Active** - Currently in the discipleship journey
- **Multiplied** - Now leading their own group (auto-set when Milestone 5 complete)
- **Dropped Out** - Left the group

*(Removed: "Completed" - redundant with "Multiplied")*

---

### UI Design Principles

**Single Fluid "Discipleship Journey" Accordion:**
- All milestones displayed in one expandable view (similar to Church DNA Journey)
- Each milestone expands to show checkpoints
- Checkpoints can be checked off by leader
- Each checkpoint has [+ Add Note] button
- Leader Notes + Prayer Requests combined into single chronological log with date stamps
- Answered prayers marked inline: "✅ ANSWERED [date]"
- Assessment sending directly in Milestone 1 checkpoint
- Gateway approval button appears when all checkpoints complete
- Custom checkpoints can be added to any milestone

**NO Separate "Quick Actions" Box:**
- All actions integrated inline with relevant milestones/checkpoints
- Keeps UI streamlined and focused on the journey

**Assessment Comparison:**
- Downloadable PDF (side-by-side Week 1 vs Week 8)
- Shows actual answers, not just scores
- Highlights growth areas
- Can be shared with disciple or added to notes
- Interactive comparison view deferred (focus on PDF first)

---

### Database Schema Additions Needed

**New Tables:**
```sql
-- Disciple milestones (like church phases, but for individuals)
CREATE TABLE disciple_milestones_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE,
  milestone_number INT NOT NULL, -- 1-5
  status TEXT DEFAULT 'locked', -- 'locked', 'current', 'completed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checkpoints within milestones (flexible, not hardcoded)
CREATE TABLE disciple_checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE,
  milestone_number INT NOT NULL,
  checkpoint_type TEXT NOT NULL, -- 'assessment', 'attendance', 'custom', etc.
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  metadata JSONB, -- Store flexible data (assessment_id, note_id, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment tracking (links to life_assessments table)
CREATE TABLE assessment_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disciple_id UUID REFERENCES disciples(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL, -- 'week_1', 'week_8', 'health_checkin'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES dna_leaders(id)
);

-- Update existing tables
ALTER TABLE leader_notes
  ADD COLUMN milestone_number INT,
  ADD COLUMN checkpoint_id UUID REFERENCES disciple_checkpoints(id);

ALTER TABLE prayer_requests
  ADD COLUMN milestone_number INT,
  ADD COLUMN checkpoint_id UUID REFERENCES disciple_checkpoints(id);

ALTER TABLE disciples
  ADD COLUMN status TEXT DEFAULT 'active', -- 'active', 'multiplied', 'dropped_out'
  ADD COLUMN current_milestone INT DEFAULT 1;
```

**NOTE:** Schema changes on hold until design finalized.

---

### Open Questions & Decisions Needed

**Critical Design Questions:**
1. **Week 1-8 Tool Names:** What are the actual curriculum topics for each week in Milestone 1?
2. **Mission Trip Placement:** Which milestone should require Mission Trip? (M2, M3, or M4?)
3. **Gateway Mechanics:** Should milestones auto-unlock when checkpoints complete, or require manual leader approval, or both?
4. **Alumni Tracking:** When someone reaches Milestone 5 (Multiplied), do they:
   - Disappear from original group's disciple list?
   - Stay visible but marked "Multiplied - Now Leading"?
   - Move to a separate "Alumni" tab in the group view?
5. **Custom Checkpoints UX:** Should these be:
   - Free-form text entry?
   - Pre-populated templates to choose from?
   - Both?
6. **Life Assessment Structure:** Need complete 42-question breakdown before building comparison feature

**Co-Leader Health Check-ins:**
- DNA Leaders (co-leading groups) complete 6-month health check-ins
- Visible to: Their co-leader (mutual transparency) + Church leaders (oversight dashboard)
- NOT for disciples, only for DNA Leaders
- Already exists in `leader_health_checkins` table (migration 019)
- Question: Should this integrate into disciple profile when disciple becomes leader?

**Frequency of Check-ins:**
- UI should allow adding checkpoints anytime (flexible)
- No need to suggest specific schedule (monthly, bi-weekly)
- Leaders manage pacing based on disciple readiness

---

### Next Steps (Design Phase Only)

**DO NOT BUILD YET - Design first:**

1. **Finalize Milestone 2-4 Checkpoints** (use DNA Launch Guide as base, refine with user input)
2. **Define Week 1-8 Curriculum Topics** (needed for Milestone 1 checkpoint labels)
3. **Complete Life Assessment Structure** (42 questions, format, scoring) - foundational to everything
4. **Design Assessment Comparison PDF** (what to show, how to calculate growth)
5. **Finalize Gateway Mechanics** (auto vs manual phase transitions)
6. **Design Alumni/Multiplied Tracking** (how to view disciples who became leaders)

**THEN:** Build database schema, API routes, UI components.

---

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [User Flows](#user-flows)
5. [Life Assessment System](#life-assessment-system)
6. [Email System](#email-system)
7. [Implementation Phases](#implementation-phases)
8. [Technical Specifications](#technical-specifications)
9. [Testing Plan](#testing-plan)
10. [Launch Strategy](#launch-strategy)

---

## Executive Summary

### Purpose
Build a DNA Groups management system that enables DNA leaders to manage their discipleship groups through a 5-phase multiplication journey. This is **Roadmap 2** - a separate system from the existing Church Implementation Dashboard (Roadmap 1).

### Two Parallel Roadmaps

**Roadmap 1: Church Implementation Dashboard** (Existing)
- Users: Church Leaders (pastors, staff)
- Purpose: Guide church through 5-phase DNA preparation
- Timeline: ~6 months to launch readiness
- End State: Church completes Phase 5 → Ready to launch DNA groups

**Roadmap 2: DNA Groups Management Dashboard** (New - This Project)
- Users: DNA Leaders (anyone leading discipleship groups)
- Purpose: Manage active discipleship groups through multiplication
- Timeline: Ongoing (months/years per group)
- Start Point: When first groups launch

### Key Insight
These are **sequential for churches** (Roadmap 1 → Roadmap 2) but **standalone for independent leaders** (skip Roadmap 1 entirely).

### Success Metrics
- Leaders complete group creation in under 5 minutes
- Disciples complete Life Assessment in under 20 minutes
- Church admins can see all their groups at a glance
- Week 8 comparison clearly shows growth areas
- Zero complaints about mobile usability

---

## System Architecture

### Three Distinct User Types

```
┌─────────────────────────────────────────────────────────────┐
│   CHURCH LEADERS (Existing - church_leaders table)          │
│   - Pastors, staff, discipleship overseers                  │
│   - Access: Church Dashboard (/dashboard)                   │
│   - Manage: Church's 5-phase implementation journey         │
│   - Can ALSO be DNA leaders (dual role)                     │
│   - Can VIEW DNA groups (read-only)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│   DNA LEADERS (New - dna_leaders table)                     │
│   - Anyone leading discipleship groups                      │
│   - Access: DNA Leader Dashboard (/groups)                  │
│   - Manage: Their specific groups only                      │
│   - Church affiliation: Optional (can be independent)       │
│   - Invited by: Church admin or Travis (super admin)        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│   DISCIPLES (New - disciples table)                         │
│   - Group participants                                      │
│   - Access: NO LOGIN (token-based assessment links only)    │
│   - Receive: Life Assessment invitations                    │
│   - Can "graduate" to DNA leader role later                 │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

**Same Magic Link System, Different Dashboards**

```
User enters email → Receives magic link → Clicks link → Logged in
                                ↓
                    System checks user type
                                ↓
        ┌───────────────────────┴───────────────────────┐
        ↓                                               ↓
  Church Leader                                   DNA Leader
        ↓                                               ↓
   /dashboard                                       /groups
  (Church view)                                (DNA Leader view)

Special Case: User is BOTH (pastor who also leads a DNA group)
→ System prompts: "Which dashboard? Church | DNA Groups"
→ Or shows toggle switch in nav bar
```

### Permission Matrix

| User Type | Church Dashboard | DNA Leader Dashboard | Create Groups | View All Church Groups |
|-----------|-----------------|---------------------|---------------|----------------------|
| Church Leader | ✅ Full Access | ❌ No | ❌ No | ✅ Yes (read-only) |
| DNA Leader | ❌ No | ✅ Full Access | ✅ Yes (own) | ❌ No |
| Church Leader + DNA Leader | ✅ Full Access | ✅ Full Access | ✅ Yes (own) | ✅ Yes (read-only) |
| Travis (Super Admin) | ✅ Full Access | ✅ Full Access | ✅ Yes | ✅ Yes (all churches) |

---

## Database Schema

### New Tables

#### 1. DNA Leaders Table

```sql
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

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dna_leaders_email ON dna_leaders(email);
CREATE INDEX idx_dna_leaders_church_id ON dna_leaders(church_id);
```

#### 2. DNA Groups Table

```sql
CREATE TABLE dna_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name TEXT NOT NULL,

  -- Leadership
  leader_id UUID REFERENCES dna_leaders(id) NOT NULL,
  co_leader_id UUID REFERENCES dna_leaders(id), -- Optional

  -- Church affiliation (nullable - can be independent)
  -- Leader can update this in their dashboard
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

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dna_groups_leader_id ON dna_groups(leader_id);
CREATE INDEX idx_dna_groups_co_leader_id ON dna_groups(co_leader_id);
CREATE INDEX idx_dna_groups_church_id ON dna_groups(church_id);
```

#### 3. Disciples Table

```sql
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
```

#### 4. Group Disciples (Join Table)

```sql
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
```

#### 5. Life Assessments Table

```sql
CREATE TABLE life_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disciple_id UUID REFERENCES disciples(id) NOT NULL,
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE,

  -- Assessment timing
  assessment_week INTEGER CHECK (assessment_week IN (1, 8)),

  -- Token-based access (no login required)
  token TEXT NOT NULL UNIQUE, -- Generated when leader sends assessment

  -- Responses stored as JSONB
  -- Structure: { "q1": "answer", "q2": 3, "q3": ["option1", "option2"], ... }
  responses JSONB NOT NULL DEFAULT '{}',

  -- Status tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  ip_address TEXT, -- For security/tracking
  user_agent TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_life_assessments_token ON life_assessments(token);
CREATE INDEX idx_life_assessments_disciple_id ON life_assessments(disciple_id);
CREATE INDEX idx_life_assessments_group_id ON life_assessments(group_id);
```

#### 6. Leader Notes Table

```sql
CREATE TABLE leader_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE,
  disciple_id UUID REFERENCES disciples(id) NOT NULL,
  leader_id UUID REFERENCES dna_leaders(id) NOT NULL,

  note_text TEXT NOT NULL,

  -- Privacy: Only visible to leaders/co-leaders of the group
  -- NOT visible to church admins

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leader_notes_group_id ON leader_notes(group_id);
CREATE INDEX idx_leader_notes_disciple_id ON leader_notes(disciple_id);
```

#### 7. Prayer Requests Table

```sql
CREATE TABLE prayer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE,
  disciple_id UUID REFERENCES disciples(id) NOT NULL,

  request_text TEXT NOT NULL,
  answered BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMP WITH TIME ZONE,
  answer_note TEXT, -- Optional note about how prayer was answered

  -- Privacy: Only visible to leaders/co-leaders of the group
  -- NOT visible to church admins

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prayer_requests_group_id ON prayer_requests(group_id);
CREATE INDEX idx_prayer_requests_disciple_id ON prayer_requests(disciple_id);
```

### Row Level Security Policies

```sql
-- Enable RLS on all new tables
ALTER TABLE dna_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciples ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_disciples ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies will be defined based on auth patterns:
-- 1. DNA Leaders can read/write their own groups
-- 2. Church Leaders can READ groups where group.church_id = their church (read-only)
-- 3. Co-leaders have same permissions as leaders
-- 4. Notes and prayer requests are PRIVATE (not visible to church admins)
-- 5. Life Assessments use token-based access (no login)
```

---

## User Flows

### Flow 1: Church Invites DNA Leader (Church-Affiliated)

```
1. Church completes Phase 5 in Church Dashboard
2. Church Leader logs into /dashboard
3. Clicks "DNA Groups" tab (new)
4. Sees empty state: "You haven't invited any DNA leaders yet"
5. Clicks "Invite DNA Leader"
6. Modal opens with form:
   - Leader Name
   - Leader Email
   - Personal message (optional)
7. Submits form
8. System:
   - Creates record in dna_leaders table (church_id = their church)
   - Generates magic link invitation
   - Sends email: "You've been invited to lead DNA groups at [Church Name]"
9. DNA Leader receives email, clicks link
10. Lands at /groups/signup?token=[token]
11. Completes signup: Name, Phone (optional)
12. System marks dna_leader.activated_at = NOW()
13. Redirects to /groups (DNA Leader Dashboard)
14. Shows onboarding prompt: "Create your first group"
```

### Flow 2: Travis Invites Independent DNA Leader

```
1. Travis logs into Admin Panel
2. Clicks "DNA Leaders" section
3. Clicks "Invite DNA Leader"
4. Form:
   - Leader Name
   - Leader Email
   - Church Affiliation: [Dropdown] or "Independent"
   - Personal message (optional)
5. Submits form
6. System:
   - Creates record in dna_leaders table (church_id = NULL if independent)
   - Generates magic link invitation
   - Sends email: "You've been invited to lead DNA groups"
7. DNA Leader receives email, clicks link
8. Completes signup
9. Redirects to /groups
10. Shows onboarding prompt: "Create your first group"
```

### Flow 3: DNA Leader Creates Group

```
1. DNA Leader logs into /groups
2. Landing page shows:
   - "My Groups" section (empty if new)
   - "Create New Group" button (prominent)
3. Clicks "Create New Group"
4. Multi-step form:

   STEP 1: Group Details
   - Group name (required)
   - Church affiliation: [Dropdown of all churches] or "Independent"
   - Start date (required)
   - Multiplication target date (optional)

   STEP 2: Co-Leader (Optional)
   - Co-leader email
   - Co-leader name
   - Note: "If they don't have an account, we'll send them an invitation"

   STEP 3: Invite Disciples
   - Disciple 1: Name, Email (required)
   - Disciple 2: Name, Email (required)
   - Disciple 3: Name, Email (optional)
   - Disciple 4: Name, Email (optional)
   - Note: "Disciples don't need accounts. They'll receive welcome emails."

5. Clicks "Create Group"
6. System:
   - Creates group in dna_groups table
   - Creates disciple records in disciples table
   - Links disciples to group in group_disciples table
   - If co-leader email provided:
     - Check if they're already a dna_leader
     - If not, create invitation (same as Flow 1)
   - Sends emails:
     - Co-leader: Invitation to join as co-leader
     - Disciples: Welcome email with group info
7. Redirects to /groups/[group-id]
8. Shows group dashboard
```

### Flow 4: Leader Sends Life Assessment

```
1. DNA Leader at /groups/[group-id]
2. Sees disciple cards with assessment status:
   - "Sarah Jones - Week 1 Assessment: Not sent"
3. Clicks "Send Week 1 Assessment" button on Sarah's card
4. Confirmation modal:
   - "Send Week 1 Life Assessment to Sarah Jones?"
   - "Sarah will receive an email with a link to complete the assessment."
   - Preview of email text
5. Leader confirms
6. System:
   - Generates unique token
   - Creates record in life_assessments table:
     - disciple_id = Sarah's ID
     - group_id = current group
     - assessment_week = 1
     - token = [generated token]
     - started_at = NULL (not started yet)
     - responses = {}
   - Sends email to Sarah:
     - Subject: "Complete Your Week 1 Life Assessment"
     - Link: dna.arkidentity.com/assessment/[token]
     - Includes: Group name, leader name, estimated time (20 mins)
7. Leader's dashboard updates:
   - Sarah's card shows: "Week 1 Assessment: Sent (Pending)"
8. Sarah receives email, clicks link
9. Lands at /assessment/[token]
10. Token validation:
    - If valid → Show assessment form
    - If expired → Show error + option to request new link
    - If already completed → Show "Already completed" message
11. Sarah completes 42 questions
12. System saves responses in real-time (auto-save every 30 seconds)
13. On final submit:
    - Updates life_assessments.completed_at = NOW()
    - Updates life_assessments.responses = {all answers}
    - Sends emails to:
      - Sarah: "Your Week 1 Assessment Results" (PDF attached)
      - Leader: "Sarah Jones completed Week 1 Assessment"
      - Co-leader: "Sarah Jones completed Week 1 Assessment"
14. Leader's dashboard updates:
    - Sarah's card shows: "Week 1 Assessment: Completed ✅"
    - New button appears: "View Results"
15. Leader clicks "View Results"
16. Redirects to /groups/[group-id]/disciples/[sarah-id]
17. Shows Sarah's profile with Week 1 results displayed
```

### Flow 5: Church Leader Views Groups (Read-Only)

```
1. Church Leader logs into /dashboard
2. Top navigation shows tabs:
   - Overview
   - DNA Journey (existing phases 1-5)
   - DNA Groups (NEW)
3. Clicks "DNA Groups" tab
4. Lands at /dashboard/groups
5. Overview section shows:
   - Total active groups: 8
   - Total DNA leaders: 12
   - Total disciples: 32
   - Groups by phase:
     - Pre-launch: 2
     - Invitation: 1
     - Foundation: 3
     - Growth: 2
     - Multiplication: 0
6. Groups table below:
   Columns: Group Name | Leaders | Phase | Started | Status
   - Filter by phase (dropdown)
   - Search by group/leader name
   - Sort by any column
7. Clicks "View Details" on a group
8. Redirects to /dashboard/groups/[group-id]
9. Shows READ-ONLY group view:
   - Group name, leaders, phase, timeline
   - Disciples list (names, phase progress)
   - Life Assessment status:
     - Week 1: Complete / Pending / Not sent
     - Week 8: Complete / Pending / Not sent
   - Phase checklist progress (if applicable)
10. Does NOT show:
    - Leader notes (private)
    - Prayer requests (private)
    - Edit/delete buttons
11. Church Leader can navigate back to groups list
```

### Flow 6: Leader Views Week 1 vs Week 8 Comparison

```
1. DNA Leader at /groups/[group-id]/disciples/[sarah-id]
2. Disciple profile shows:
   - Basic info (name, email, phone)
   - Week 1 Assessment: Completed ✅
   - Week 8 Assessment: Completed ✅
   - "View Comparison" button (only visible when both completed)
3. Leader clicks "View Comparison"
4. Redirects to /groups/[group-id]/disciples/[sarah-id]/comparison
5. Shows side-by-side comparison:

   PART 1: RELATIONSHIP WITH GOD
   ┌──────────────────────────┬────────┬────────┬────────────┐
   │ Question                 │ Week 1 │ Week 8 │ Change     │
   ├──────────────────────────┼────────┼────────┼────────────┤
   │ Q1: Relationship with    │ "Incon-│ "Steady│ +2 levels  │
   │     God                  │ sistent│ and    │ ✅ Growth  │
   │                          │ hot/cold"│deepening"│         │
   ├──────────────────────────┼────────┼────────┼────────────┤
   │ Q2: Devotional           │   2    │   4    │ +2 points  │
   │     consistency          │        │        │ ✅ Growth  │
   ├──────────────────────────┼────────┼────────┼────────────┤
   │ Q3: Sense God's presence │   2    │   3    │ +1 point   │
   │                          │        │        │ ✅ Growth  │
   └──────────────────────────┴────────┴────────┴────────────┘

   [Similar sections for all 7 parts]

   SUMMARY:
   - Areas of significant growth: Relationship with God, Spiritual Freedom
   - Stagnant areas: Identity & Emotions (minimal change)
   - Recommended focus: Continue building on strong areas, address identity work

6. Leader can:
   - Download PDF report
   - Share link with disciple
   - Add notes about areas to focus on
```

---

## Life Assessment System

### Assessment Structure

**Total Questions:** 42 questions across 7 parts

1. **Part 1: Relationship with God** (6 questions)
   - Q1-6: Mix of multiple choice and ratings

2. **Part 2: Spiritual Freedom** (6 questions)
   - Q7-12: Mix of multiple choice, checkboxes, ratings

3. **Part 3: Identity & Emotions** (5 questions)
   - Q13-17: Text responses and ratings

4. **Part 4: Relationships** (5 questions)
   - Q18-22: Multiple choice and text responses

5. **Part 5: Calling & Purpose** (4 questions)
   - Q23-26: Multiple choice and text responses

6. **Part 6: Lifestyle & Stewardship** (4 questions)
   - Q27-30: Ratings (1-5 scale)

7. **Part 7: Spiritual Fruit** (9 questions)
   - Q31-39: Ratings (1-5 scale) for each fruit of the Spirit

8. **Reflection Questions** (3 questions)
   - Q40-42: Open-ended text responses

### Database Storage Format

**life_assessments.responses JSONB structure:**

```json
{
  "q1": "growing_but_still_immature",
  "q2_rating": 3,
  "q2_days_per_week": 4,
  "q3_rating": 3,
  "q3_explain": "Sometimes I feel God's presence clearly, other times not",
  "q4_can_articulate": "yes",
  "q4_gospel_text": "God loved us so much that He sent Jesus to die for our sins. When we believe in Him, we're saved and get eternal life.",
  "q5_belief": "likes_me",
  "q5_why": "Because I know God delights in me, not just tolerates me",
  "q6_rating": 4,
  "q7": "mostly",
  "q8_ongoing_sin": "yes",
  "q8_what": "Pride and control issues",
  "q9_struggles": ["fear_or_anxiety", "pride_or_control"],
  "q10": "mostly_free",
  "q11": "confess_quickly_to_god_and_trusted_people",
  "q12_rating": 4,
  "q13_first_word": "Beloved",
  "q14_rating": 4,
  "q15_insecurity": "I'm not doing enough",
  "q16": "learn_from_it_and_grow",
  "q17_rating": 3,
  "q18": "yes",
  "q19_broken_relationships": "no",
  "q20": "address_it_well_with_grace_and_truth",
  "q21_discipled_someone": "yes",
  "q22_who_knows_real_you": "My small group and my spouse",
  "q23_sense_of_calling": "yes_clear",
  "q23_what": "To make disciples who make disciples",
  "q24_breaks_heart": "People living without knowing Jesus",
  "q25_kingdom_work": "Lead a movement of discipleship across my city",
  "q26_rating": 4,
  "q27_rating": 3,
  "q28_rating": 3,
  "q29_rating": 2,
  "q30_rating": 3,
  "q31_love": 4,
  "q32_joy": 3,
  "q33_peace": 4,
  "q34_patience": 3,
  "q35_kindness": 4,
  "q36_goodness": 4,
  "q37_faithfulness": 4,
  "q38_gentleness": 3,
  "q39_self_control": 2,
  "q40_biggest_growth_area": "Self-control and managing my time better",
  "q41_afraid_of": "Failing and disappointing people",
  "q42_why_dna": "I want to learn how to truly disciple others, not just teach them"
}
```

### Assessment Form UI

**Page Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│  DNA LIFE ASSESSMENT                                        │
│  Week 1 Assessment for Sarah Jones                          │
├─────────────────────────────────────────────────────────────┤
│  Progress: ████████░░░░░░░░ 42% (18 of 42 questions)       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PART 3: IDENTITY & EMOTIONS                                │
│                                                             │
│  13. When you think about yourself, what's the first word   │
│      that comes to mind?                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Text input]                                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  14. Do you see yourself the way God sees you?              │
│  ○ 1  ○ 2  ● 3  ○ 4  ○ 5                                   │
│                                                             │
│  15. What's your biggest insecurity?                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Text input]                                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Previous]  [Save Progress]  [Next] ──────────────────────│
└─────────────────────────────────────────────────────────────┘

Auto-save: Last saved 30 seconds ago ✓
```

**Key Features:**
- One part per page (not one question per page - too many clicks)
- Progress bar shows % completion
- Auto-save every 30 seconds
- "Save Progress" button visible
- Can exit and return later (token remains valid)
- Mobile-responsive (most disciples will use phones)

### Results PDF Generation

**Option 1: Server-Side PDF Generation** (Recommended)

Use a library like `puppeteer` or `@react-pdf/renderer` to generate PDFs server-side.

**Pros:**
- Consistent formatting
- Can include charts/graphs
- Easier to brand
- Can attach to emails reliably

**Cons:**
- More complex implementation
- Server load for PDF generation

**Option 2: Client-Side PDF Generation**

Use `jspdf` to generate PDFs in the browser.

**Pros:**
- Simpler implementation
- No server load
- Faster for user

**Cons:**
- Less control over formatting
- Harder to include complex layouts

**Recommendation:** Use Option 1 (Server-Side) with `@react-pdf/renderer` for better control and consistency.

**PDF Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│  DNA LIFE ASSESSMENT RESULTS                                │
│  Week 1 | Sarah Jones | Group: Monday Night Disciples       │
│  Completed: January 24, 2026                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PART 1: RELATIONSHIP WITH GOD                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Q1: Current relationship with God                   │   │
│  │ Your answer: Inconsistent—hot and cold             │   │
│  │                                                     │   │
│  │ Q2: Devotional consistency: 3/5                     │   │
│  │     Days per week: 4 days/week                      │   │
│  │                                                     │   │
│  │ Q3: Sense God's presence: 3/5                       │   │
│  │     Explain: "Sometimes I feel God's presence..."   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Continue for all 7 parts]                                 │
│                                                             │
│  SUMMARY SCORES:                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Relationship with God:        3.2 / 5.0             │   │
│  │ Spiritual Freedom:            2.8 / 5.0             │   │
│  │ Identity & Emotions:          3.5 / 5.0             │   │
│  │ Relationships:                4.0 / 5.0             │   │
│  │ Calling & Purpose:            3.5 / 5.0             │   │
│  │ Lifestyle & Stewardship:      2.8 / 5.0             │   │
│  │ Spiritual Fruit:              3.4 / 5.0             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Generated by DNA Hub | dna.arkidentity.com                 │
└─────────────────────────────────────────────────────────────┘
```

### Week 1 vs Week 8 Comparison Logic

**Calculation:**

1. Extract all numeric ratings (1-5 scale) from Week 1 and Week 8
2. Calculate category averages:
   - Part 1: Average of Q2, Q3, Q6
   - Part 2: Average of Q7 (convert yes=5, mostly=4, struggling=2, no=1), Q12
   - Part 3: Average of Q14, Q17
   - Part 4: Average of Q18 (convert yes=5, 1-2=3, no=1)
   - Part 5: Average of Q26
   - Part 6: Average of Q27, Q28, Q29, Q30
   - Part 7: Average of Q31-Q39
3. Compare Week 1 vs Week 8 averages
4. Calculate change:
   - Growth: +1.0 or more
   - Slight growth: +0.3 to +0.9
   - No change: -0.2 to +0.2
   - Decline: -0.3 or less
5. Highlight areas for leader to focus on

**UI Display:**

```
┌─────────────────────────────────────────────────────────────┐
│  WEEK 1 VS WEEK 8 COMPARISON                                │
│  Sarah Jones | Monday Night Disciples                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OVERALL GROWTH: +0.8 points (23% improvement) ✅            │
│                                                             │
│  CATEGORY BREAKDOWN:                                        │
│  ┌──────────────────────────┬────────┬────────┬──────────┐ │
│  │ Category                 │ Week 1 │ Week 8 │ Change   │ │
│  ├──────────────────────────┼────────┼────────┼──────────┤ │
│  │ Relationship with God    │  3.2   │  4.5   │ +1.3 ✅  │ │
│  │ Spiritual Freedom        │  2.8   │  4.0   │ +1.2 ✅  │ │
│  │ Identity & Emotions      │  3.5   │  3.7   │ +0.2 ⚠️  │ │
│  │ Relationships            │  4.0   │  4.5   │ +0.5 ✅  │ │
│  │ Calling & Purpose        │  3.5   │  4.0   │ +0.5 ✅  │ │
│  │ Lifestyle & Stewardship  │  2.8   │  3.2   │ +0.4 ⚠️  │ │
│  │ Spiritual Fruit          │  3.4   │  4.1   │ +0.7 ✅  │ │
│  └──────────────────────────┴────────┴────────┴──────────┘ │
│                                                             │
│  STRENGTHS:                                                 │
│  ✅ Significant growth in relationship with God             │
│  ✅ Major breakthrough in spiritual freedom                 │
│  ✅ Steady improvement in spiritual fruit                   │
│                                                             │
│  AREAS TO FOCUS:                                            │
│  ⚠️ Identity & Emotions - minimal change                    │
│  ⚠️ Lifestyle & Stewardship - slight improvement            │
│                                                             │
│  LEADER NOTES:                                              │
│  [Text area for leader to add observations]                │
│                                                             │
│  [Download PDF]  [Share with Disciple]                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Email System

### Email Service: Resend (Existing)

Continue using Resend for all email notifications.

### Email Templates

#### 1. DNA Leader Invitation (Church-Affiliated)

**Subject:** You've been invited to lead DNA groups at [Church Name]

**Body:**
```
Hi [Leader Name],

[Church Leader Name] from [Church Name] has invited you to become a DNA leader!

As a DNA leader, you'll guide small groups through an 8-week discipleship journey that transforms lives and multiplies disciples.

Click below to accept your invitation and get started:
[Accept Invitation Button] → dna.arkidentity.com/groups/signup?token=[token]

This invitation expires in 7 days.

Questions? Reply to this email or visit dna.arkidentity.com/help

Making disciples who make disciples,
ARK Identity Team
```

#### 2. DNA Leader Invitation (Independent)

**Subject:** You've been invited to lead DNA groups

**Body:**
```
Hi [Leader Name],

You've been invited to become a DNA leader with ARK Identity!

As a DNA leader, you'll guide small groups through an 8-week discipleship journey that transforms lives and multiplies disciples.

Click below to accept your invitation and get started:
[Accept Invitation Button] → dna.arkidentity.com/groups/signup?token=[token]

This invitation expires in 7 days.

Questions? Reply to this email or visit dna.arkidentity.com/help

Making disciples who make disciples,
ARK Identity Team
```

#### 3. Co-Leader Invitation

**Subject:** You've been invited to co-lead [Group Name]

**Body:**
```
Hi [Co-Leader Name],

[Leader Name] has invited you to co-lead their DNA group: [Group Name]!

As a co-leader, you'll partner with [Leader Name] to guide disciples through an 8-week transformational journey.

Click below to accept and join the team:
[Accept Invitation Button] → dna.arkidentity.com/groups/accept-co-leader?token=[token]

Group starts: [Start Date]
Church: [Church Name or "Independent"]

This invitation expires in 7 days.

Questions? Reply to this email or contact [Leader Name] directly.

Making disciples who make disciples,
ARK Identity Team
```

#### 4. Disciple Welcome Email

**Subject:** Welcome to [Group Name]!

**Body:**
```
Hi [Disciple Name],

Welcome to [Group Name]! You've been invited by [Leader Name] to join an 8-week DNA discipleship journey.

GROUP DETAILS:
- Leader: [Leader Name] ([Leader Email])
- Co-Leader: [Co-Leader Name] (if applicable)
- Start Date: [Start Date]
- Church: [Church Name or "Independent"]

WHAT TO EXPECT:
Over the next 8 weeks, you'll:
- Dive deep into God's Word
- Build authentic community
- Grow in your faith
- Learn to make disciples who make disciples

WEEK 1 LIFE ASSESSMENT:
Your leader will send you a Life Assessment link soon. This helps track your spiritual growth throughout the journey.

Questions? Contact your leader directly at [Leader Email]

Excited for what God will do in your life,
ARK Identity Team
```

#### 5. Life Assessment Invitation (Week 1)

**Subject:** Complete Your Week 1 Life Assessment

**Body:**
```
Hi [Disciple Name],

It's time to complete your Week 1 Life Assessment!

This 20-minute assessment provides a baseline snapshot of your spiritual, emotional, and relational health. Answer honestly—this isn't about being "spiritual enough" but about identifying where you are so you can grow.

You'll retake this at Week 8 to measure your growth.

[Complete Assessment Button] → dna.arkidentity.com/assessment/[token]

GROUP: [Group Name]
LEADER: [Leader Name]
ESTIMATED TIME: 20 minutes

You can save your progress and return later if needed.

Questions? Contact your leader at [Leader Email]

Excited to see your growth,
ARK Identity Team
```

#### 6. Life Assessment Reminder

**Subject:** Reminder: Complete Your Life Assessment

**Body:**
```
Hi [Disciple Name],

Just a friendly reminder to complete your Life Assessment for [Group Name].

Your leader [Leader Name] is looking forward to seeing your responses so they can better support your growth.

[Complete Assessment Button] → dna.arkidentity.com/assessment/[token]

ESTIMATED TIME: 20 minutes
You can save your progress and return later if needed.

Questions? Contact your leader at [Leader Email]

Thanks!
ARK Identity Team
```

#### 7. Life Assessment Completed (to Disciple)

**Subject:** Your Life Assessment Results

**Body:**
```
Hi [Disciple Name],

Great work completing your Week [1/8] Life Assessment!

Attached is a PDF of your results. We encourage you to:
- Review your answers with your leader
- Identify 1-2 areas you want to grow in
- Pray about what God is revealing

Your leader will discuss these results with you in your next group meeting.

[Attached: life_assessment_week1_sarah_jones.pdf]

Keep growing,
ARK Identity Team
```

#### 8. Life Assessment Completed (to Leader)

**Subject:** [Disciple Name] completed their Life Assessment

**Body:**
```
Hi [Leader Name],

Good news! [Disciple Name] just completed their Week [1/8] Life Assessment.

You can now view their results in your dashboard:
[View Results Button] → dna.arkidentity.com/groups/[group-id]/disciples/[disciple-id]

NEXT STEPS:
- Review their responses before your next meeting
- Note any areas where they need support
- Prepare discussion questions
- Pray for their growth areas

[Attached: life_assessment_week1_sarah_jones.pdf]

Making disciples who make disciples,
ARK Identity Team
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Goal:** DNA Leaders can be invited and create groups

#### Tasks:

**Database Setup**
- [ ] Create all 7 new tables (dna_leaders, dna_groups, disciples, group_disciples, life_assessments, leader_notes, prayer_requests)
- [ ] Set up indexes
- [ ] Configure Row Level Security policies
- [ ] Test all foreign key relationships
- [ ] Create database migration file: `supabase-migration-dna-groups.sql`

**Authentication & User Type Detection**
- [ ] Update login flow to detect user type (church_leader vs dna_leader)
- [ ] Create routing logic:
  - Church leader → /dashboard
  - DNA leader → /groups
  - Both → /select-dashboard (with toggle)
- [ ] Test magic link auth for new dna_leaders

**DNA Leader Invitation System**
- [ ] Church Dashboard: Add "DNA Groups" tab
- [ ] Build invitation modal in Church Dashboard
- [ ] API endpoint: `POST /api/dna-leaders/invite`
  - Creates dna_leader record
  - Generates magic link token
  - Sends invitation email
- [ ] Admin Panel: Add DNA leader invitation for independent leaders
- [ ] Build signup page: `/groups/signup?token=[token]`
- [ ] Email template: DNA leader invitation (church-affiliated)
- [ ] Email template: DNA leader invitation (independent)

**DNA Leader Dashboard - Landing Page**
- [ ] Create `/groups` page (DNA Leader Dashboard landing)
- [ ] Empty state: "You don't have any groups yet"
- [ ] "Create New Group" button (prominent)
- [ ] Layout: Navigation, header, main content area

**Group Creation Flow**
- [ ] Create `/groups/new` page
- [ ] Multi-step form:
  - Step 1: Group details (name, church dropdown, dates)
  - Step 2: Co-leader (optional)
  - Step 3: Invite disciples (2-4 disciples)
- [ ] Church dropdown: Fetch all churches from `churches` table
- [ ] API endpoint: `POST /api/groups/create`
  - Creates group record
  - Creates disciple records
  - Creates group_disciples links
  - Sends invitation emails (co-leader, disciples)
- [ ] Email templates:
  - Co-leader invitation
  - Disciple welcome email
- [ ] Redirect to `/groups/[group-id]` after creation

**Testing**
- [ ] Test invitation flow (church-affiliated)
- [ ] Test invitation flow (independent)
- [ ] Test group creation with all fields
- [ ] Test email delivery (all templates)
- [ ] Test church dropdown (100+ churches)

---

### Phase 2: Group Management (Weeks 2-3)

**Goal:** Leaders can manage their groups day-to-day

#### Tasks:

**Group Dashboard**
- [ ] Create `/groups/[group-id]` page
- [ ] Header section:
  - Group name, current phase, start date
  - Edit group button
  - Phase dropdown (change phase)
- [ ] Quick stats cards:
  - Time active (days since start_date)
  - Current phase
  - Multiplication countdown (days until multiplication_target_date)
- [ ] Disciples section:
  - Card-based layout (not table on mobile)
  - Each card shows: Name, status, assessment status
  - "View Profile" button per disciple
- [ ] Recent notes section (last 5 notes)
- [ ] Actions section:
  - "Send Life Assessment" button
  - "Add Note" quick form
  - "Change Phase" dropdown
- [ ] API endpoints:
  - `GET /api/groups/[id]` - Fetch group data
  - `PUT /api/groups/[id]` - Update group details
  - `PUT /api/groups/[id]/phase` - Change phase

**Disciple Profile Page**
- [ ] Create `/groups/[group-id]/disciples/[disciple-id]` page
- [ ] Header section:
  - Disciple name, email, phone
  - Joined date, current status
  - Edit button
- [ ] Life Assessment section:
  - Week 1 status + results (if completed)
  - Week 8 status + results (if completed)
  - "Send Assessment" buttons
  - "View Comparison" button (if both completed)
- [ ] Leader Notes section:
  - List all notes (most recent first)
  - "Add Note" form inline
  - Each note shows: Date, author (leader/co-leader), text
- [ ] Prayer Requests section:
  - List active requests
  - "Add Request" form inline
  - Checkbox to mark as answered
  - Show answered date when marked
- [ ] API endpoints:
  - `GET /api/disciples/[id]` - Fetch disciple data
  - `PUT /api/disciples/[id]` - Update disciple info
  - `POST /api/disciples/[id]/notes` - Add note
  - `POST /api/disciples/[id]/prayers` - Add prayer request
  - `PUT /api/prayers/[id]/answer` - Mark prayer as answered

**Notes & Prayer Requests**
- [ ] Note form component (reusable)
- [ ] Prayer request form component (reusable)
- [ ] Notes list component (with pagination if > 20)
- [ ] Prayer requests list component
- [ ] Real-time updates (optional - use Supabase subscriptions)

**Edit Group Modal**
- [ ] Modal component for editing group details
- [ ] Form fields: Group name, church affiliation, dates
- [ ] Can add/remove disciples
- [ ] Can change co-leader
- [ ] API endpoint: `PUT /api/groups/[id]`

**Phase Change Confirmation**
- [ ] Confirmation modal when changing phases
- [ ] Shows: Current phase → New phase
- [ ] Warns if skipping phases
- [ ] Updates `dna_groups.current_phase`

**Testing**
- [ ] Test group dashboard loads correctly
- [ ] Test disciple profile displays all data
- [ ] Test adding notes (multiple notes per disciple)
- [ ] Test adding prayer requests
- [ ] Test marking prayers as answered
- [ ] Test editing group details
- [ ] Test changing phases
- [ ] Test permissions (co-leaders have same access)

---

### Phase 3: Life Assessment Tool (Weeks 3-4)

**Goal:** Leaders can send assessments, disciples can complete them, results are viewable

#### Tasks:

**Assessment Database Structure**
- [ ] Define JSONB schema for all 42 questions
- [ ] Document question IDs and data types
- [ ] Create helper functions for scoring/averaging

**Assessment Form - Backend**
- [ ] API endpoint: `POST /api/assessments/send`
  - Creates life_assessments record
  - Generates unique token
  - Sends email to disciple
- [ ] API endpoint: `GET /api/assessments/[token]`
  - Validates token
  - Returns assessment data if not completed
  - Returns "already completed" if finished
- [ ] API endpoint: `PUT /api/assessments/[token]/save`
  - Auto-save progress (called every 30 seconds)
  - Updates `responses` JSONB
- [ ] API endpoint: `POST /api/assessments/[token]/submit`
  - Marks assessment as completed
  - Updates `completed_at`
  - Generates PDF
  - Sends emails (disciple, leader, co-leader)

**Assessment Form - Frontend**
- [ ] Create `/assessment/[token]` page
- [ ] Token validation on page load
- [ ] Progress bar component (shows % completion)
- [ ] Part 1: Relationship with God (6 questions)
  - Q1: Multiple choice (5 options)
  - Q2: Rating + number input (days per week)
  - Q3: Rating + text input (explain)
  - Q4: Yes/Somewhat/No + conditional text input
  - Q5: Multiple choice + text input (why)
  - Q6: Rating
- [ ] Part 2: Spiritual Freedom (6 questions)
  - Q7: Multiple choice (4 options)
  - Q8: Yes/No + conditional text input
  - Q9: Checkboxes (multiple select)
  - Q10: Multiple choice (4 options)
  - Q11: Multiple choice (5 options)
  - Q12: Rating
- [ ] Part 3: Identity & Emotions (5 questions)
  - Q13: Text input
  - Q14: Rating
  - Q15: Text input
  - Q16: Multiple choice (5 options)
  - Q17: Rating
- [ ] Part 4: Relationships (5 questions)
  - Q18: Multiple choice (3 options)
  - Q19: Yes/No + conditional text input
  - Q20: Multiple choice (5 options)
  - Q21: Yes/No
  - Q22: Text input (multiline)
- [ ] Part 5: Calling & Purpose (4 questions)
  - Q23: Multiple choice + conditional text input
  - Q24: Text input (multiline)
  - Q25: Text input (multiline)
  - Q26: Rating
- [ ] Part 6: Lifestyle & Stewardship (4 questions)
  - Q27: Rating
  - Q28: Rating
  - Q29: Rating
  - Q30: Rating
- [ ] Part 7: Spiritual Fruit (9 questions)
  - Q31-Q39: All ratings (1-5 scale)
- [ ] Reflection Questions (3 questions)
  - Q40-Q42: All text inputs (multiline)
- [ ] Navigation: Previous/Next buttons
- [ ] Auto-save indicator: "Last saved 30 seconds ago ✓"
- [ ] "Save Progress" button (manual save)
- [ ] Final submit button (appears on last page)
- [ ] Mobile-responsive layout
- [ ] Form validation (require all questions)

**Assessment PDF Generation**
- [ ] Install `@react-pdf/renderer` or `puppeteer`
- [ ] Create PDF template:
  - Header: Week 1/8, Name, Group, Date
  - Section per part (all 7 parts)
  - Summary scores table
  - Footer: DNA Hub branding
- [ ] Function: `generateAssessmentPDF(assessmentId)`
- [ ] Store PDFs in Supabase Storage or send directly via email
- [ ] API endpoint: `GET /api/assessments/[id]/pdf` (for re-download)

**Assessment Results Display**
- [ ] Component: AssessmentResults
  - Displays all 42 questions + answers
  - Groups by part
  - Shows ratings as visual indicators (1-5 stars)
  - Shows text responses in readable format
- [ ] Add to disciple profile page
- [ ] "Download PDF" button
- [ ] API endpoint: `GET /api/assessments/[id]` (fetch completed assessment)

**Week 1 vs Week 8 Comparison**
- [ ] Create `/groups/[group-id]/disciples/[disciple-id]/comparison` page
- [ ] Calculate category averages (Week 1 and Week 8)
- [ ] Calculate changes (+/- points)
- [ ] Visual comparison table:
  - Columns: Category, Week 1, Week 8, Change
  - Color coding: Green (growth), Yellow (stagnant), Red (decline)
- [ ] Summary section:
  - Strengths (biggest growth areas)
  - Areas to focus (minimal change)
- [ ] Leader notes section (add observations)
- [ ] "Download Comparison PDF" button
- [ ] API endpoint: `GET /api/assessments/comparison/[disciple-id]`

**Email Templates**
- [ ] Life Assessment invitation (Week 1)
- [ ] Life Assessment reminder (if not completed after 3 days)
- [ ] Life Assessment completed (to disciple) - includes PDF
- [ ] Life Assessment completed (to leader) - includes PDF
- [ ] Life Assessment completed (to co-leader) - includes PDF

**Testing**
- [ ] Test sending assessment (creates record, sends email)
- [ ] Test assessment form (all 42 questions render correctly)
- [ ] Test auto-save (every 30 seconds)
- [ ] Test manual save
- [ ] Test form validation (all questions required)
- [ ] Test submit (marks completed, sends emails)
- [ ] Test PDF generation (Week 1)
- [ ] Test PDF generation (Week 8)
- [ ] Test results display in disciple profile
- [ ] Test Week 1 vs Week 8 comparison
- [ ] Test comparison scoring logic
- [ ] Test on mobile (most disciples will use phones)

---

### Phase 4: Church Integration (Weeks 4-5)

**Goal:** Church leaders can view all their DNA groups (read-only)

#### Tasks:

**Church Dashboard - DNA Groups Tab**
- [ ] Add "DNA Groups" tab to `/dashboard`
- [ ] Create `/dashboard/groups` page
- [ ] Overview stats section:
  - Total active groups
  - Total DNA leaders
  - Total disciples
  - Groups by phase (breakdown)
- [ ] Groups table:
  - Columns: Group Name, Leaders, Phase, Started, Status
  - Filter by phase (dropdown)
  - Search by group/leader name (text input)
  - Sort by any column
  - "View Details" button per group
- [ ] API endpoint: `GET /api/dashboard/groups`
  - Filters by church_id
  - Returns all groups affiliated with church
  - Includes stats

**Church View of Group Details**
- [ ] Create `/dashboard/groups/[group-id]` page
- [ ] READ-ONLY layout (no edit buttons)
- [ ] Shows:
  - Group name, leaders, phase, timeline
  - Disciples list (names, status, joined date)
  - Life Assessment status (Week 1, Week 8)
  - Phase progress (if applicable)
- [ ] Does NOT show:
  - Leader notes (private)
  - Prayer requests (private)
- [ ] API endpoint: `GET /api/dashboard/groups/[id]`
  - Validates church admin has permission
  - Returns group data (without notes/prayers)

**Permissions & RLS Policies**
- [ ] Define RLS policy: Church admins can READ groups where `dna_groups.church_id = their church`
- [ ] Define RLS policy: Church admins CANNOT UPDATE or DELETE groups
- [ ] Define RLS policy: Notes and prayers are PRIVATE (not visible to church admins)
- [ ] Test permissions:
  - Church admin can view groups affiliated with their church
  - Church admin cannot view independent groups
  - Church admin cannot view notes/prayers
  - Church admin cannot edit/delete groups

**Empty States**
- [ ] If church has no DNA groups yet:
  - Show empty state: "You haven't invited any DNA leaders yet"
  - "Invite DNA Leader" button
- [ ] If church has DNA leaders but no groups yet:
  - Show: "Your DNA leaders haven't created groups yet"
  - Display list of invited leaders

**Testing**
- [ ] Test church dashboard loads groups correctly
- [ ] Test filtering by phase
- [ ] Test searching by name
- [ ] Test viewing group details (read-only)
- [ ] Test permissions (church admin cannot edit)
- [ ] Test that notes/prayers are hidden from church admin
- [ ] Test empty states (no leaders, no groups)

---

### Phase 5: Polish & Launch Prep (Weeks 5-6)

**Goal:** Production-ready system with all nice-to-haves

#### Tasks:

**Email System - All Templates**
- [ ] Review all 8 email templates
- [ ] Add DNA branding (logo, colors, footer)
- [ ] Test email delivery on multiple providers (Gmail, Outlook, Apple Mail)
- [ ] Add unsubscribe links (if required)
- [ ] Test email rendering on mobile devices

**Phase Management**
- [ ] Manual phase change confirmation modal
- [ ] Phase change log (track when phases changed)
- [ ] Phase checklist (hardcoded items per phase) - optional
- [ ] Auto-suggest phase change when checklist 80% complete - optional

**Mobile Responsive Design**
- [ ] Test all pages on iPhone (Safari)
- [ ] Test all pages on Android (Chrome)
- [ ] Ensure forms work on mobile (assessment form)
- [ ] Card-based layouts for mobile (not tables)
- [ ] Touch-friendly buttons (min 44x44px)

**Error Handling**
- [ ] Add error boundaries to all major pages
- [ ] User-friendly error messages (not technical)
- [ ] Fallback UI when data fails to load
- [ ] Toast notifications for success/error (use library like `react-hot-toast`)

**Loading States**
- [ ] Skeleton loaders for all pages
- [ ] Loading spinners for API calls
- [ ] Disable buttons during form submission

**Data Validation**
- [ ] Form validation (frontend and backend)
- [ ] Email format validation
- [ ] Phone number validation (optional)
- [ ] Date validation (start date cannot be in past)

**Security**
- [ ] Rate limiting on API endpoints (prevent abuse)
- [ ] Token expiration for assessment links (expire after 30 days)
- [ ] Token expiration for invitations (expire after 7 days)
- [ ] Sanitize user input (prevent XSS attacks)

**Performance**
- [ ] Optimize database queries (use indexes)
- [ ] Implement pagination (groups list, notes list)
- [ ] Lazy load images (if any)
- [ ] Code splitting (use Next.js dynamic imports)

**Testing - Full System**
- [ ] Create 3 test churches
- [ ] Create 5 test DNA leaders (mix of church-affiliated and independent)
- [ ] Create 10 test groups
- [ ] Send test assessments
- [ ] Complete test assessments
- [ ] View comparison results
- [ ] Test all user flows end-to-end
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)
- [ ] Test on multiple devices (desktop, tablet, mobile)

**Documentation**
- [ ] User guide for DNA leaders (how to use dashboard)
- [ ] User guide for church admins (how to view groups)
- [ ] FAQ page
- [ ] Support email/contact form

**Launch Checklist**
- [ ] All Phase 1-5 tasks completed
- [ ] All email templates tested
- [ ] All user flows tested
- [ ] Mobile responsive verified
- [ ] Performance optimized
- [ ] Security measures in place
- [ ] Documentation complete
- [ ] Pilot program plan finalized

---

## Technical Specifications

### Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Shadcn/ui components (optional - for consistency)

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL)
- Supabase Auth (magic links)

**Email:**
- Resend (existing)

**PDF Generation:**
- `@react-pdf/renderer` (recommended)

**File Storage:**
- Supabase Storage (for PDFs, if needed)

**Hosting:**
- Same server as current DNA website (dna.arkidentity.com)

### API Endpoints

**DNA Leaders:**
- `POST /api/dna-leaders/invite` - Invite DNA leader
- `GET /api/dna-leaders` - List all DNA leaders (admin only)
- `GET /api/dna-leaders/[id]` - Get DNA leader details
- `PUT /api/dna-leaders/[id]` - Update DNA leader
- `DELETE /api/dna-leaders/[id]` - Deactivate DNA leader

**Groups:**
- `POST /api/groups/create` - Create new group
- `GET /api/groups` - List user's groups
- `GET /api/groups/[id]` - Get group details
- `PUT /api/groups/[id]` - Update group details
- `DELETE /api/groups/[id]` - Delete group
- `PUT /api/groups/[id]/phase` - Change group phase

**Disciples:**
- `GET /api/disciples/[id]` - Get disciple details
- `PUT /api/disciples/[id]` - Update disciple info
- `POST /api/disciples/[id]/notes` - Add note
- `GET /api/disciples/[id]/notes` - List notes
- `POST /api/disciples/[id]/prayers` - Add prayer request
- `GET /api/disciples/[id]/prayers` - List prayer requests
- `PUT /api/prayers/[id]/answer` - Mark prayer as answered

**Life Assessments:**
- `POST /api/assessments/send` - Send assessment to disciple
- `GET /api/assessments/[token]` - Get assessment (for disciple to fill out)
- `PUT /api/assessments/[token]/save` - Auto-save progress
- `POST /api/assessments/[token]/submit` - Submit completed assessment
- `GET /api/assessments/[id]` - Get completed assessment (leader view)
- `GET /api/assessments/[id]/pdf` - Download PDF
- `GET /api/assessments/comparison/[disciple-id]` - Week 1 vs Week 8 comparison

**Church Dashboard:**
- `GET /api/dashboard/groups` - List all groups for church (church admin)
- `GET /api/dashboard/groups/[id]` - View group details (read-only, church admin)
- `GET /api/dashboard/stats` - Church stats (groups, leaders, disciples)

### Environment Variables

Add to `.env.local`:

```bash
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=

# New (if needed)
# PDF_STORAGE_BUCKET=life-assessments
```

### File Structure

```
/src
  /app
    /groups                          # DNA Leader Dashboard
      /page.tsx                      # Landing page (list of groups)
      /new/page.tsx                  # Create new group
      /[id]/page.tsx                 # Group dashboard
      /[id]/disciples/[disciple-id]  # Disciple profile
        /page.tsx
        /comparison/page.tsx         # Week 1 vs Week 8
    /assessment
      /[token]/page.tsx              # Life Assessment form (public)
    /dashboard
      /groups                        # Church view of DNA groups
        /page.tsx                    # List all church groups
        /[id]/page.tsx               # View group details (read-only)
    /api
      /dna-leaders                   # DNA leader endpoints
      /groups                        # Group endpoints
      /disciples                     # Disciple endpoints
      /assessments                   # Life Assessment endpoints
      /dashboard/groups              # Church dashboard endpoints
  /components
    /groups                          # Group-related components
    /assessments                     # Assessment form components
    /disciples                       # Disciple profile components
  /lib
    /supabase.ts                     # Supabase client
    /auth.ts                         # Auth helpers
    /email.ts                        # Email functions
    /types.ts                        # TypeScript types
    /pdf.ts                          # PDF generation
```

---

## Testing Plan

### Unit Testing (Optional - but recommended)

**Tools:** Jest, React Testing Library

**What to test:**
- Components: Assessment form, group cards, disciple profiles
- Utility functions: Scoring logic, date calculations, PDF generation
- API routes: Request/response validation

### Integration Testing

**Tools:** Playwright or Cypress

**What to test:**
- Full user flows (invite → create group → send assessment → view results)
- Form submissions (group creation, assessment completion)
- Navigation (dashboard to group to disciple profile)

### Manual Testing

**Test Scenarios:**

1. **DNA Leader - Church-Affiliated**
   - Receives invitation email
   - Completes signup
   - Creates group (with church affiliation)
   - Invites co-leader and disciples
   - Sends Week 1 assessment to disciple
   - Views completed assessment results
   - Adds notes to disciple profile
   - Adds prayer request
   - Changes group phase

2. **DNA Leader - Independent**
   - Receives invitation email
   - Completes signup
   - Creates group (as independent)
   - Invites disciples
   - Sends assessment
   - Views results

3. **Disciple**
   - Receives welcome email
   - Receives Week 1 assessment link
   - Completes assessment (all 42 questions)
   - Receives results email
   - (Optional) Receives Week 8 assessment link
   - Completes Week 8 assessment

4. **Church Leader**
   - Logs into church dashboard
   - Views DNA Groups tab
   - Sees list of all groups affiliated with church
   - Filters by phase
   - Searches for specific group
   - Views group details (read-only)
   - Confirms cannot see notes/prayers
   - Confirms cannot edit/delete groups

5. **Dual Role User (Church Leader + DNA Leader)**
   - Logs in
   - Sees dashboard selector
   - Switches between Church Dashboard and DNA Leader Dashboard
   - Tests both views work correctly

### Browser Testing

**Browsers:**
- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Edge (latest)

**Devices:**
- Desktop (1920x1080, 1366x768)
- Tablet (iPad, Android tablet)
- Mobile (iPhone, Android phone)

### Performance Testing

**Metrics to track:**
- Page load time (< 2 seconds)
- API response time (< 500ms)
- PDF generation time (< 5 seconds)
- Database query time (< 100ms)

**Tools:**
- Lighthouse (Chrome DevTools)
- WebPageTest
- Supabase Dashboard (query performance)

---

## Launch Strategy

### Phase 1: Pilot Program (Weeks 6-7)

**Goal:** Test with real users, gather feedback

**Participants:**
- 2-3 pilot churches
- 5-10 DNA leaders total
- 20-40 disciples total

**Process:**
1. Invite pilot churches (already in system)
2. Church admins invite DNA leaders
3. DNA leaders create groups
4. Disciples complete Week 1 assessments
5. Gather feedback after 2 weeks
6. Make adjustments based on feedback

**Feedback Collection:**
- Email survey to DNA leaders (after 1 week, after 2 weeks)
- Email survey to disciples (after completing assessment)
- Email survey to church admins (after 2 weeks)
- Optional: 15-min phone calls with 3-5 users

**Success Criteria:**
- All pilot users successfully complete their tasks
- Assessment completion rate > 80%
- No critical bugs reported
- Positive feedback on usability

### Phase 2: Full Launch (Week 8)

**Goal:** Open to all churches, announce publicly

**Pre-Launch:**
- [ ] Fix all bugs from pilot program
- [ ] Update documentation based on feedback
- [ ] Create training video for DNA leaders (5-10 mins)
- [ ] Prepare announcement email
- [ ] Prepare social media posts

**Launch Day:**
- [ ] Send announcement email to all churches in system
- [ ] Post on social media (ARK Identity channels)
- [ ] Update website (add DNA Groups info)
- [ ] Offer 30-min onboarding calls (optional)

**Post-Launch:**
- [ ] Monitor usage daily (first week)
- [ ] Respond to support requests within 24 hours
- [ ] Track key metrics:
  - Number of DNA leaders invited
  - Number of groups created
  - Number of assessments sent
  - Assessment completion rate
- [ ] Gather feedback continuously
- [ ] Iterate based on feedback

### Support Plan

**Support Channels:**
- Email: support@arkidentity.com
- Help Center: dna.arkidentity.com/help
- Optional: Live chat (Intercom or similar)

**Response Times:**
- Critical bugs: Within 4 hours
- General questions: Within 24 hours
- Feature requests: Log for future consideration

**Documentation:**
- User guides for DNA leaders
- User guides for church admins
- FAQ page
- Video tutorials

---

## Future Enhancements (Phase 2+)

### Nice-to-Haves (Defer to Post-Launch)

1. **Meeting Scheduler Integration**
   - Integrate with Calendly or similar
   - Schedule group meetings
   - Send reminders

2. **Resources Library**
   - Upload PDFs, videos, links
   - Share with specific groups
   - Track resource usage

3. **Leader Health Check-Ins**
   - Periodic check-ins for DNA leaders
   - Track leader burnout
   - Offer support/encouragement

4. **Automated Phase Progression**
   - Auto-suggest phase change based on checklist completion
   - Notifications when milestones reached

5. **Group Multiplication Tracking**
   - Track when groups multiply
   - Visualize multiplication tree
   - Celebrate multiplication milestones

6. **Advanced Reporting**
   - Export data to CSV
   - Generate reports for church leadership
   - Trends over time

7. **Mobile App**
   - Native iOS/Android app
   - Push notifications
   - Offline support

---

## Questions & Answers

### Q: Do disciples need accounts?
**A:** No, disciples are contact records only. They use token-based links for assessments.

### Q: Can DNA leaders be church-affiliated AND independent?
**A:** A DNA leader can only have ONE church affiliation at a time (or be independent). They can update their church affiliation in their dashboard.

### Q: Can a church leader also be a DNA leader?
**A:** Yes! If someone is in both `church_leaders` and `dna_leaders` tables, they see a dashboard selector on login.

### Q: What happens if a DNA leader leaves a church?
**A:** They can update their church affiliation to "Independent" in their dashboard. The group's `church_id` is also updated.

### Q: Can co-leaders have different churches?
**A:** Yes, the group's church affiliation is set by the primary leader. The co-leader's church doesn't matter.

### Q: What if a disciple doesn't complete the assessment?
**A:** The leader can send a reminder email (manual button). The token remains valid for 30 days.

### Q: Can leaders see other leaders' groups?
**A:** No, leaders only see their own groups. Church admins see all groups affiliated with their church.

### Q: Can church admins edit groups?
**A:** No, church admins have read-only access. Only the leader and co-leader can edit.

### Q: Do we track independent leaders?
**A:** Yes, all DNA leaders (church-affiliated and independent) are in the `dna_leaders` table. Independent leaders have `church_id = NULL`.

---

## Success Metrics

### Key Performance Indicators (KPIs)

**User Adoption:**
- Number of DNA leaders invited (target: 50+ in first 3 months)
- Number of groups created (target: 30+ in first 3 months)
- Number of disciples enrolled (target: 120+ in first 3 months)

**Engagement:**
- Assessment completion rate (target: 80%+)
- Week 1 assessment completion time (target: < 20 mins)
- Leaders logging in weekly (target: 70%+)

**User Satisfaction:**
- DNA leaders: "This actually helps me disciple better" (target: 80%+ agree)
- Disciples: Assessment was easy to complete (target: 90%+ agree)
- Church admins: Can see all groups at a glance (target: 95%+ agree)

**Technical:**
- Page load time < 2 seconds (target: 100% of pages)
- Zero complaints about mobile usability (target: 0 complaints)
- Uptime > 99.5% (target: 99.9%)

---

## Contact & Support

**Developer:** Claude Code
**Project Lead:** Travis
**Timeline:** 6 weeks
**Launch Target:** End of Week 8

**Questions?** Email: travis@arkidentity.com

---

**END OF IMPLEMENTATION PLAN**
