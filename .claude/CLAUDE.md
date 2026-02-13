# DNA Hub - Claude Project Guide

> This file is automatically read by Claude when working on this project.

## Quick Reference

| What | Where |
|------|-------|
| **Stack** | Next.js 16 + React 19 + TypeScript + Supabase + Tailwind 4 |
| **Auth** | Unified auth via `/src/lib/unified-auth.ts` (magic link, role-based) |
| **Database** | Supabase (PostgreSQL) - migrations in `/database/` |
| **API Routes** | `/src/app/api/` |
| **Types** | `/src/lib/types.ts` |
| **Styles** | Tailwind + `/src/app/globals.css` |

## Project Purpose

DNA Hub manages the **DNA Discipleship Framework** implementation at churches. It has three main systems:

**Roadmap 1: Church Implementation Dashboard** (`/dashboard`)
- Tracks churches through a 5-phase onboarding process with ~35 milestones
- Users: Church Leaders, Admins

**Roadmap 2: DNA Groups Dashboard** (`/groups`)
- DNA Leaders manage discipleship groups and disciples
- Church leaders can view their church's groups (read-only)
- Integrates with Daily DNA mobile app for disciple engagement tracking
- Dark mode theme for premium feel

**Roadmap 3: DNA Training** (`/training`)
- Flow Assessment, DNA Manual, Launch Guide
- Progressive content unlocking based on completion

**User Types & Roles:**
- **Church Leaders** (`church_leader`) - Track church implementation, invite DNA leaders, view DNA groups
- **DNA Leaders** (`dna_leader`) - Manage discipleship groups and disciples
- **Training Participants** (`training_participant`) - Access DNA training content
- **Admins** (`admin`) - Full access to everything
- **Disciples** - Group participants (separate Daily DNA app auth, token-based assessment links)

> Users can have multiple roles and access multiple dashboards with one login.

## Key Concepts

### Church Status Flow
```
pending_assessment → awaiting_discovery → proposal_sent →
awaiting_agreement → awaiting_strategy → active → completed
```

### 5 Phases (+ Phase 0)
0. Onboarding (pre-implementation)
1. Church Partnership
2. Leader Preparation
3. DNA Foundation
4. Practical Preparation
5. Final Validation & Launch

## File Locations

### Core Logic
- **Unified Auth**: `/src/lib/unified-auth.ts` - `getUnifiedSession()`, `hasRole()`, `isAdmin()`
- **Email sending**: `/src/lib/email.ts` - All email templates
- **Types**: `/src/lib/types.ts` - TypeScript interfaces
- **Supabase client**: `/src/lib/supabase.ts`

### Key Pages
- **Landing**: `/src/app/page.tsx`
- **Login**: `/src/app/login/page.tsx`
- **Dashboard**: `/src/app/dashboard/page.tsx` (Church leaders)
- **Groups**: `/src/app/groups/page.tsx` (DNA leaders)
- **Group Detail**: `/src/app/groups/[id]/page.tsx` (Phase progress, disciples, scheduled meetings)
- **Cohort**: `/src/app/cohort/page.tsx` (DNA leaders + church leaders)
- **Training**: `/src/app/training/page.tsx` (Training participants)
- **Admin**: `/src/app/admin/page.tsx`
- **Unauthorized**: `/src/app/unauthorized/page.tsx`

### Key Components
- **`GroupMeetings`**: `/src/components/groups/GroupMeetings.tsx` — meeting list + edit/delete modals
- **`EventModal`**: `/src/components/groups/EventModal.tsx` — create meeting modal
- **`UserMenu`**: `/src/components/UserMenu.tsx` — dashboard dropdown (Church/Groups/Cohort/Training)
- **`ResourcesTab`**: `/src/components/admin/ResourcesTab.tsx` — global resources CRUD (admin)

### API Routes
- **Auth**: `/api/auth/magic-link`, `/api/auth/verify`, `/api/auth/logout`
- **Dashboard**: `/api/dashboard`, `/api/progress`
- **Admin**: `/api/admin/churches`, `/api/admin/church/[id]`
- **Resources**: `/api/admin/resources` (GET+POST), `/api/admin/resources/[id]` (PUT+DELETE), `/api/admin/resources/upload` (POST)
- **Groups**: `/api/groups`, `/api/groups/[id]`, `/api/groups/dashboard`
- **Calendar**: `/api/calendar/events` (GET+POST), `/api/calendar/events/[id]` (PATCH+DELETE w/ scope)
- **Training**: `/api/training/dashboard`, `/api/training/assessment/*`

## Coding Conventions

### Colors (use CSS variables)
```css
--navy: #1A2332      /* Primary/headings */
--gold: #D4A853      /* CTAs/accents */
--teal: #2D6A6A      /* Links/secondary */
--cream: #FFFBF5     /* Background */
```

### Component Classes
- `btn-primary` - Gold CTA button
- `btn-secondary` - Outlined button
- `card` - White card with shadow
- `phase-current`, `phase-completed`, `phase-locked`

### API Response Pattern
```typescript
// Success
return NextResponse.json({ data: result })

// Error
return NextResponse.json({ error: 'Message' }, { status: 400 })
```

### Auth Check Pattern (Unified Auth)
```typescript
import { getUnifiedSession, hasRole, isAdmin } from '@/lib/unified-auth'

// Basic auth check
const session = await getUnifiedSession()
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Role-based access
if (!hasRole(session, 'church_leader') && !isAdmin(session)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Training access
import { isTrainingParticipant } from '@/lib/unified-auth'
if (!isTrainingParticipant(session) && !isAdmin(session)) {
  return NextResponse.json({ error: 'Not a training participant' }, { status: 403 })
}
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

## Common Tasks

### Add a new API endpoint
1. Create file in `/src/app/api/[route]/route.ts`
2. Export async functions: `GET`, `POST`, `PUT`, `DELETE`
3. Use `getUnifiedSession()` for auth
4. Check role with `hasRole(session, 'role_name')`
5. Return `NextResponse.json()`

### Add a new page
1. Create `/src/app/[route]/page.tsx`
2. Add `'use client'` if interactive
3. Follow existing page patterns

### Modify database
1. Create migration file: `/database/NNN_feature-name.sql` (next number in sequence)
2. Run in Supabase SQL editor
3. Update `/database/README.md` with the new migration

## Admin Emails (Hardcoded)
- thearkidentity@gmail.com
- travis@arkidentity.com

## Dev Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Documentation

**Cross-Project Docs** (in `/dna-planning/`):
- Architecture: `ARCHITECTURE.md`
- Database Schema: `DATABASE-SCHEMA.md`
- Integration Plan: `INTEGRATION-PLAN.md`
- Next Steps: `NEXT-STEPS.md`
- Changelog: `CHANGELOG.md`

**Hub-Specific Docs** (in `/docs/`):
- Architecture: `technical/ARCHITECTURE.md`
- File map: `technical/CODEBASE_MAP.md`
- Conventions: `technical/CONVENTIONS.md`
- Data models: `technical/DATA_MODELS.md`
- Planning: `planning/NEXT-STEPS.md`

## Key Database Tables

### Unified Auth (Migrations 025 & 026)

| Table | Purpose |
|-------|---------|
| `users` | Unified user accounts (one per email) |
| `user_roles` | Role assignments (church_leader, dna_leader, training_participant, admin) |
| `magic_link_tokens` | Auth tokens for email verification |

### Training (Migration 026)

| Table | Purpose |
|-------|---------|
| `user_training_progress` | Journey stage and milestones |
| `user_content_unlocks` | Progressive content unlocking |
| `user_flow_assessments` | Flow Assessment responses |

### DNA Groups (Migration 019)

| Table | Purpose |
|-------|---------|
| `dna_leaders` | DNA group leaders (linked to users via user_id) |
| `dna_groups` | Discipleship groups with 5 phases |
| `disciples` | Group participants (no login) |
| `group_disciples` | Join table for group membership |
| `life_assessments` | Week 1/12 assessment responses |

### Daily DNA Integration (Migration 034 - COMPLETE)

| Table | Purpose |
|-------|---------|
| `disciple_app_accounts` | Disciple login for Daily DNA app (separate auth from leaders) |
| `disciple_journal_entries` | 3D Journal entries (Head/Heart/Hands) |
| `disciple_prayer_cards` | 4D Prayer cards |
| `disciple_prayer_sessions` | Prayer session tracking |
| `disciple_testimonies` | Testimony Builder (STORY framework) |
| `disciple_progress` | Streaks, badges, engagement stats |
| `disciple_creed_progress` | Creed Cards mastery |
| `toolkit_modules` | 90-Day Toolkit content |
| `toolkit_checkpoints` | Checkpoint definitions |
| `disciple_toolkit_progress` | Individual toolkit progress |
| `disciple_checkpoint_completions` | Checkpoint completions |
| `challenge_registrations` | 3D Bible Challenge signups |
| `life_assessment_questions` | Assessment question bank |
| `life_assessment_responses` | Assessment responses |
| `tool_assignments` | Leader assigns tools to disciples |
| `tool_completions` | Tracks tool completion (syncs from Daily DNA app) |
| `journey_checkpoints` | Phase checkpoints (leader-approved) |
| `discipleship_log` | Unified notes + prayer requests |
| `disciple_push_subscriptions` | Push notification endpoints |
| `disciple_notification_prefs` | Notification settings |
| `disciple_sync_metadata` | Device sync tracking |

**Important:** Daily DNA app (`/dna-app/daily-dna/`) uses the same Supabase database as DNA Hub for seamless integration. Disciples have separate auth (`disciple_app_accounts`) from leaders (`users` table).

**Key Database Functions:**
- `upsert_journal_entry` - Sync journal entries from Daily DNA app
- `upsert_prayer_card` - Sync prayer cards from Daily DNA app
- `calculate_disciple_streak` - Calculate engagement streaks
- `update_disciple_progress` - Update progress stats

**Daily DNA App Connection (Feb 2026):**
- Daily DNA app now points to DNA Hub Supabase
- Uses `account_id` (not `user_id`) referencing `disciple_app_accounts`
- OAuth configured: Google + Discord (Google verification submitted)
- Groups & Chat Phase 1 live (real-time group chat)
- Account syncing to Hub working

**Active Priorities (Feb 12, 2026):**
- ~~Groups Calendar~~ ✅ COMPLETE — create/edit/delete (scoped), `GroupMeetings` component, Daily DNA calendar widget + full page
- ~~Co-leader invitations~~ ✅ COMPLETE — Migration 049
- ~~Cohort in nav dropdown~~ ✅ COMPLETE — `UserMenu` shows Cohort for `dna_leader` + `church_leader`
- ~~Global Resources Admin UI~~ ✅ COMPLETE — CRUD + file upload, `ResourcesTab` in `/admin`
- Testimony Builder cloud sync
- Pathway locking (locked unless in DNA group, unlock by phase/month)
- Calendar email reminders (Resend + .ics, 24hr before events)
- See `/docs/planning/NEXT-STEPS.md` for full roadmap

**Key Decisions (Feb 2026):**
- No Google Calendar API — using Supabase + Resend + .ics
- Calendar management is Hub-only; Daily DNA is read-only for disciples
- Recurring event edit/delete: 3 scopes — `this` / `this_and_future` / `all`
- Tool assignment simplified to phase-locking by month
- Testimonies private unless shared in group chat
- Training should bridge to Groups dashboard
- Fireflies deprioritized

### Church Implementation

| Table | Purpose |
|-------|---------|
| `churches` | Church records (includes `journey_template_id`) |
| `church_leaders` | Church leader accounts (linked to users via user_id) |
| `church_progress` | Milestone completion tracking (FK → church_milestones) |
| `journey_templates` | Master journey templates (e.g., "Standard DNA Journey") |
| `template_milestones` | Master milestone definitions (Phase 0 & 1 only) |
| `church_milestones` | Church-specific milestone copies (fully editable per church) |
| `milestone_resources` | Links `global_resources` to `template_milestones` (NOT church_milestones) |
| `global_resources` | Shared PDFs, guides, worksheets for all churches |
| `milestones_deprecated` | Old milestones table (kept for rollback, do not use) |

**Important:** `milestone_resources` references `template_milestones`, not `church_milestones`. Dashboard API joins via `church_milestones.source_milestone_id` to get resources.
