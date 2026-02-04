# DNA Hub Architecture

## System Overview

DNA Hub is a **church discipleship management platform** built on Next.js 16 with the App Router pattern. It manages:
1. **Church Implementation** - 5-phase onboarding process with ~35 milestones
2. **DNA Groups** - Discipleship group management for DNA Leaders
3. **DNA Training** - Progressive training content for new leaders
4. **Daily DNA Integration** - Mobile app for disciple engagement (shared database)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DNA Hub Ecosystem                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐        │
│  │       DNA Hub (Web)         │     │    Daily DNA (Mobile PWA)   │        │
│  │    dnahub.arkidentity.com   │     │   {church}.dailydna.app     │        │
│  ├─────────────────────────────┤     ├─────────────────────────────┤        │
│  │ • Church Leaders            │     │ • Disciples                 │        │
│  │ • DNA Leaders               │     │ • 3D Journal                │        │
│  │ • Training Participants     │     │ • 4D Prayer Cards           │        │
│  │ • Admins                    │     │ • Tool Completions          │        │
│  └──────────────┬──────────────┘     └──────────────┬──────────────┘        │
│                 │                                    │                       │
│                 │         SHARED DATABASE            │                       │
│                 └────────────────┬───────────────────┘                       │
│                                  ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────┐      │
│  │                      Supabase (PostgreSQL)                         │      │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │      │
│  │  │ Church Tables    │  │ DNA Group Tables │  │ Daily DNA Tables│  │      │
│  │  │ • churches       │  │ • dna_leaders    │  │ • disciple_app_ │  │      │
│  │  │ • church_leaders │  │ • dna_groups     │  │   accounts      │  │      │
│  │  │ • church_progress│  │ • disciples      │  │ • journal_      │  │      │
│  │  │ • milestones     │  │ • group_disciples│  │   entries       │  │      │
│  │  └──────────────────┘  └──────────────────┘  │ • prayer_cards  │  │      │
│  │                                               │ • tool_         │  │      │
│  │                                               │   completions   │  │      │
│  │                                               └─────────────────┘  │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                  │                                           │
│                                  ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────┐      │
│  │                         Resend (Email)                             │      │
│  │  • Magic links (leaders) • Daily DNA invites (disciples)          │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dual Authentication Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Authentication Systems                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DNA Hub Users (Leaders/Admins)          Daily DNA Users (Disciples)         │
│  ─────────────────────────────           ────────────────────────────        │
│  • Magic link auth                       • Email/password OR OAuth           │
│  • Session cookies                       • Supabase Auth (auth.users)        │
│  • `users` + `user_roles` tables         • `disciple_app_accounts` table     │
│  • Multi-role support                    • Linked to `disciples` table       │
│  • Access: DNA Hub web app               • Access: Daily DNA mobile PWA      │
│                                                                              │
│  Why separate? Leaders need seamless     Why separate? Disciples need        │
│  multi-device access without passwords.  persistent login on their phone     │
│  Churches rotate leaders frequently.     for daily engagement tracking.      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16.1.1 |
| UI | React | 19.2.3 |
| Language | TypeScript | 5 |
| Database | Supabase (PostgreSQL) | - |
| Styling | Tailwind CSS | 4 |
| Email | Resend | 6.7.0 |
| Icons | Lucide React | 0.562.0 |

## Application Architecture

### Request Flow

```
User Request
     │
     ▼
┌─────────────┐
│  Next.js    │
│  App Router │
└──────┬──────┘
       │
       ├─── Static Page ──────────► Rendered HTML
       │
       ├─── Client Component ─────► React Hydration
       │                            (useState, useEffect)
       │
       └─── API Route ────────────► Server Handler
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
              ┌──────────┐        ┌──────────────┐       ┌──────────┐
              │ Supabase │        │   Session    │       │  Resend  │
              │ Database │        │   Cookie     │       │  Email   │
              └──────────┘        └──────────────┘       └──────────┘
```

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Magic Link Authentication                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. User enters email ──► /api/auth/magic-link                   │
│                                    │                              │
│  2. Generate token ◄───────────────┘                             │
│     Store in DB (7-day expiry)                                   │
│                                    │                              │
│  3. Send email via Resend ◄────────┘                             │
│     Contains: /api/auth/verify?token=xxx                         │
│                                    │                              │
│  4. User clicks link ──────────────┘                             │
│                                    │                              │
│  5. Verify token ◄─────────────────┘                             │
│     - Check not expired                                          │
│     - Check not used                                             │
│     - Check church is 'active' (or user is admin)                │
│                                    │                              │
│  6. Create session cookie ◄────────┘                             │
│     - httpOnly, secure, sameSite                                 │
│     - Contains: leaderId, churchId, token                        │
│                                    │                              │
│  7. Redirect to /dashboard ◄───────┘                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Data Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Core Entities                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐       ┌──────────────────┐                    │
│  │   churches   │──1:N──│  church_leaders  │                    │
│  │              │       │                  │                    │
│  │ - status     │       │ - email          │                    │
│  │ - phase      │       │ - role           │                    │
│  │ - timelines  │       │ - is_primary     │                    │
│  └──────┬───────┘       └──────────────────┘                    │
│         │                                                        │
│         │ 1:N                                                    │
│         ▼                                                        │
│  ┌──────────────────┐                                           │
│  │ church_progress  │                                           │
│  │                  │                                           │
│  │ - milestone_id   │───► ┌────────────────┐                    │
│  │ - completed      │     │   milestones   │ (Template)         │
│  │ - completed_by   │     │                │                    │
│  │ - target_date    │     │ - phase_id ────┼──► ┌────────┐      │
│  │ - admin_notes    │     │ - name         │    │ phases │      │
│  └──────────────────┘     │ - resources    │    └────────┘      │
│                           └────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## DNA Groups & Daily DNA Data Flow

### Real-time Sync Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Daily DNA ↔ DNA Hub Sync Strategy                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  REAL-TIME (Supabase Subscriptions)        BATCH (Daily Cron Jobs)           │
│  ──────────────────────────────────        ────────────────────────          │
│  • Tool completions                        • Engagement analytics            │
│  • Phase checkpoint completions            • Streak calculations             │
│  • Assessment submissions                  • Leader dashboard aggregates     │
│                                            • Health metrics                  │
│                                                                              │
│  ┌─────────────┐                           ┌─────────────┐                   │
│  │ Daily DNA   │ ──────────────────────►   │  Supabase   │                   │
│  │   App       │  Real-time writes         │  Database   │                   │
│  └─────────────┘                           └──────┬──────┘                   │
│                                                   │                          │
│                                                   │ Supabase                 │
│                                                   │ Realtime                 │
│                                                   ▼                          │
│  ┌─────────────┐                           ┌─────────────┐                   │
│  │  DNA Hub    │ ◄─────────────────────    │ DNA Leader  │                   │
│  │ Dashboard   │  Subscribed updates       │  Dashboard  │                   │
│  └─────────────┘                           └─────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Disciple Journey Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Disciple Lifecycle                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DNA Leader adds disciple         2. Disciple receives invite             │
│     (name, email, phone)                (Daily DNA app link)                 │
│            │                                     │                           │
│            ▼                                     ▼                           │
│  ┌─────────────────┐                  ┌─────────────────┐                    │
│  │ disciples table │                  │ disciple_app_   │                    │
│  │ (created)       │                  │ accounts (opt)  │                    │
│  └────────┬────────┘                  └────────┬────────┘                    │
│           │                                    │                             │
│           │ 3. Disciple phases through group   │                             │
│           │                                    │                             │
│           ▼                                    ▼                             │
│  ┌──────────────────────────────────────────────────────┐                   │
│  │              DISCIPLE PHASES                          │                   │
│  │                                                       │                   │
│  │  Phase 0: Pre-Launch                                  │                   │
│  │  ├── Invited to group                                 │                   │
│  │  ├── Downloads Daily DNA app                          │                   │
│  │  └── Completes Week 1 Life Assessment (token-based)   │                   │
│  │                                                       │                   │
│  │  Phase 1: Foundation (Weeks 1-4)                      │                   │
│  │  ├── Learning DNA principles                          │                   │
│  │  ├── Daily 3D Journal entries                         │                   │
│  │  └── Building habits                                  │                   │
│  │                                                       │                   │
│  │  Phase 2: Growth (Weeks 5-8)                          │                   │
│  │  ├── Deeper engagement                                │                   │
│  │  ├── 4D Prayer cards                                  │                   │
│  │  └── Week 8 Life Assessment                           │                   │
│  │                                                       │                   │
│  │  Phase 3: Multiplication Prep                         │                   │
│  │  ├── Leadership potential assessment                  │                   │
│  │  └── Training pathway (optional)                      │                   │
│  │                                                       │                   │
│  └──────────────────────────────────────────────────────┘                   │
│           │                                                                  │
│           │ 4. Graduation options                                            │
│           ▼                                                                  │
│  ┌─────────────────┐    OR    ┌─────────────────┐                           │
│  │ Stays in new    │          │ Promoted to     │                           │
│  │ DNA group       │          │ DNA Leader      │                           │
│  └─────────────────┘          └─────────────────┘                           │
│                                        │                                     │
│                                        ▼                                     │
│                               ┌─────────────────┐                           │
│                               │ DNA Training    │                           │
│                               │ (Flow Assessment│                           │
│                               │  + DNA Manual)  │                           │
│                               └─────────────────┘                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### White-Labeling Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         White-Label Support                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Church: Grace Community                                                     │
│  Subdomain: grace.dailydna.app                                              │
│                                                                              │
│  DNA Leader invites disciple → Invite email contains:                        │
│  • Link: https://grace.dailydna.app/invite?token=xxx                        │
│  • Branding: Grace Community logo (if configured)                           │
│  • Message: "John has invited you to join their DNA group"                  │
│                                                                              │
│  Database lookup:                                                            │
│  subdomain "grace" → churches.subdomain → church_id → group branding        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## User Journeys

### Journey 1: New Visitor

```
Landing Page ──► Email Subscribe ──► Receive DNA Manual (via Resend)
```

### Journey 2: Church Assessment

```
Landing Page ──► Start Assessment ──► Complete 4 Sections ──► Submit
                                                                  │
                 ┌────────────────────────────────────────────────┘
                 ▼
         Calculate Readiness Score
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
  Ready      Building     Exploring
  (12+)       (6-11)       (<6)
    │            │            │
    └────────────┼────────────┘
                 ▼
         Send "3 Steps" Email (tailored to level)
         Notify Admin
         Show Thank You Page
```

### Journey 3: Church Leader (Active)

```
Login ──► Magic Link Email ──► Verify ──► Dashboard
                                              │
                    ┌─────────────────────────┘
                    ▼
              View Phases & Milestones
                    │
              Complete Milestones
                    │
              Phase Auto-Advances
                    │
              Admin Notified (key milestones)
```

### Journey 4: Admin

```
Login ──► Dashboard ──► View All Churches
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
     Update Status      Upload Files      Add Notes
     (funnel stages)    (resources)       (milestones)
```

### Journey 5: DNA Leader (Groups Dashboard)

```
Login ──► Magic Link Email ──► Verify ──► DNA Groups Dashboard
                                                    │
                    ┌───────────────────────────────┘
                    ▼
              View My Groups
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
Create Group   Manage Disciples  View Engagement
    │               │               │
    ▼               ▼               ▼
Set start     Add/Remove      Real-time sync
date, name    disciples       from Daily DNA
    │               │               │
    ▼               ▼               ▼
Advance       Assign tools    Mark checkpoints
phases        (manual)        complete
```

### Journey 6: Disciple (Daily DNA App)

```
Receive Invite Email ──► Open Daily DNA App ──► Create Account (optional)
        │                                              │
        │ (Token-based for assessments)                │ (Email/password or OAuth)
        │                                              │
        └──────────────────┬───────────────────────────┘
                           ▼
                    Complete Week 1 Assessment
                           │
                           ▼
                    Daily Engagement Loop:
                    ┌─────────────────────────┐
                    │  • 3D Journal entry     │
                    │    (Head/Heart/Hands)   │
                    │  • 4D Prayer cards      │
                    │    (Revere/Reflect/     │
                    │     Request/Rest)       │
                    │  • Tool completions     │
                    └─────────────────────────┘
                           │
                           │ Week 8
                           ▼
                    Complete Week 8 Assessment
                           │
                           ▼
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
        Continue in             Promoted to
        new group               DNA Leader
                                    │
                                    ▼
                              DNA Training
                              (Flow Assessment)
```

## Security Model

### Authentication
- **No passwords** - Magic link only
- **Token expiry** - 7 days
- **Single use** - Tokens marked as used after verification
- **Secure cookies** - httpOnly, secure, sameSite='lax'

### Authorization
- **Session-based** - `getSession()` validates cookie
- **Role-based** - `isAdmin()` checks hardcoded email list
- **Church scoping** - Leaders can only access their church's data

### Data Protection
- **Row-Level Security** - Enabled on key Supabase tables
- **Service Role** - Server-side only, never exposed to client
- **File validation** - Size (10MB) and type restrictions

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Production Environment                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────┐      ┌───────────────┐                      │
│   │   Vercel      │      │   Supabase    │                      │
│   │   (Hosting)   │◄────►│   (Database)  │                      │
│   │               │      │               │                      │
│   │ - Next.js app │      │ - PostgreSQL  │                      │
│   │ - Edge funcs  │      │ - Row-level   │                      │
│   │ - CDN         │      │   security    │                      │
│   └───────────────┘      └───────────────┘                      │
│           │                                                      │
│           │                                                      │
│           ▼                                                      │
│   ┌───────────────┐                                             │
│   │    Resend     │                                             │
│   │   (Email)     │                                             │
│   │               │                                             │
│   │ - Magic links │                                             │
│   │ - Notifs      │                                             │
│   └───────────────┘                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Configuration

| Variable | Purpose | Exposure |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin database access | Server only |
| `RESEND_API_KEY` | Email sending | Server only |

## Key Design Decisions

### 1. Magic Link Authentication
**Why:** Reduces friction for non-technical church leaders. No password reset flows needed.

### 2. Server Components + Client Islands
**Why:** Better SEO, faster initial load. Interactive parts use `'use client'`.

### 3. Supabase over Firebase
**Why:** PostgreSQL for complex queries, built-in row-level security, SQL migrations.

### 4. Tailwind CSS
**Why:** Rapid styling, consistent design tokens, no CSS file management.

### 5. No External State Management
**Why:** App is form-heavy with page-scoped data. useState + useEffect suffices.

### 6. Template-based Phases/Milestones
**Why:** Standard curriculum across all churches. Progress is per-church overlay.

### 7. Shared Database for DNA Hub + Daily DNA
**Why:** Enables real-time sync between leader dashboard and disciple mobile app. Eliminates API integration complexity. Single source of truth for all discipleship data.

### 8. Dual Authentication Model
**Why:** Leaders need frictionless multi-device access (magic links). Disciples need persistent mobile login for daily engagement tracking (email/password or OAuth via Supabase Auth).

### 9. Hybrid Sync Strategy (Real-time + Batch)
**Why:** Tool completions need instant visibility for leaders. Analytics can be batched daily to reduce database load. Balances responsiveness with performance.

### 10. Co-Leader Permissions Model
**Why:** Co-leaders can manage disciples and checkpoints but cannot archive groups or invite additional co-leaders. Prevents accidental group deletion while enabling collaborative leadership.
