# DNA Hub + Daily DNA — Next Steps

**Last Updated:** February 10, 2026

---

## Quick Summary

| Priority | Key Items |
|----------|-----------|
| **This Week** | ~~Spiritual Gifts Assessment~~ ✅, ~~Gifts PDF~~ ✅, ~~Cloud Sync~~ ✅, ~~/gifts auth gate~~ ✅, ~~Pastor landing page~~ ✅, Passage of the Day content |
| **Next Week** | ~~Life Assessment Supabase sync~~ ✅, ~~Life Assessment PDF (disciple)~~ ✅, ~~Life Assessment inline card (leader view)~~ ✅, Global Resources Admin, Groups Calendar |
| **Week 3** | Pathway locking, Cloud sync (Testimony), Training↔Groups bridge, Groups polish |
| **Post-Launch** | DNA Cohort, Cloud sync (remaining tools), Groups Chat images, Multiplication tracking |

---

## 🔴 This Week (Week of Feb 9)

### 1. Spiritual Gifts Assessment — FULLY COMPLETE ✅

**Status:** COMPLETE (Feb 9, 2026) — Assessment, PDF, Cloud Sync, Auth Gate, Landing Page all deployed
**Priority:** ✅ DONE

**What was built (Daily DNA app):**
- ✅ Types: `/dna-app/daily-dna/types/spiritualGifts.ts`
- ✅ 96 questions data: `/dna-app/daily-dna/lib/spiritualGiftsData.ts`
- ✅ localStorage storage + scoring: `/dna-app/daily-dna/lib/spiritualGiftsStorage.ts`
- ✅ 25 synopses + bridge sentences: `/dna-app/daily-dna/lib/spiritualGiftsSynopses.ts`
- ✅ Shared component: `/dna-app/daily-dna/components/gifts/SpiritualGiftsAssessment.tsx`
- ✅ 2-page PDF generation: `/dna-app/daily-dna/lib/spiritualGiftsPdf.tsx` (client-side via @react-pdf/renderer)
- ✅ Cloud sync: `/dna-app/daily-dna/lib/spiritualGiftsSync.ts` (syncs to Supabase on submit + load)
- ✅ In-app route: `/app/tools/spiritual-gifts/page.tsx` (for disciples in 90-day toolkit Week 11)
- ✅ Public route: `/app/gifts/page.tsx` (requires account creation — auth gate added Feb 9)

**What was built (DNA Hub):**
- ✅ Pastor landing page: `/ministry-gift-test` (StoryBrand conversion framework, Feb 9)
- ✅ Lead capture form: `/components/spiritual-gifts/SpiritualGiftsLeaderForm.tsx`
- ✅ API endpoint: `/api/spiritual-gifts/leader-inquiry/route.ts` (Resend emails)
- ✅ Database table: Migration 044 (`spiritual_gifts_leader_inquiries`)
- ✅ "Try it yourself" CTA in success message + confirmation email
- ✅ Updated site header: DNA logo + "Discipleship" (navy background)

**Architecture:**
- One question at a time with progress bar + tier intro banners
- Scoring: Likert 1-5 direct, Multiple choice a=5, b=3, c=2, d=1
- Results: Top 6 gifts overview → Per-tier cards with primary/secondary, synopses, bridge sentences, "how to grow", expandable full scores
- Shared `SpiritualGiftsAssessment` component with `isPublic` prop (two wrappers)
- Questions shuffled within each tier but tiers stay in order (1→2→3)
- Cloud sync: localStorage → Supabase on submit, Supabase → localStorage on load

**Remaining tasks (optional enhancements):**
- Write remaining bridge sentences — need to decide on approach first (directional = 600 combos, non-directional = 300). Generic fallback works for now. Revisit with a simpler strategy (e.g. per-gift "how I work with others" blurbs instead of pair-specific sentences).

**Lead Gen Strategy (implemented Feb 9):**
- Individual users must create an account to take the Spiritual Gifts test (auth gate at `/gifts`)
- Pastor landing page at `/ministry-gift-test` captures: name, email, church name, church size
- Confirmation email includes "Try it yourself" CTA linking to `/gifts`
- Lead gen funnel targets pastors/church leaders via a dedicated landing page on Hub
- Pastor landing page offers: "Use this Spiritual Gifts Assessment for your entire team"
- Captures: name, email, church name, church size → Supabase + Resend follow-up sequence
- This is separate from the `/gifts` route in Daily DNA

---

### 2. Passage of the Day — Content Expansion

**Status:** 100 passages exist, need 265+ more for full year variety
**File:** `/dna-app/daily-dna/lib/passageOfTheDay.ts`
**Priority:** Important for daily engagement, not a launch blocker

---

## 🟡 Next Week (Week of Feb 16)

### 3. Life Assessment — FULLY COMPLETE ✅

**Status:** COMPLETE (Feb 10, 2026)
**Priority:** ✅ DONE

**What was built (Daily DNA app):**
- ✅ Supabase sync: `/dna-app/daily-dna/lib/assessmentSync.ts` — push-only, upserts on `(account_id, assessment_type)`, triggered on submit
- ✅ PDF generation: `/dna-app/daily-dna/lib/assessmentPdf.tsx` — client-side via @react-pdf/renderer, W1/W12 scores + growth comparison + reflection answers
- ✅ PDF download button on Results and Comparison views in `/app/tools/life-assessment/page.tsx`

**What was built (DNA Hub):**
- ✅ Life Assessment inline card on disciple profile — sits between Pathway and Creed/Testimonies
- ✅ Shows 7 scored categories with W1/W12 score bars + delta pills
- ✅ Shows reflection answers (Q40-42) — always visible to leader
- ✅ API route updated to fetch from `life_assessment_responses` table
- ✅ `LifeAssessmentResult` type added to `/src/lib/types.ts`

**Architecture decisions:**
- No assessments tab — results displayed inline as a card in the existing scroll layout (simpler, no nav change needed)
- No PDF storage — disciple generates on-demand from localStorage (no storage costs at scale)
- Leader view pulls live from Supabase `life_assessment_responses` — always current, no files

**Bug fix completed (Feb 8):** ✅ All "Week 8" references changed to "Week 12"
- **Still needed:** Database `life_assessments` table `assessment_week` column (values 1 and 8 → 1 and 12) — run migration to update existing rows

---

### 5. Global Resources Admin UI

**Status:** Database ready, no admin interface
**Priority:** High — needed for church implementation launch

**What exists:**
- `global_resources` table with 4 seed records (1 active, 3 placeholders)
- `milestone_resources` junction table linking resources to template milestones
- Dashboard API already displays resources on milestones

**What to build:**
- Admin page for resource management (CRUD)
- File upload to Supabase Storage
- Link/unlink resources to template milestones
- Delete outdated resources
- Bulk operations

**API endpoints needed:**
- `GET /api/admin/resources` — List all
- `POST /api/admin/resources` — Create
- `PUT /api/admin/resources/[id]` — Edit
- `DELETE /api/admin/resources/[id]` — Delete
- `POST /api/admin/resources/[id]/link` — Link to milestone
- `DELETE /api/admin/resources/[id]/unlink` — Unlink

---

### 6. Groups Calendar (DNA Calendar)

**Status:** Not started — architecture decided
**Priority:** High — must work before first DNA groups launch

**Architecture decisions (Feb 8, 2026):**
- **Supabase is the source of truth** — all events stored in `dna_calendar_events`
- **No Google Calendar API needed** — email reminders via Resend + .ics "Add to Calendar" links
- **One unified calendar per user** — aggregates all groups + church events
- **Scoped by role:** disciples see group meetings; leaders see group meetings + church events
- **Leaders create events in Hub** — disciples see them in Daily DNA app
- **No attendance tracking** — groups of 4, leader knows who's there

**Database table:** `dna_calendar_events`
- `id`, `title`, `description`, `start_time`, `end_time`, `location`
- `recurrence` (none/weekly/biweekly/monthly)
- `event_type` (group_meeting/church_event/system_event)
- `group_id` (nullable), `church_id` (nullable)
- `audience` (all/leaders/disciples/group_members)
- `created_by`

**Build tasks:**
1. Database migration + RLS policies (~0.5 day)
2. API endpoints CRUD + filtered GET by role (~0.5 day)
3. Hub: "Schedule/Create Event" form (~0.5 day)
4. Hub: Admin event list view (master calendar) (~0.5 day)
5. App: "Upcoming" section below groups list (~0.5 day)
6. Resend email reminder + .ics attachment (~0.5 day)

**UI in Daily DNA app:** "Upcoming" section sits below groups list on the groups screen. Shows next 3-5 events across all groups + church events. "See full calendar →" link for full list view.

**Who can create events:**
- DNA Leader → their own groups (Hub → Group page → "Schedule Meeting")
- Church Admin → all leaders at their church (Hub → Church Dashboard)
- ARK Admin → anyone, scoped by church or system-wide (Hub → Admin)
- Disciples → read-only

---

### 7. Cloud Sync — Testimony Builder

**Status:** Not started (journal sync is done and serves as reference pattern)
**Priority:** High — highest-value tools after journal

**Reference implementation:** `/dna-app/daily-dna/lib/journalSync.ts`
**Tools to sync:** Testimony Builder (Life Assessment sync is ✅ complete — see item 3 above)

---

## 🟢 Week 3 (Week of Feb 23)

### 8. Pathway Locking System

**Status:** Not started — architecture decided
**Priority:** High — controls disciple access to discipleship content

**Decisions (Feb 8, 2026):**
- **Pathway (90-day toolkit phases 1-3) is LOCKED** unless disciple is in a DNA group
- **Unlock by phase/month** — leader activates phases, not individual tools
- **Always available to everyone** (no group required):
  - Creed Cards
  - Spiritual Gifts Test
  - Testimony Builder
- **No "leader notes" feature needed** — group chat covers leader-disciple communication

---

### 9. Training ↔ Groups Bridge

**Status:** Not started — concept decided
**Priority:** Medium-High — leader experience quality

**Decisions (Feb 8, 2026):**
- Training and Groups should be more connected
- DNA leaders need easy access to training (especially Launch Guide) from within their group dashboard
- 90-Day Toolkit belongs in Groups experience, not Training — leaders experience it first as disciples
- System should surface relevant training content based on what stage/week the leader is in
- Start simple: links + context badges. Iterate toward smart content later.

**Implementation approach:**
1. Add "Training Quick Access" sidebar/panel on Groups dashboard
2. Show Launch Guide progress and link
3. Surface relevant training content based on group phase/week
4. Full context-aware "smart content" system is iterative (post-launch enhancement)

---

### 10. Groups Testing & Design Polish

**Status:** ~85% built, needs testing with real groups
**Priority:** High for launch readiness

**What exists (built):**
- Group dashboard, create group, group detail page
- Disciple profiles with Daily DNA activity metrics
- Discipleship log (notes, prayers, milestones + answer tracking)
- Co-leader system (assign/remove, role-based access)
- Phase advancement stepper (5 phases, one-click advance)
- Add disciples (name, email, phone)

**What needs work:**
- Disciple status change UI (active/completed/dropped)
- Design polish based on real usage
- Test with multiple groups and profiles
- Checkpoint approval workflow (data structure ready, no UI)

---

## 🔵 Post-Launch

| Item | Priority | Notes |
|------|----------|-------|
| **DNA Cohort** | **High** | **Permanent leader peer community — see `DNA-COHORT-PLAN.md`** |
| Cloud sync — Q&A, Listening Prayer, Pathway | Medium | Extend journal sync pattern |
| Groups Chat Phase 2 (images/GIFs) | Low | Can wait |
| Context-aware training (smart content by week/stage) | Medium | Iterative enhancement |
| DNA Groups Phases B-D (Journey View, Multiplication) | Medium | Some built, some pending |
| Automated tests (app-side priority) | Low | Revisit when team grows |
| Engagement analytics batch job | Low | Skip for now, revisit at scale |
| Fireflies.ai integration | Low | Not working, luxury feature |

---

## ✅ Completed

### Recently Completed (Feb 2026)
- ✅ **Life Assessment — FULLY COMPLETE** (Feb 10, 2026) — Supabase sync + disciple PDF + inline leader view card on disciple profile
- ✅ **Spiritual Gifts Assessment — FULLY COMPLETE** (Feb 9, 2026) — Core build + 2-page PDF + cloud sync + auth gate + pastor landing page all deployed
  - ✅ Cloud sync to Supabase (assessment + responses)
  - ✅ Auth gate at `/gifts` route (requires account creation)
  - ✅ Pastor landing page at `/ministry-gift-test` (StoryBrand conversion framework)
  - ✅ Lead capture form with Resend email automation
  - ✅ "Try it yourself" CTA in success message + confirmation email
  - ✅ Migration 044: `spiritual_gifts_leader_inquiries` table
  - ✅ Site-wide header update: DNA logo + "Discipleship" (navy background)
- ✅ **Leader Group Chat Fix** (Feb 9, 2026) — Migration 043: Fixed `get_my_group_ids()` to include leaders
- ✅ Groups & Chat Phase 1 (real-time group chat with shared content)
- ✅ Account syncing from Daily DNA to Hub
- ✅ DNA Training — DNA Manual (6 sessions, 21 lessons, fully extracted)
- ✅ DNA Training — Launch Guide (4 phases, fully extracted)
- ✅ Hub API endpoints for Daily DNA (disciple profile, discipleship log, dashboard, co-leaders, phase advancement)
- ✅ Google OAuth verification submitted
- ✅ Group Chat migration (035) deployed

### Previously Completed
- ✅ Template-Based Milestone System (Migration 032)
- ✅ Unified Authentication System (Migrations 025 & 026)
- ✅ DNA Groups Phase 1 (schema, invitations, group/disciple management)
- ✅ DNA Training Phase 1 (Flow Assessment)
- ✅ Daily DNA App — All core tools (Journal, Prayer, Creed Cards, Pathway, Assessment, Testimony, Q&A, Listening Prayer)
- ✅ Daily DNA → Hub Supabase migration
- ✅ Improvement Plan P0-P2

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
│ Next: Assessment PDF, Global Resources Admin UI                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ROADMAP 2: DNA Groups Dashboard                                 │
│ Status: Phase A ~90% ✅ | Calendar + Pathway Lock needed        │
│ Next: Calendar, Pathway Lock, Groups polish                     │
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
│ Status: Planned — not yet built                                 │
│ Purpose: Permanent leader peer community (church-scoped)        │
│ Hub: Feed, Discussion, Members, Calendar (new nav section)      │
│ App: Cohort card in Groups tab (window into Hub)                │
│ See: docs/planning/DNA-COHORT-PLAN.md                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ DAILY DNA APP                                                    │
│ Status: MVP Feature-Complete ✅ | Live at dailydna.app          │
│ Spiritual Gifts: BUILT ✅ (/tools/spiritual-gifts + /gifts)    │
│ Gifts PDF: BUILT ✅ (2-page, client-side @react-pdf/renderer)  │
│ Next: Calendar "Upcoming", Pathway locking, Cloud sync          │
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
| DNA Training Phases 4-7 | Overkill — Phases 1-3 (Assessment + Manual + Launch Guide) are sufficient |
| Fireflies.ai sync | Not working, luxury feature |
| Automated tests | Revisit when team grows |
| Push notifications (PWA) | Unreliable on iOS — using email + in-app badges instead |

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| `DNA-COHORT-PLAN.md` | DNA Cohort full architecture — permanent leader peer community, G1 experience, DB schema, build order |
| `DNA-GROUPS-COMPLETE-PLAN.md` | DNA Groups implementation plan with calendar + assessments decisions |
| `DNA-TRAINING-IMPLEMENTATION-PLAN.md` | Training platform roadmap (Phases 1-3 complete) |
| `Gifts/` | Spiritual Gifts Assessment planning (questions, synopses, implementation plan) |
| `/dna-planning/INTEGRATION-PLAN.md` | Cross-project integration (Hub ↔ Daily DNA) |
| `/dna-planning/ARCHITECTURE.md` | System architecture and data flows |
| `archive/` | Completed implementation docs |
