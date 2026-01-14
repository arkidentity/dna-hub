# DNA Hub - Claude Project Guide

> This file is automatically read by Claude when working on this project.

## Quick Reference

| What | Where |
|------|-------|
| **Stack** | Next.js 16 + React 19 + TypeScript + Supabase + Tailwind 4 |
| **Auth** | Magic link email (no passwords) via `/src/lib/auth.ts` |
| **Database** | Supabase (PostgreSQL) - schemas in `/supabase-*.sql` |
| **API Routes** | `/src/app/api/` |
| **Types** | `/src/lib/types.ts` |
| **Styles** | Tailwind + `/src/app/globals.css` |

## Project Purpose

DNA Hub manages the **DNA Discipleship Framework** implementation at churches. It tracks churches through a 5-phase onboarding process with ~35 milestones.

**User Types:**
- **Church Leaders** - Track their church's implementation progress
- **Admins** - Manage all churches, update statuses, upload resources

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
- **Dashboard**: `/src/app/dashboard/page.tsx`
- **Admin**: `/src/app/admin/page.tsx`

### API Routes
- **Auth**: `/api/auth/magic-link`, `/api/auth/verify`, `/api/auth/logout`
- **Data**: `/api/dashboard`, `/api/progress`, `/api/assessment`
- **Admin**: `/api/admin/churches`, `/api/admin/church/[id]`

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
const session = await getSession()
if (!session) {
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
1. Update `/supabase-schema.sql` for reference
2. Create migration file: `supabase-migration-[feature].sql`
3. Run in Supabase SQL editor

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
- Architecture details: `ARCHITECTURE.md`
- File map: `CODEBASE_MAP.md`
- Conventions: `CONVENTIONS.md`
- Data models: `DATA_MODELS.md`
- Business docs: `DNA Church Implementation Roadmap.md`, etc.
