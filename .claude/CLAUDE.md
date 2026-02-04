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

**Roadmap 3: DNA Training** (`/training`)
- Flow Assessment, DNA Manual, Launch Guide
- Progressive content unlocking based on completion

**User Types & Roles:**
- **Church Leaders** (`church_leader`) - Track church implementation, invite DNA leaders, view DNA groups
- **DNA Leaders** (`dna_leader`) - Manage discipleship groups and disciples
- **Training Participants** (`training_participant`) - Access DNA training content
- **Admins** (`admin`) - Full access to everything
- **Disciples** - Group participants (no login, token-based assessment links)

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
- **Training**: `/src/app/training/page.tsx` (Training participants)
- **Admin**: `/src/app/admin/page.tsx`
- **Unauthorized**: `/src/app/unauthorized/page.tsx`

### API Routes
- **Auth**: `/api/auth/magic-link`, `/api/auth/verify`, `/api/auth/logout`
- **Dashboard**: `/api/dashboard`, `/api/progress`
- **Admin**: `/api/admin/churches`, `/api/admin/church/[id]`
- **Groups**: `/api/groups`, `/api/groups/[id]`, `/api/groups/dashboard`
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

See `/docs/` for:
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
| `life_assessments` | Week 1/8 assessment responses |

### Church Implementation

| Table | Purpose |
|-------|---------|
| `churches` | Church records (includes `journey_template_id`) |
| `church_leaders` | Church leader accounts (linked to users via user_id) |
| `church_progress` | Milestone completion tracking |
| `journey_templates` | Master journey templates (e.g., "Standard DNA Journey") |
| `template_milestones` | Master milestone definitions (Phase 0 & 1 only) |
| `church_milestones` | Church-specific milestone copies (fully editable per church) |
| `milestones_deprecated` | Old milestones table (kept for rollback, do not use) |
