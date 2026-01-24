# DNA Hub Codebase Map

> Quick reference for finding files and understanding the project structure.

## Directory Structure

```
dna-hub/
├── .claude/                    # Claude AI configuration
│   └── CLAUDE.md               # Auto-read project guide for Claude
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # System design & flows
│   ├── CODEBASE_MAP.md         # This file - project navigation
│   ├── CONVENTIONS.md          # Coding standards & patterns
│   ├── DATA_MODELS.md          # Database schema reference
│   └── [Business docs]         # DNA program documentation
│
├── public/                     # Static assets (images, favicon)
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (fonts, metadata)
│   │   ├── globals.css         # Global styles & CSS variables
│   │   ├── page.tsx            # Landing page (/)
│   │   │
│   │   ├── assessment/         # Church assessment flow
│   │   │   ├── page.tsx        # 4-section assessment form
│   │   │   └── thank-you/
│   │   │       └── page.tsx    # Post-submission page
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx        # Magic link login form
│   │   │
│   │   ├── onboarding/
│   │   │   └── page.tsx        # Post-first-login welcome
│   │   │
│   │   ├── portal/
│   │   │   └── page.tsx        # Pre-active church view
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Main implementation tracker
│   │   │
│   │   ├── admin/
│   │   │   ├── page.tsx        # All churches list
│   │   │   ├── settings/
│   │   │   │   └── page.tsx    # Google Calendar settings
│   │   │   └── church/
│   │   │       └── [id]/
│   │   │           └── page.tsx # Single church admin (Overview + DNA Journey tabs)
│   │   │
│   │   └── api/                # API Routes
│   │       ├── auth/
│   │       │   ├── magic-link/route.ts   # Generate login link
│   │       │   ├── verify/route.ts       # Validate token
│   │       │   └── logout/route.ts       # End session
│   │       │
│   │       ├── assessment/route.ts       # Submit assessment
│   │       ├── dashboard/route.ts        # Get dashboard data
│   │       ├── progress/route.ts         # Update milestone
│   │       ├── calendar/route.ts         # Export iCal
│   │       ├── subscribe/route.ts        # Email signup
│   │       ├── attachments/route.ts      # File upload/delete
│   │       ├── portal/route.ts           # Pre-active data
│   │       │
│   │       └── admin/
│   │           ├── churches/route.ts     # List all churches
│   │           └── church/
│   │               └── [id]/
│   │                   ├── route.ts      # Church CRUD
│   │                   ├── calls/route.ts     # Manage calls
│   │                   ├── documents/route.ts # Funnel docs
│   │                   └── milestones/route.ts # Milestone CRUD (admin)
│   │
│   ├── components/             # Reusable components
│   │   └── dashboard/          # Dashboard UI components
│   │       ├── JourneyTab.tsx         # DNA Journey phases view
│   │       ├── MilestoneItem.tsx      # Individual milestone display
│   │       ├── OverviewTab.tsx        # Dashboard overview/progress
│   │       ├── PhaseCard.tsx          # Collapsible phase display
│   │       ├── ScheduleCallCard.tsx   # Scheduled calls + booking links
│   │       └── utils.ts               # Helper functions
│   │
│   └── lib/                    # Shared utilities
│       ├── auth.ts             # getSession(), isAdmin()
│       ├── email.ts            # Email templates & sending
│       ├── google-calendar.ts  # Google Calendar API integration
│       ├── supabase.ts         # Supabase client setup
│       └── types.ts            # TypeScript interfaces
│
├── docs/
│   ├── resources/              # Static resource files
│   │   ├── DNA-Readiness-Quiz.pdf
│   │   └── Leader-Identification-Worksheet.pdf
│   └── BLVD/                   # BLVD church-specific docs
│       ├── BLVD DNA PARTNERSHIP AGREEMENT.pdf
│       └── BLVD_DNA_Implementation.pdf
│
├── Database Files
│   ├── supabase-schema.sql                    # Main schema
│   ├── supabase-migration-attachments.sql     # File attachments
│   ├── supabase-migration-funnel.sql          # Funnel documents
│   ├── supabase-migration-onboarding.sql      # Phase 0
│   ├── supabase-migration-phase-updates.sql   # Phase timelines
│   ├── supabase-migration-custom-milestones.sql  # Church-specific milestones
│   ├── supabase-migration-resources.sql       # Global resources system
│   ├── supabase-migration-admin-notes.sql     # Admin notes on progress
│   ├── supabase-migration-kickoff-notes.sql   # Kick-off milestone
│   ├── supabase-migration-rename-milestones.sql  # Milestone title updates
│   └── supabase-migration-google-calendar.sql    # Google Calendar integration
│
└── Configuration
    ├── package.json            # Dependencies & scripts
    ├── tsconfig.json           # TypeScript config
    ├── next.config.ts          # Next.js config
    ├── postcss.config.mjs      # PostCSS/Tailwind
    ├── eslint.config.mjs       # Linting rules
    └── .gitignore              # Git ignore patterns
```

## Key Files by Purpose

### Authentication
| File | Purpose |
|------|---------|
| `/src/lib/auth.ts` | Session management, admin check |
| `/src/app/api/auth/magic-link/route.ts` | Generate & email login token |
| `/src/app/api/auth/verify/route.ts` | Validate token, create session |
| `/src/app/login/page.tsx` | Login form UI |

### Database
| File | Purpose |
|------|---------|
| `/src/lib/supabase.ts` | Client initialization |
| `/supabase-schema.sql` | Complete table definitions |
| `/supabase-migration-*.sql` | Incremental changes |

### Email
| File | Purpose |
|------|---------|
| `/src/lib/email.ts` | All email templates & send logic |

### Types
| File | Purpose |
|------|---------|
| `/src/lib/types.ts` | TypeScript interfaces for all entities |

### Styling
| File | Purpose |
|------|---------|
| `/src/app/globals.css` | CSS variables, base styles, components |
| `/src/app/layout.tsx` | Font loading, root structure |

### Dashboard Components
| File | Purpose |
|------|---------|
| `/src/components/dashboard/OverviewTab.tsx` | Progress cards, quick actions, recent activity |
| `/src/components/dashboard/JourneyTab.tsx` | DNA phases with scheduled calls section |
| `/src/components/dashboard/PhaseCard.tsx` | Collapsible phase with milestones |
| `/src/components/dashboard/MilestoneItem.tsx` | Milestone checkbox, notes, attachments, linked calls |
| `/src/components/dashboard/ScheduleCallCard.tsx` | Scheduled calls list + booking links |
| `/src/components/dashboard/utils.ts` | `formatCallDate()`, `formatTargetDate()`, etc. |

### Google Calendar
| File | Purpose |
|------|---------|
| `/src/lib/google-calendar.ts` | OAuth, calendar sync, call type detection |
| `/src/app/api/auth/google/route.ts` | Start OAuth flow |
| `/src/app/api/auth/google/callback/route.ts` | Handle OAuth callback |
| `/src/app/api/cron/calendar-sync/route.ts` | Daily sync cron job |
| `/src/app/api/admin/calendar/*/route.ts` | Status, sync, disconnect endpoints |

## Page Routes

| Route | File | Purpose | Auth |
|-------|------|---------|------|
| `/` | `app/page.tsx` | Landing page | Public |
| `/assessment` | `app/assessment/page.tsx` | Church assessment form | Public |
| `/assessment/thank-you` | `app/assessment/thank-you/page.tsx` | Submission confirmation | Public |
| `/login` | `app/login/page.tsx` | Magic link login | Public |
| `/onboarding` | `app/onboarding/page.tsx` | First-time welcome | Session |
| `/portal` | `app/portal/page.tsx` | Pre-active church view | Session |
| `/dashboard` | `app/dashboard/page.tsx` | Implementation tracker | Session |
| `/admin` | `app/admin/page.tsx` | All churches list | Admin |
| `/admin/church/[id]` | `app/admin/church/[id]/page.tsx` | Church detail (Overview + DNA Journey) | Admin |
| `/admin/settings` | `app/admin/settings/page.tsx` | Google Calendar settings | Admin |

## API Routes

### Public Endpoints
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/magic-link` | POST | Request login email |
| `/api/auth/verify` | GET | Verify token from email |
| `/api/assessment` | POST | Submit church assessment |
| `/api/subscribe` | POST | Email newsletter signup |

### Protected Endpoints (Session Required)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/logout` | POST | End session |
| `/api/dashboard` | GET | Fetch phases, milestones, progress |
| `/api/progress` | POST | Update milestone status |
| `/api/calendar` | GET | Export iCal for phase |
| `/api/portal` | GET | Get funnel content |

### Admin Endpoints
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/churches` | GET | List all churches |
| `/api/admin/church/[id]` | GET | Church details |
| `/api/admin/church/[id]` | POST | Update church |
| `/api/admin/church/[id]/calls` | POST/DELETE | Manage scheduled calls |
| `/api/admin/church/[id]/documents` | POST | Manage documents |
| `/api/admin/church/[id]/milestones` | POST | Add custom milestones |
| `/api/admin/church/[id]/milestones` | PATCH | Update milestone (completion, target date, notes) |
| `/api/admin/church/[id]/milestones` | DELETE | Delete custom milestones |
| `/api/attachments` | POST | Upload file (supports churchId param for admin) |
| `/api/attachments` | DELETE | Delete file |

### Google Calendar Endpoints
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/google` | GET | Start OAuth flow |
| `/api/auth/google/callback` | GET | Handle OAuth callback |
| `/api/admin/calendar/status` | GET | Get connection status |
| `/api/admin/calendar/sync` | POST | Trigger manual sync |
| `/api/admin/calendar/disconnect` | POST | Disconnect calendar |
| `/api/cron/calendar-sync` | GET | Daily sync (Vercel cron) |

## Common Modifications

### Add a new page
1. Create folder: `src/app/[route-name]/`
2. Add `page.tsx` with component
3. Use `'use client'` directive if interactive

### Add a new API route
1. Create folder: `src/app/api/[route-name]/`
2. Add `route.ts` with handlers
3. Export: `GET`, `POST`, `PUT`, `DELETE` as needed

### Add a new database table
1. Update `supabase-schema.sql` (for reference)
2. Create `supabase-migration-[feature].sql`
3. Run migration in Supabase SQL editor
4. Add types to `/src/lib/types.ts`

### Modify authentication
1. Session logic: `/src/lib/auth.ts`
2. Login flow: `/src/app/login/page.tsx`
3. Token handling: `/src/app/api/auth/*/route.ts`

### Update email templates
1. All templates in: `/src/lib/email.ts`
2. Uses Resend for delivery
3. HTML inline styles (no external CSS)

### Change styling
1. CSS variables: `/src/app/globals.css` (`:root` section)
2. Component classes: same file (bottom section)
3. Tailwind utilities: inline in components
