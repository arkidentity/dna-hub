# DNA Hub + Daily DNA — Next Steps

**Last Updated:** February 18, 2026

---

## Quick Summary

| Priority | Key Items |
|----------|-----------|
| **Done (Feb 12)** | Groups calendar, Global Resources Admin UI, Cohort in nav, Testimony Builder cloud sync, Bug fixes |
| **Done (Feb 18)** | White-label branding (Migrations 051-060), Pathway sync support (055), Leader role in Daily DNA (056), RLS security hardening (058-060), DNA Cohort module live (Migration 061) |
| **This Week** | Passage of the Day content expansion, Calendar email reminders |
| **Next Week** | Calendar email reminders (Resend + .ics), Training↔Groups bridge |
| **Post-Launch** | Cloud sync (remaining tools), Multiplication tracking, Groups polish, White label Phase 3 |

---

## ✅ Completed (Feb 2026)

### Calendar — FULLY COMPLETE ✅ (Feb 12, 2026)

**Database:**
- ✅ Migration 046: `dna_calendar_events` table + RLS policies
- ✅ Migration 048: `get_my_calendar_events()` RPC (instances-only filter, ambiguous column fix)
- ✅ Migration 049: Co-leader invitations (`co_leader_invitations` table, `pending_co_leader_id` on `dna_groups`)

**DNA Hub (leader-facing):**
- ✅ `POST /api/calendar/events` — create single or recurring events (weekly/biweekly/monthly), generates instances upfront
- ✅ `GET /api/calendar/events?group_id=X` — group-scoped fetch (admin client, bypasses JWT)
- ✅ `PATCH /api/calendar/events/[id]` — edit event, scope: `this` / `this_and_future` / `all`
- ✅ `DELETE /api/calendar/events/[id]?scope=X` — delete with same three scopes
- ✅ `EventModal` — create meetings from group detail page (recurring support, double-submit guard)
- ✅ `GroupMeetings` component — scheduled meetings card on group detail page
  - Lists upcoming 90-day window, 5 shown + expand button
  - Edit modal with scope selector for recurring events
  - Delete confirmation with 3-option scope for recurring events
  - Teal color theme (DNA brand)
- ✅ Group detail page layout: Phase Progress → Disciples → Scheduled Meetings

**Daily DNA (disciple-facing):**
- ✅ `UpcomingEvents` component on groups page (next 5 events, 30-day window)
- ✅ Full calendar page at `/groups/calendar` (90-day, month grid, click-to-filter)
- ✅ Uses `get_my_calendar_events()` RPC via Supabase anon client (JWT-scoped per disciple)

**Bug fixes:**
- ✅ Recurring event first-occurrence duplication — `end_date` timezone fix (`T23:59:59` append)
- ✅ Double-submit guard on EventModal (`useRef` flag)
- ✅ Group not found error — separated DB error from 404, surfaced real error message
- ✅ Migration 049 applied (fixed `pending_co_leader_id` missing column causing group load failure)

**Remaining calendar work:**
- ⬜ Email reminders (24hr before via Resend + .ics attachment)
- ⬜ Cron job for reminder scheduling
- ⬜ "Add to Calendar" .ics download button on event detail

---

### Global Resources Admin UI — FULLY COMPLETE ✅ (Feb 12, 2026)

**Database:**
- ✅ `global_resources` table with seed records
- ✅ `milestone_resources` junction table (links resources to `template_milestones`)

**DNA Hub (admin-facing):**
- ✅ `GET /api/admin/resources` — fetch all resources (admin only)
- ✅ `POST /api/admin/resources` — create resource with validation
- ✅ `PUT /api/admin/resources/[id]` — update resource properties
- ✅ `DELETE /api/admin/resources/[id]` — delete resource + clean up Storage
- ✅ `POST /api/admin/resources/upload` — PDF upload to Supabase Storage (`global-resources` bucket), 10MB max
- ✅ `ResourcesTab` component — full CRUD UI integrated into `/admin` dashboard
  - Stats cards (totals, active count, type breakdown)
  - Add/edit modal with file upload, type selection, category, display order, active toggle
  - Delete confirmation + Storage cleanup
  - View, edit, delete, toggle visibility actions

---

### Navigation — Cohort in My Dashboards Dropdown ✅ (Feb 12, 2026)
- ✅ `UserMenu.tsx` — Cohort added to dropdown for `dna_leader` + `church_leader`
- Order: Church (church leaders only) → Groups → Cohort → Training

---

### DNA Groups Bug Fixes ✅ (Feb 11, 2026)
- ✅ Fixed group creation bug
- ✅ 6-disciple max limit enforced

---

### Life Assessment — FULLY COMPLETE ✅ (Feb 10, 2026)
- ✅ Supabase sync: `/dna-app/daily-dna/lib/assessmentSync.ts`
- ✅ PDF generation: `/dna-app/daily-dna/lib/assessmentPdf.tsx`
- ✅ Inline leader card on disciple profile (W1/W12 scores, reflection answers)

---

### Spiritual Gifts Assessment — FULLY COMPLETE ✅ (Feb 9, 2026)
- ✅ 96-question assessment, scoring, results, synopses
- ✅ 2-page PDF (client-side via @react-pdf/renderer)
- ✅ Cloud sync to Supabase
- ✅ Auth gate at `/gifts`
- ✅ Pastor landing page at `/ministry-gift-test`
- ✅ Migration 044: `spiritual_gifts_leader_inquiries`

---

## ✅ Completed (Feb 13–18, 2026)

### White-Label Branding System — COMPLETE ✅

**Database:**
- ✅ Migration 051: `church_branding` table (logo, colors, custom domain, header_style)
- ✅ Migration 052: `header_style` column added to branding
- ✅ Migration 053: Spiritual gifts inquiry linked to church
- ✅ Migration 054: `church_id` added to spiritual gifts data
- ✅ Migration 059: `get_church_branding_by_subdomain()` RPC (fixed grants + all columns)
- ✅ Migration 060: Branding RPC + RLS performance fixes

**Phase 1 (Middleware + subdomain detection):** Complete
- ✅ Next.js middleware for subdomain detection
- ✅ Dynamic theme injection from Supabase branding data

### Pathway Sync Support — COMPLETE ✅ (Migration 055)
- ✅ `checkpoint_key` string field on `disciple_checkpoint_completions`
- ✅ `week_number` field for leader visibility in disciple profile
- ✅ Upsert-by-key pattern (no integer FK needed from Daily DNA app)

### Leader Role in Daily DNA — COMPLETE ✅ (Migration 056)
- ✅ `role` column on `disciple_app_accounts` (dna_leader / church_leader / admin)
- ✅ Backfill + trigger to keep in sync with `user_roles`
- ✅ Leaders get Pathway months 2 & 3 automatically unlocked in Daily DNA

### RLS Security Hardening — COMPLETE ✅ (Migrations 057–060)
- ✅ Migration 057: Fixed recurring event duplication (RLS + timezone bug)
- ✅ Migration 058: Enabled RLS on tables missing policies
- ✅ Migration 059/060: Fixed `search_path`, permissive policies, RLS performance
- ✅ All Supabase linter ERROR-level findings resolved

### White Label Phase 2 — Hub Branding Admin UI — COMPLETE ✅ (Feb 18, 2026)
- ✅ `BrandingTab` component — church selector, logo upload, color pickers, live phone preview
- ✅ `header_style` toggle (Text Title vs Church Logo)
- ✅ `GET/POST /api/admin/branding` — fetch + save per church
- ✅ `POST /api/admin/branding/upload-logo` — logo upload to Supabase Storage (`church-logos` bucket)

---

### DNA Cohort Module — LIVE ✅ (Feb 18, 2026)

**Database (Migration 061):**
- ✅ `cohort_exempt` flag on `dna_cohort_members` — church leader can exclude a leader
- ✅ `get_or_create_church_cohort()` — finds or creates an active cohort per church
- ✅ `add_leader_to_cohort()` — safe insert with conflict guard
- ✅ `trg_auto_add_leader_to_cohort` trigger — auto-enrolls new dna_leaders on insert/update of `church_id`
- ✅ Backfill: all existing dna_leaders enrolled; church_leaders auto-assigned as 'trainer'
- ✅ Cohort events use existing `dna_calendar_events` table (`event_type = 'cohort_event'`) — appear in Daily DNA app calendar automatically via `get_my_calendar_events()` RPC

**Database (Migration 062):**
- ✅ All `church_leaders` (not just primary contact) promoted to trainer by email match
- ✅ Trigger updated: new dna_leaders who are also church_leaders auto-enrolled as trainer

**DNA Hub API:**
- ✅ `GET /api/cohort` — auth for `dna_leader` + `church_leader` + admin; live data with mock fallback; `cohort_exempt` filter; events from `dna_calendar_events`
- ✅ `GET /api/cohort?churchId=<uuid>` — admin-only bypass; fetches cohort directly by church (no membership required)
- ✅ `POST /api/cohort/posts` — trainer-only; creates announcements/updates/resources with pin support
- ✅ `POST /api/cohort/discussion` — any cohort member; creates top-level discussion posts
- ✅ `PATCH /api/cohort/members/[id]` — trainer-only; promote/demote member between `trainer` and `leader` role

**DNA Hub Pages:**
- ✅ Feed page — "+ New Post" modal (trainer only, hidden in mock mode): post type, title, body, pin toggle
- ✅ Calendar page — "+ Add Event" modal (trainer only, hidden in mock mode): title, date, time, duration, location, description
- ✅ Discussion page — compose form wired to real API; disabled in mock mode
- ✅ Members page — promote/demote toggle visible to trainers; optimistic UI update

**Admin Church Detail (`/admin/church/[id]`):**
- ✅ Cohort tab added — `AdminCohortTab` component with sub-tabs: Feed, Discussion, Members, Events
- ✅ Read-only view of any church's cohort; no membership required for admin
- ✅ Coach/admin workflow: Admin panel → click church → Cohort tab to observe live cohort activity

---

## 🔴 This Week (Week of Feb 18)

### 1. Passage of the Day — Content Expansion

**Status:** 100 passages exist, need 265+ more for full year variety
**File:** `/dna-app/daily-dna/lib/passageOfTheDay.ts`
**Priority:** Important for daily engagement, not a launch blocker

---

### 2. White Label Phase 2 — Hub Branding Admin UI — ✅ COMPLETE (Feb 18, 2026)

**Status:** Complete
**What was built:**
- ✅ `BrandingTab` component in `/admin` dashboard (church selector, logo upload, color pickers, live phone preview)
- ✅ `header_style` toggle (Text Title vs Church Logo) — shown only when a logo is uploaded
- ✅ `GET/POST /api/admin/branding` — fetch + save branding per church
- ✅ `POST /api/admin/branding/upload-logo` — logo upload to Supabase Storage (`church-logos` bucket)

---

### 3. Testimony Builder Cloud Sync — ✅ COMPLETE (Feb 12, 2026)

**Status:** Complete
**Priority:** High — highest-value tool after journal

**What was built:**
- ✅ Migration 050: `upsert_testimony` RPC function
- ✅ `testimonySync.ts` — full two-way sync (push/pull/dedup)
- ✅ Storage helpers in `testimonyStorage.ts` — cloud metadata, deleted log, last sync time
- ✅ `CloudTestimonyEntry` and `SyncResult` types added to `testimony.ts`
- ✅ Follows journal sync pattern exactly (upsert on natural key, soft deletes, incremental sync)

**Files:**
- Sync logic: `/dna-app/daily-dna/lib/testimonySync.ts`
- Storage helpers: `/dna-app/daily-dna/lib/testimonyStorage.ts`
- Types: `/dna-app/daily-dna/types/testimony.ts`
- Migration: `/database/050_upsert_testimony.sql`

**Next:** Apply migration in Supabase SQL Editor, then integrate sync calls in Testimony Builder UI

---

## 🟡 Next Week (Week of Feb 23)

### 4. Calendar Email Reminders

**Status:** Calendar built, reminders not started
**Priority:** Medium — improves disciple attendance

**What to build:**
- Resend email 24hr before each meeting
- .ics attachment ("Add to Calendar")
- Cron job or Supabase Edge Function to check upcoming events
- Unsubscribe link in email footer

---

### 5. Pathway Locking System — ⏸ DEFERRED (no Phase 2/3 content yet)

**Status:** Deferred — Phase 2 and Phase 3 content does not exist yet, so there's nothing to lock/unlock
**Decision:** Phase 1, Month 1 is always available to all users. Phases 2 & 3 remain permanently locked UI until content is created.

**When content is ready:**
- Unlock by phase/month — leader activates phases, not individual tools
- Leaders (`dna_leader`/`church_leader` role in `disciple_app_accounts`) get months 2 & 3 auto-unlocked (Migration 056 already in place)
- Always available (no group required): Creed Cards, Spiritual Gifts Test, Testimony Builder
- Group membership gate (lock entire Pathway unless in a DNA group) can be revisited then

---

### 6. Training ↔ Groups Bridge

**Status:** Not started
**Priority:** Medium-High

**Approach:**
1. Add "Training Quick Access" panel on Groups dashboard
2. Show Launch Guide progress + link
3. Surface relevant training content based on group phase/week

---

## 🟢 Week 3+ (Week of Mar 2)

### 7. Groups Testing & Design Polish

**Status:** ~90% built, needs real-group testing
**Priority:** High for launch readiness

**What exists:** Group dashboard, create group, group detail, disciple profiles, discipleship log, co-leader system, phase advancement, scheduled meetings (create/edit/delete), add disciples

**What needs work:**
- Disciple status change UI (active/completed/dropped)
- Design polish based on real usage
- Checkpoint approval workflow (data structure ready, no UI)

---

## 🔵 Post-Launch

| Item | Priority | Notes |
|------|----------|-------|
| **Pathway Phase 2 & 3 content + locking** | **High** | Deferred until content exists. Schema (Migrations 055/056) already in place. |
| Calendar — "Add to Calendar" .ics button | Medium | Per-event download |
| Cloud sync — Q&A, Listening Prayer, Pathway progress | Medium | Extend journal sync pattern |
| White label Phase 3 — Church selector in Daily DNA | Medium | Profile settings page |
| Groups Chat Phase 2 (images/GIFs) | Low | Can wait |
| Context-aware training (smart content by week/stage) | Medium | Iterative enhancement |
| DNA Groups Phases B-D (Journey View, Multiplication) | Medium | Some built, some pending |
| Engagement analytics | Low | Revisit at scale |

---

## Cleanup Tasks (When Ready)

### Delete Old Auth Code
- Delete `/src/lib/training-auth.ts`
- Remove deprecated auth routes

### Drop Old Database Tables
```sql
DROP TABLE IF EXISTS dna_leader_journeys CASCADE;
DROP TABLE IF EXISTS dna_content_unlocks CASCADE;
DROP TABLE IF EXISTS dna_flow_assessments CASCADE;
DROP TABLE IF EXISTS training_magic_links CASCADE;
DROP TABLE IF EXISTS milestones_deprecated CASCADE;
```

---

## Roadmap Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ ROADMAP 1: Church Implementation Dashboard                      │
│ Status: Production ✅                                           │
│ Global Resources Admin UI: ✅ COMPLETE                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ROADMAP 2: DNA Groups Dashboard                                 │
│ Status: Phase A ~95% ✅ | Pathway Lock + email reminders left  │
│ Calendar: ✅ COMPLETE (create/edit/delete, Hub + App)           │
│ Next: Email reminders, Pathway Lock, Groups polish              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ROADMAP 3: DNA Training Platform                                │
│ Status: Flow Assessment + Manual + Launch Guide ✅              │
│ Next: Bridge to Groups dashboard, context-aware content         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ROADMAP 4: DNA Cohort                                           │
│ Status: LIVE ✅ (Migration 061 + all Hub pages + APIs)         │
│ Purpose: Permanent leader peer community (church-scoped)        │
│ Hub: Feed ✅, Discussion ✅, Members ✅, Calendar ✅           │
│ Auto-enrollment trigger ✅ | Cohort events → App calendar ✅   │
│ See: docs/planning/DNA-COHORT-PLAN.md                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ DAILY DNA APP                                                    │
│ Status: MVP Feature-Complete ✅ | Live at dailydna.app          │
│ Calendar: ✅ COMPLETE (upcoming widget + full calendar page)    │
│ Next: Pathway locking, Testimony cloud sync, Passage content    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deprioritized / Not Needed

| Item | Reason |
|------|--------|
| Full tool assignment system (lock/unlock per tool) | Replaced by simpler phase-locking by month |
| Leader notes feature in Daily DNA | Group chat covers this |
| Google Calendar API integration | Using Supabase + Resend + .ics instead |
| Engagement analytics batch job | Not needed at current scale |
| DNA Training Phases 4-7 | Phases 1-3 (Assessment + Manual + Launch Guide) sufficient |
| Fireflies.ai sync | Not working, luxury feature |
| Automated tests | Revisit when team grows |
| Push notifications (PWA) | Unreliable on iOS — using email + in-app badges instead |

---

## Related Documentation

### Active Planning (`docs/planning/`)
| Document | Purpose |
|----------|---------|
| `DNA-COHORT-PLAN.md` | DNA Cohort full architecture (post-launch) |
| `DNA-GROUPS-COMPLETE-PLAN.md` | DNA Groups implementation spec |
| `DNA-TRAINING-IMPLEMENTATION-PLAN.md` | Training platform roadmap |

### Technical Reference (`docs/technical/`)
| Document | Purpose |
|----------|---------|
| `CHANGELOG.md` | Version history |
| `DATA_MODELS.md` | Full database table reference + ER diagrams |

### Cross-Project (`dna-planning/`)
| Document | Purpose |
|----------|---------|
| `README.md` | Ecosystem overview + current status |
| `INTEGRATION-PLAN.md` | Hub ↔ Daily DNA integration decisions |
| `DATABASE-SCHEMA.md` | Unified schema documentation |
| `resources/` | Research docs: Spiritual Gifts, PBJ, toolkits, assessments |

### Working Reference
| Document | Purpose |
|----------|---------|
| `.claude/CLAUDE.md` | Auto-loaded project guide (stack, auth, conventions, API routes) |
| `MEMORY.md` | Session continuity (patterns, gotchas, next up) |
