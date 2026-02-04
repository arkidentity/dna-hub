# DNA Groups Dashboard - Complete Implementation Plan

**Version:** 2.0
**Last Updated:** 2026-02-04
**Status:** Phase 1 Complete | Daily DNA Integration Planning Complete

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

#### Daily DNA App Integration (Migration 034 - Planned)
- [ ] Database schema for Daily DNA integration
- [ ] Dark mode theme for DNA Groups Dashboard
- [ ] Disciple Profile Page with journey tracking
- [ ] Discipleship Log (notes + prayer requests)

---

## Daily DNA Integration Plan

> **CRITICAL DECISION (2026-02-04):** Daily DNA app will use the DNA Hub Supabase database for seamless integration.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DNA HUB (Web Dashboard)                       │
│  - DNA Leaders manage groups, disciples, checkpoints             │
│  - Church leaders view groups (read-only)                        │
│  - Admins have full access                                       │
├─────────────────────────────────────────────────────────────────┤
│                         SHARED DATABASE                          │
│                     (DNA Hub Supabase)                           │
├─────────────────────────────────────────────────────────────────┤
│                    DAILY DNA (Mobile App)                        │
│  - Disciples use 3D Journal, 4D Prayer                           │
│  - Complete assigned tools (assessments, etc.)                   │
│  - View their journey progress                                   │
│  - White-labeled per church (grace.dailydna.app)                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Decisions Confirmed

| Decision | Outcome |
|----------|---------|
| **Database** | Daily DNA uses DNA Hub Supabase (NOT separate Ark App database) |
| **Disciple Auth** | Separate `disciple_app_accounts` table (OAuth, email/password) |
| **Leader Auth** | Uses existing `users` table with unified auth |
| **Invite Flow** | Leader sends invite → Disciple creates own account → Linked to `disciples` record |
| **Phase Advancement** | Manual approval by DNA Leader/Co-Leader |
| **White-labeling** | `church_subdomain` field enables branded experience |

### Co-Leader Permissions

| Action | Co-Leader Can? |
|--------|----------------|
| Add/remove disciples | ✅ Yes |
| Assign tools | ✅ Yes |
| Mark checkpoints complete | ✅ Yes |
| Archive group | ❌ No (Leader only) |
| Invite additional co-leaders | ❌ No (Admin-assisted switch only) |

### Disciple Invitation Flow

1. Leader adds disciple in DNA Hub
2. System sends Daily DNA invite **immediately**
3. Invite link includes church subdomain: `https://grace.dailydna.app/invite?token=xxx`
4. Disciple creates their own account (OAuth, email/password, Google, Discord)
5. Account linked to `disciples` record via `disciple_app_accounts` table

### Sync Strategy

| Event Type | Sync Method | Timing |
|------------|-------------|--------|
| **Tool completions** | Real-time (Supabase subscriptions) | Instant |
| **Phase checkpoints** | Real-time | Instant |
| **Engagement analytics** | Daily batch job | 3 AM nightly |
| **Profile stats** | On-demand with 5-min cache | When leader views |

### New Database Tables (Migration 034)

| Table | Purpose |
|-------|---------|
| `disciple_app_accounts` | Disciple login for Daily DNA (separate auth) |
| `disciple_journal_entries` | 3D Journal (Head/Heart/Hands) |
| `disciple_prayer_cards` | 4D Prayer cards |
| `disciple_progress` | Streaks, badges, engagement |
| `tool_assignments` | Leader assigns tools to disciples |
| `tool_completions` | Tracks completion (syncs from app) |
| `journey_checkpoints` | Phase checkpoints (leader-approved) |
| `discipleship_log` | Unified notes + prayer requests |

### Tables Migrating from Ark App

The following functionality from Ark App will be recreated in DNA Hub:

| Ark App Table | DNA Hub Equivalent | Notes |
|---------------|-------------------|-------|
| `journal_entries` | `disciple_journal_entries` | 3D Journal with sync |
| `prayer_cards` | `disciple_prayer_cards` | 4D Prayer cards |
| `user_progress` | `disciple_progress` | Streaks, badges |
| `profiles` | `disciple_app_accounts` | User profile info |
| `dna_progress` | `user_training_progress` | Already exists for leaders |
| `dna_dam_assessments` | `user_flow_assessments` | Already exists |
| `push_subscriptions` | `disciple_push_subscriptions` | Push notifications |
| `notification_preferences` | `disciple_notification_prefs` | Notification settings |

### Tables NOT Needed from Ark App

- Prayer Room tables (Ark-specific live feature)
- Events/RSVPs (Ark-specific)
- Community posts/likes (can add later)
- Challenge registrations (Ark-specific)

---

## Disciple Journey System

### Disciple Phases (0-3)

| Phase | Name | Purpose | Duration |
|-------|------|---------|----------|
| 0 | Invitation | Getting set up, intro meeting | 1-2 weeks |
| 1 | Foundation | Weeks 1-4 of DNA group | 4 weeks |
| 2 | Growth | Weeks 5-8, maturing | 4 weeks |
| 3 | Multiplication | Preparing to lead/multiply | Ongoing |

### Phase Checkpoints (Leader Marks Complete)

**Phase 0 (Invitation):**
- `invited` - Disciple added to group
- `app_setup` - Daily DNA app installed & account created
- `intro_meeting` - Attended intro/kickoff meeting

**Phase 1 (Foundation):**
- `week1_complete` - Attended week 1
- `life_assessment_done` - Completed Week 1 Life Assessment
- `first_journal` - Created first 3D Journal entry
- `week2_complete` through `week4_complete`

**Phase 2 (Growth):**
- `week5_complete` through `week8_complete`
- `spiritual_gifts_done` - Completed Spiritual Gifts Assessment
- `leading_discussion` - Led a group discussion

**Phase 3 (Multiplication):**
- `life_assessment_final` - Completed Week 8 Life Assessment
- `multiplication_conversation` - Had multiplication conversation with leader
- `ready_to_lead` - Identified as ready to co-lead

### Tool Types

| Tool | Description | When Assigned |
|------|-------------|---------------|
| `life_assessment_week1` | Week 1 Life Assessment | Week 1 |
| `life_assessment_week8` | Week 8 Life Assessment | Week 8 |
| `spiritual_gifts` | Spiritual Gifts Assessment | Week 4-6 |
| `flow_assessment` | Flow Assessment (for leaders) | When preparing to lead |
| `dam_assessment` | Dam Assessment | Anytime |
| `3d_journal` | 3D Journal practice | Ongoing |
| `4d_prayer` | 4D Prayer practice | Ongoing |

---

## UI/UX Direction

### Dark Mode Theme

The DNA Groups Dashboard will use a **dark mode theme** to:
- Match the Training dashboard aesthetic
- Create a premium, polished feel
- Differentiate from the Church/Admin dashboards (which use light mode)

### Design System

```css
/* Dark mode colors for DNA Groups */
--bg-primary: #0f1419;      /* Deep dark background */
--bg-secondary: #1a1f2e;    /* Card backgrounds */
--bg-tertiary: #252b3b;     /* Hover states */
--text-primary: #f7f9f9;    /* Primary text */
--text-secondary: #8b949e;  /* Secondary text */
--accent-gold: #D4A853;     /* CTAs, highlights */
--accent-teal: #2D6A6A;     /* Links, secondary actions */
```

### Key UI Components

1. **Disciple Profile Page** - Single view with:
   - Journey progress (phases 0-3 with checkpoints)
   - Quick actions (assign tool, add note, advance phase)
   - Discipleship log (notes + prayers combined)
   - Engagement stats (from Daily DNA app)

2. **Group Dashboard** - Overview with:
   - Group phase and week indicator
   - Disciple cards with status badges
   - Recent activity feed
   - Bulk actions (send assessment to all, etc.)

3. **Discipleship Log** - Unified timeline with:
   - Notes (leader observations)
   - Prayer requests (with answered status)
   - Milestone completions
   - Tool completions (synced from app)

---

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Database migrations (new tables for journey, checkpoints, log)
- [ ] Dark mode theme setup for DNA Groups
- [ ] Disciple Profile Page (basic info, quick actions)
- [ ] Discipleship Log (notes + prayer requests)

### Week 2-3: Journey System
- [ ] Journey tracking (phases 0-3, checkpoints)
- [ ] Phase advancement (manual approval modal)
- [ ] Co-leader system (invite, permissions)

### Week 3-4: Integration Prep
- [ ] Tool assignment UI (modal, assignment list)
- [ ] Shared tables for Daily DNA sync (`disciple_app_accounts`, `tool_unlocks`, `tool_completions`)
- [ ] Webhook endpoints for completion events
- [ ] Engagement sync (daily batch job + on-demand refresh)

### Week 4-5: Polish & Analytics
- [ ] Engagement charts (visualize app usage)
- [ ] Multiplication wizard (create new groups from disciples)
- [ ] Multiplication tree (visual family lineage)

---

## Technical Specifications

### New API Endpoints (Planned)

**Disciple Journey:**
- `GET /api/groups/[id]/disciples/[discipleId]` - Disciple profile with journey
- `POST /api/groups/[id]/disciples/[discipleId]/checkpoints` - Mark checkpoint complete
- `POST /api/groups/[id]/disciples/[discipleId]/advance-phase` - Advance to next phase

**Tool Management:**
- `POST /api/groups/[id]/disciples/[discipleId]/assign-tool` - Assign tool
- `GET /api/groups/[id]/disciples/[discipleId]/tools` - List assigned tools
- `POST /api/tools/completions` - Webhook for tool completions (from Daily DNA)

**Discipleship Log:**
- `GET /api/groups/[id]/disciples/[discipleId]/log` - Get combined log
- `POST /api/groups/[id]/disciples/[discipleId]/log` - Add note/prayer

**Engagement:**
- `GET /api/groups/[id]/disciples/[discipleId]/engagement` - Get engagement stats
- `POST /api/cron/engagement-sync` - Daily engagement aggregation

### Database Schema (Migration 034)

See `/docs/planning/DAILY-DNA-DATABASE-MIGRATION.md` for complete schema definitions.

---

## Questions Resolved

| Question | Decision |
|----------|----------|
| Same database for Daily DNA? | ✅ Yes - Uses DNA Hub Supabase |
| Disciple auth system? | Separate - `disciple_app_accounts` table |
| Sync method? | Hybrid - real-time for tools, batch for analytics |
| Phase advancement? | Manual - leader marks checkpoints complete |
| Co-leader permissions? | Add/remove ✅, Assign tools ✅, Checkpoints ✅, Archive ❌, Invite co-leaders ❌ |
| White-labeling? | Church subdomain in `disciple_app_accounts` |
| UI theme? | Dark mode for DNA Groups Dashboard |

---

## Related Documentation

- **Database Migration Plan:** `/docs/planning/DAILY-DNA-DATABASE-MIGRATION.md`
- **Architecture:** `/docs/technical/ARCHITECTURE.md`
- **Codebase Map:** `/docs/technical/CODEBASE_MAP.md`
- **CLAUDE.md:** `/.claude/CLAUDE.md`

---

**END OF DNA GROUPS PLAN v2.0**
