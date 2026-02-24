# Architecture — DNA Hub + Daily DNA

---

## System Overview

```
┌─────────────────────┐         ┌─────────────────────┐
│     DNA Hub         │         │    Daily DNA         │
│  (Leader-facing)    │         │  (Disciple-facing)   │
│  Next.js + Tailwind │         │  Next.js PWA         │
│  dnadiscipleship.com│         │  [sub].dailydna.app  │
└────────┬────────────┘         └──────────┬──────────┘
         │                                 │
         │  Admin client (service role)    │  Anon client (user JWT)
         │  Bypasses RLS                   │  Subject to RLS
         └──────────────┬──────────────────┘
                        │
               ┌────────▼────────┐
               │    Supabase     │
               │  Auth + DB + RLS│
               └─────────────────┘
```

---

## Authentication Model

### DNA Hub (Leader)
- Session managed via Supabase Auth (email/magic link or SSO)
- All server-side API routes use **admin client** (`getSupabaseAdmin()`) — bypasses RLS
- Role check via `getUnifiedSession()` + `isAdmin()` / role field on session
- Roles: `admin`, `church_leader`, `dna_leader`, `trainer`

### Daily DNA (Disciple)
- Auth via `useAuth()` from `@/components/auth/AuthProvider`
- Uses **anon client** with user JWT for all data access
- RLS policies enforce row-level isolation by `church_subdomain` or `account_id`
- `disciple_app_accounts.id` = Supabase `auth.users.id` (FK)
- `role` column on `disciple_app_accounts` synced from `user_roles` via trigger (Migration 056)

### Admin Client vs. Anon Client
- Admin client: Hub API routes, seeding, any operation that needs to bypass RLS
- Anon client: required for RPCs that use `auth.jwt()` (e.g., `get_my_calendar_events`)
- Never use admin client for RLS-protected user queries — it bypasses all policies

---

## Data Flow Patterns

### Cloud Sync (Daily DNA → Supabase)
- **Push-only** on form submit — non-blocking (fire and forget)
- Upsert on natural key (e.g., `local_id`, `account_id + checkpoint_key`)
- Pull on app load — merges cloud data with localStorage
- Used by: journal, prayer, testimony, pathway checkpoints, assessments

### Disciple Profile (Hub)
- All disciple data fetched in **parallel** in one API route
- Route: `GET /api/groups/[id]/disciples/[discipleId]`
- Sections: profile + group status, pathway progress, life assessment, spiritual gifts, journal preview

### Calendar
| Context | Approach |
|---|---|
| Hub (leader) | Admin client, direct `.eq('group_id', ...)` query |
| Daily DNA (disciple) | Anon client + `get_my_calendar_events()` RPC (JWT-scoped) |
| Recurring edits | 3 scopes: `this`, `this_and_future`, `all` |

---

## Key Table Relationships

### Groups Feature
```
churches
  └── dna_leaders (church_id)
        └── dna_groups (leader_id, church_id)
              └── group_disciples (group_id, disciple_id)  ← current_status
              └── dna_calendar_events (group_id, church_id)
              └── co_leader_invitations (group_id)
```

### Disciple / Pathway
```
disciples (email natural key)
  └── disciple_app_accounts (id = auth.users.id, disciple_id FK)
        └── disciple_checkpoint_completions (account_id, checkpoint_key, week_number)
        └── disciple_journal_entries (account_id, local_id)
        └── disciple_prayer_cards (account_id, local_id)
        └── life_assessment_responses (account_id)
        └── spiritual_gifts_responses (account_id)
```

### Branding / White-label
```
churches (subdomain, primary_color, accent_color, logo_url, icon_url, splash_logo_url, contact_email)
  └── church_branding_settings (church_id, app_title, header_style, reading_plan_id)
  └── church_demo_settings (church_id, demo_enabled, demo_user_id, video_url, default_temp, coach_name)
```

### Cohort
```
churches
  └── cohorts (church_id, get_or_create_church_cohort())
        └── cohort_memberships (cohort_id, leader_id, role: trainer|member)
        └── cohort_posts (cohort_id, author_id)
        └── cohort_discussion_replies (post_id, author_id)
        └── dna_calendar_events (cohort_id)
```

---

## Multi-tenant / White-label Architecture

Each church gets a subdomain (`[church].dailydna.app`) served by the same Daily DNA Next.js app.

**Request flow:**
1. Request hits Daily DNA edge
2. Middleware extracts subdomain from `Host` header
3. Calls `get_church_branding_by_subdomain(subdomain)` RPC
4. Injects CSS variables (`--primary-color`, `--accent-color`, etc.) into the root layout
5. Branding stored in cookie for client-side access (zero extra fetches)

**Key RPC:** `get_church_branding_by_subdomain(subdomain TEXT)` — returns all theming fields. Must include ALL columns across all migrations (see GOTCHAS.md).

**CSS variable pattern:**
```css
:root {
  --primary-color: [from DB];
  --accent-color: [from DB];
  --surface-card: color-mix(in srgb, var(--primary-color) 6%, white);
  --surface-input: color-mix(in srgb, var(--primary-color) 4%, white);
  --surface-border: color-mix(in srgb, var(--primary-color) 12%, white);
}
```

---

## Admin Access Patterns

### Cohort Write Access (Admin)
Admins don't have a `dna_leaders` row for arbitrary churches. Pattern to bypass:
- POST body includes `cohort_id` — route skips membership check
- Author FK satisfied by borrowing first trainer's `leader_id`
- Displayed name is always "DNA Coach"

### Disciple Soft-Remove
`current_status = 'dropped'` on `group_disciples` row. All logs, progress, and assessment history preserved.

---

## Email / Notifications
- Provider: **Resend**
- No Google Calendar API — Supabase is source of truth
- `.ics` attachments for calendar invites (planned)
- Email templates: co-leader invite (new user), co-leader invite (existing), general notifications

---

## PDF Generation
- Client-side only via `@react-pdf/renderer`
- Never stored in Supabase Storage — generated on-demand in the browser
- Used by: Life Assessment (disciple), Spiritual Gifts (disciple)
- Leader views pull live data from Supabase instead
