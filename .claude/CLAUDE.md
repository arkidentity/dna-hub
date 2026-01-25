# DNA Hub - Claude Project Guide

> This file is automatically read by Claude when working on this project.

## Quick Reference

| What | Where |
|------|-------|
| **Stack** | Next.js 16 + React 19 + TypeScript + Supabase + Tailwind 4 |
| **Auth** | Magic link email (no passwords) via `/src/lib/auth.ts` |
| **Database** | Supabase (PostgreSQL) - migrations in `/database/` |
| **API Routes** | `/src/app/api/` |
| **Types** | `/src/lib/types.ts` |
| **Styles** | Tailwind + `/src/app/globals.css` |

## Project Purpose

DNA Hub manages the **DNA Discipleship Framework** implementation at churches. It has two main systems:

**Roadmap 1: Church Implementation Dashboard** (existing)
- Tracks churches through a 5-phase onboarding process with ~35 milestones
- Users: Church Leaders, Admins

**Roadmap 2: DNA Groups Dashboard** (new - `/groups`)
- DNA Leaders manage discipleship groups and disciples
- Separate auth system (`dna_leader_session` cookie)
- Church leaders can view their church's groups (read-only)

**User Types:**
- **Church Leaders** - Track their church's implementation progress, invite DNA leaders, view DNA groups
- **DNA Leaders** - Manage discipleship groups and disciples (separate dashboard at `/groups`)
- **Disciples** - Group participants (no login, token-based assessment links)
- **Admins** - Manage all churches, all DNA leaders, full access to everything

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
- **Auth helpers**: `/src/lib/auth.ts` - `getSession()`, `isAdmin()`
- **Email sending**: `/src/lib/email.ts` - All email templates
- **Types**: `/src/lib/types.ts` - TypeScript interfaces
- **Supabase client**: `/src/lib/supabase.ts`

### Key Pages
- **Landing**: `/src/app/page.tsx`
- **Assessment form**: `/src/app/assessment/page.tsx`
- **Login**: `/src/app/login/page.tsx`
- **Dashboard**: `/src/app/dashboard/page.tsx` (has Overview, DNA Journey, DNA Groups tabs)
- **Admin**: `/src/app/admin/page.tsx`
- **Admin Church View**: `/src/app/admin/church/[id]/page.tsx` (has Overview, DNA Journey, DNA Groups tabs)

### DNA Groups Pages (Roadmap 2)
- **DNA Leader Dashboard**: `/src/app/groups/page.tsx`
- **Create Group**: `/src/app/groups/new/page.tsx`
- **Group Detail**: `/src/app/groups/[id]/page.tsx`
- **DNA Leader Signup**: `/src/app/groups/signup/page.tsx`

### API Routes
- **Auth**: `/api/auth/magic-link`, `/api/auth/verify`, `/api/auth/logout`
- **Data**: `/api/dashboard`, `/api/progress`, `/api/assessment`
- **Admin**: `/api/admin/churches`, `/api/admin/church/[id]`

### DNA Groups API Routes
- **DNA Leaders**: `/api/dna-leaders/invite`, `/api/dna-leaders/verify-token`, `/api/dna-leaders/activate`
- **Groups**: `/api/groups`, `/api/groups/[id]`, `/api/groups/[id]/disciples`, `/api/groups/dashboard`
- **Church DNA Data**: `/api/churches/[churchId]/dna-groups`
- **DNA Leader Auth**: `/api/auth/verify-dna-leader`, `/api/auth/logout-dna-leader`

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

### Auth Check Pattern
```typescript
// Church leader auth
const session = await getSession()
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// DNA leader auth
const dnaSession = await getDNALeaderSession()
if (!dnaSession) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
3. Use `getSession()` for auth
4. Return `NextResponse.json()`

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
- Architecture details: `technical/ARCHITECTURE.md`
- File map: `technical/CODEBASE_MAP.md`
- Conventions: `technical/CONVENTIONS.md`
- Data models: `technical/DATA_MODELS.md`
- Integrations: `integrations/FIREFLIES.md`, `integrations/GOOGLE_CALENDAR.md`
- Business docs: `business/DNA-IMPLEMENTATION-ROADMAP.md`, etc.
- **DNA Groups Plan**: `planning/DNA-GROUPS-PLAN.md` - Complete implementation plan for Roadmap 2

## DNA Groups Database Tables (Migration: `019_dna-groups.sql`)

| Table | Purpose |
|-------|---------|
| `dna_leaders` | DNA group leaders (separate from church_leaders) |
| `dna_groups` | Discipleship groups with 5 phases |
| `disciples` | Group participants (no login) |
| `group_disciples` | Join table for group membership |
| `life_assessments` | Week 1/8 assessment responses |
| `leader_notes` | Private leader notes on disciples |
| `prayer_requests` | Prayer tracking per disciple |
| `leader_health_checkins` | 6-month leader health assessments |
