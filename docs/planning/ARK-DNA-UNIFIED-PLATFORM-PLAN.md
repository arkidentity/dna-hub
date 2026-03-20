# ARK + DNA Unified Platform Plan
**Handoff Document for Claude Code**
**Date:** March 2026

---

## Overview

Consolidate ARK Identity (arkidentity.com) and DNA Discipleship (dna.arkidentity.com) into a single Supabase instance with shared authentication. ARK Courses become a toggleable add-on inside the DNA church dashboard.

**Current State:**
- `arkidentity.com` — Rebuilt Next.js app on Vercel (ARK Courses, auth via its own Supabase project)
- `dna.arkidentity.com` — Next.js on Vercel (DNA Groups, church dashboard, its own Supabase project)
- `app.arkidentity.com` — Legacy vanilla JS PWA on DreamHost (gen-1 users, phasing out)

**Target State:**
- One Supabase project (DNA's instance becomes the master)
- Same login works across arkidentity.com and dna.arkidentity.com
- ARK Courses accessible inside DNA app via authenticated redirect (Tab 5)
- Churches toggle ARK Courses on/off per church from DNA admin

---

## Phase 1: Database Audit

**Goal:** Map both Supabase projects before touching anything.

### Tasks

1. **Export ARK Supabase schema**
   - List all tables, columns, foreign keys, RLS policies
   - Key tables expected: `users`, `course_progress`, `course_enrollments`, `courses`, `lessons`

2. **Export DNA Supabase schema**
   - Same audit
   - Key tables expected: `users`, `churches`, `dna_groups`, `group_members`, `prayer_wall`

3. **Identify overlaps**
   - `users` table will exist in both — this is the merge point
   - Document any column conflicts

4. **Deliverable:** A simple comparison doc listing which ARK tables need to be added to the DNA database vs. which already exist

---

## Phase 2: Database Migration

**Goal:** Move ARK tables into the DNA Supabase project. DNA Supabase becomes the single source of truth.

### Strategy

- **Keep DNA's `users` table** as the master auth table
- **Migrate ARK user records** — match on email, merge any profile fields that differ
- **Port ARK-specific tables** into DNA Supabase as-is:
  - `course_progress`
  - `course_enrollments`
  - Any lesson completion tracking tables
- **Add foreign keys** linking ARK tables to DNA's `users.id`

### RLS Policy Updates

After migration, update Row Level Security so:

| Role | Access |
|------|--------|
| Disciple | Own journal, prayer, course progress |
| DNA Group Leader | Own group's members' basic progress |
| Church Admin | All members in their church, course toggle settings |
| Super Admin (Travis) | Everything |

### New Column: `ark_courses_enabled`

Add to the `churches` table:

```sql
ALTER TABLE churches ADD COLUMN ark_courses_enabled BOOLEAN DEFAULT false;
```

This boolean controls whether Tab 5 appears in the DNA app for that church's members.

---

## Phase 3: Shared Auth Token Handoff

**Goal:** When a user taps Tab 5 in the DNA app, they land on arkidentity.com already logged in — no second login prompt.

### How It Works

1. User is authenticated in DNA app (Supabase session active)
2. User taps Tab 5 (ARK Courses)
3. DNA app calls Supabase to generate a short-lived signed token
4. DNA app redirects to: `https://arkidentity.com/courses?token=<signed_token>`
5. ARK app reads the token, verifies it against the shared Supabase project, creates a local session
6. User lands on courses page, already logged in

### Implementation Notes

- Use Supabase's `generateLink` or a custom Edge Function to mint the token
- Token TTL: 60 seconds (one-time use)
- If token is missing or expired, redirect to standard login — user logs in with same credentials (same Supabase, so it just works)
- This is the same pattern used by tools like Linear and Notion for cross-subdomain auth

### ARK App Changes Required

- Add token ingestion logic to `/courses` route
- On page load: check for `?token=` param → exchange for session → remove param from URL
- If no token: render normal login gate

---

## Phase 4: DNA App — Tab 5 Integration

**Goal:** Add ARK Courses as Tab 5 in the DNA mobile app, visible only when `ark_courses_enabled = true` for the user's church.

### Tab 5 Logic

```typescript
// Pseudocode
const church = await getChurch(user.church_id)

if (church.ark_courses_enabled) {
  // Show Tab 5: ARK Courses
  // On tap: generate signed token → redirect to arkidentity.com/courses?token=...
} else {
  // Tab 5 hidden
}
```

### Tab 5 UI

- Tab label: "Courses" (or "ARK Courses")
- Tab icon: book or graduation cap (match existing ARK icon design system)
- On tap: brief loading state while token is generated, then redirect
- Opens in: same browser tab (not iframe, not new tab)
- Back navigation: browser back button returns user to DNA app

### Why Not an iFrame

- Mobile Safari kills iframes aggressively
- Auth state does not carry into iframes without complex workarounds
- Full redirect with token handoff is cleaner and more reliable

---

## Phase 5: Church Admin Toggle

**Goal:** Travis (or church admins) can enable/disable ARK Courses per church from the DNA admin dashboard.

### DNA Admin UI Change

In the church settings panel, add:

```
[ ] Enable ARK Courses for this church
    Members will see a Courses tab in the DNA app linking to ARK Identity's
    full course library.
```

- Toggle updates `churches.ark_courses_enabled` in Supabase
- Change takes effect immediately (no rebuild required)
- Future: this becomes the foundation for paid add-on tiers

---

## Phase 6: Legacy App Migration (app.arkidentity.com)

**Goal:** Move gen-1 users from the old DreamHost app to the new unified system.

### Steps

1. Export user list from old Supabase project (email + any profile data)
2. For each user: check if email exists in DNA Supabase
   - If yes: merge course progress data into their existing record
   - If no: create new user record, import their data
3. Send migration email to gen-1 users:
   - "Your ARK account has moved to arkidentity.com. Log in with your same email."
4. Keep app.arkidentity.com live for 30 days post-migration, then redirect to arkidentity.com

---

## Environment Variables to Update

After migration, update `.env` in the ARK Next.js project:

```env
# Change these from ARK's Supabase project to DNA's Supabase project
NEXT_PUBLIC_SUPABASE_URL=<DNA_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<DNA_supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<DNA_service_role_key>
```

---

## Sequence Summary

| Phase | Task | Dependency |
|-------|------|------------|
| 1 | Audit both databases | Nothing — start here |
| 2 | Migrate ARK tables into DNA Supabase | Phase 1 complete |
| 3 | Build shared auth token handoff | Phase 2 complete |
| 4 | Add Tab 5 to DNA app | Phase 3 complete |
| 5 | Add church admin toggle | Phase 2 complete (can run parallel with 3-4) |
| 6 | Migrate gen-1 users from app.arkidentity.com | Phase 2 complete |

---

## What This Unlocks Later

- **Paid tiers:** `ark_courses_enabled` is the first feature flag. Add more toggles as you build (Prayer Wall, Church React, etc.)
- **ARK Courses in church dashboard:** Church admin can see their members' course completion directly in the DNA leader dashboard
- **Per-church course assignments:** Leader assigns a specific ARK course to their DNA group (e.g., "Everyone in our group does ID3 this month")
- **Cross-platform analytics:** One database means one place to see engagement across journaling, prayer, courses, and group activity

---

**Primary Supabase Instance (post-migration):** DNA Supabase project
**ARK App Repo:** arkidentity.com (Next.js, Vercel)
**DNA App Repo:** dna.arkidentity.com (Next.js, Vercel)
