# DNA Hub Architecture

## System Overview

DNA Hub is a **church implementation tracking system** built on Next.js 16 with the App Router pattern. It manages churches through a structured 5-phase discipleship implementation program.

```
┌─────────────────────────────────────────────────────────────────┐
│                        DNA Hub System                           │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 16 + React 19)                               │
│  ├── Public Pages (Landing, Assessment)                         │
│  ├── Protected Pages (Dashboard, Admin)                         │
│  └── API Routes (Server-side)                                   │
├─────────────────────────────────────────────────────────────────┤
│  Backend Services                                                │
│  ├── Supabase (PostgreSQL + Auth tokens)                        │
│  └── Resend (Email delivery)                                    │
└─────────────────────────────────────────────────────────────────┘
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
