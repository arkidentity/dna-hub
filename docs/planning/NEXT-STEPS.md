# DNA Hub + Daily DNA — Next Steps

**Last Updated:** February 8, 2026

---

## Quick Summary

| Priority | Key Items |
|----------|-----------|
| **This Week** | ~~Spiritual Gifts Assessment~~ ✅, ~~Gifts PDF~~ ✅, Passage of the Day content, Spiritual Gifts remaining (cloud sync, /gifts auth gate, pastor landing page) |
| **Next Week** | Assessment PDF, Disciple Profile assessments tab, Global Resources Admin, Groups Calendar |
| **Week 3** | Pathway locking, Cloud sync (Testimony + Assessment), Training↔Groups bridge, Groups polish |
| **Post-Launch** | Cloud sync (remaining tools), Groups Chat images, Multiplication tracking |

---

## 🔴 This Week (Week of Feb 9)

### 1. Spiritual Gifts Assessment — CORE BUILD COMPLETE ✅

**Status:** Core assessment built and deployed (Feb 8, 2026)
**Priority:** ~~Highest~~ Remaining items are enhancement-level

**What was built (Daily DNA app):**
- ✅ Types: `/dna-app/daily-dna/types/spiritualGifts.ts`
- ✅ 96 questions data: `/dna-app/daily-dna/lib/spiritualGiftsData.ts`
- ✅ localStorage storage + scoring: `/dna-app/daily-dna/lib/spiritualGiftsStorage.ts`
- ✅ 25 synopses + bridge sentences: `/dna-app/daily-dna/lib/spiritualGiftsSynopses.ts`
- ✅ Shared component: `/dna-app/daily-dna/components/gifts/SpiritualGiftsAssessment.tsx`
- ✅ 2-page PDF generation: `/dna-app/daily-dna/lib/spiritualGiftsPdf.tsx` (client-side via @react-pdf/renderer)
- ✅ In-app route: `/app/tools/spiritual-gifts/page.tsx` (for disciples in 90-day toolkit Week 11)
- ✅ Public route: `/app/gifts/page.tsx` (requires account creation)

**Architecture:**
- One question at a time with progress bar + tier intro banners
- Scoring: Likert 1-5 direct, Multiple choice a=5, b=3, c=2, d=1
- Results: Top 6 gifts overview → Per-tier cards with primary/secondary, synopses, bridge sentences, "how to grow", expandable full scores
- Shared `SpiritualGiftsAssessment` component with `isPublic` prop (two wrappers)
- Questions shuffled within each tier but tiers stay in order (1→2→3)

**Remaining tasks (not blockers):**
- ~~PDF generation for results~~ ✅ Built (Feb 8) — 2-page compact PDF via `@react-pdf/renderer`, client-side generation, download button on results screen. File: `lib/spiritualGiftsPdf.tsx`
- Cloud sync to Supabase (`spiritual_gifts_assessments` table — migration already exists at `021_spiritual-gifts-assessment.sql`)
- `/gifts` public route needs auth gate — require account creation to take assessment (no anonymous test-taking)
- **Pastor landing page** (lead gen) — separate from `/gifts`, lives on Hub/dnadiscipleship.com. Offers pastors team assessment access. Captures: name, email, church name, church size. Follow-up via Resend email sequence.
- Write remaining ~196 bridge sentences (6 hand-written, generic fallback works for now)

**Lead Gen Strategy (decided Feb 8):**
- Individual users must create an account to take the Spiritual Gifts test (no email-only capture)
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

### 3. Assessment to PDF for Church Milestones

**Status:** Not Started
**Priority:** High — needed for church implementation workflow

**Requirements:**
- Generate PDF from church assessment data
- Add "Attach Assessment" button on the Church Assessment milestone
- Store PDF in milestone attachments

**Files:**
- `/src/app/api/assessment/route.ts` — Existing assessment data
- `/src/app/api/admin/church/[id]/milestones/route.ts` — Milestone attachments
- New: PDF generation endpoint

---

### 4. Disciple Profile — Assessments Tab

**Status:** Partially built, needs enhancement
**Priority:** High — leaders need to see disciple assessment results

**What exists:**
- Disciple profile page with basic info, engagement stats, discipleship log
- Life Assessment status badges (Week 1/Week 12) ✅ Fixed
- API endpoint fetches assessment status

**What to build:**
- **"Assessments" tab** on disciple profile page showing:
  - Life Assessment scores by category + Week 1 vs Week 12 growth comparison
  - Spiritual Gifts results (top 6 gifts) — once Gifts assessment is built
  - Future worksheets TBD
- **Q&A Questions visible to leaders** — ongoing theological questions the disciple is asking
- **Testimonies stay private** unless disciple shares in group chat (privacy model)

**~~Bug fix required:~~** ✅ Fixed (Feb 8) — All "Week 8" references changed to "Week 12" across:
- ~~`/src/lib/types.ts`~~ ✅
- ~~`/src/app/groups/[id]/page.tsx`~~ ✅
- ~~`/src/app/groups/[id]/disciples/[discipleId]/page.tsx`~~ ✅
- ~~`/src/app/api/groups/[id]/route.ts`~~ ✅
- ~~`/src/app/api/groups/[id]/disciples/[discipleId]/route.ts`~~ ✅
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

### 7. Cloud Sync — Testimony Builder + Life Assessment

**Status:** Not started (journal sync is done and serves as reference pattern)
**Priority:** High — highest-value tools after journal

**Reference implementation:** `/dna-app/daily-dna/lib/journalSync.ts`
**Tools to sync:** Testimony Builder, Life Assessment responses

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
- ✅ **Spiritual Gifts Assessment + PDF** — Core build + 2-page PDF complete in Daily DNA app (96 questions, 3 tiers, scoring, results with synopses, PDF download, in-app + public routes)
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
│ Status: Phase A ~85% ✅ | Calendar + Assessments Tab needed     │
│ Next: Calendar, Assessments Tab, Pathway Lock                   │
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
| `DNA-GROUPS-COMPLETE-PLAN.md` | DNA Groups implementation plan with calendar + assessments decisions |
| `DNA-TRAINING-IMPLEMENTATION-PLAN.md` | Training platform roadmap (Phases 1-3 complete) |
| `Gifts/` | Spiritual Gifts Assessment planning (questions, synopses, implementation plan) |
| `/dna-planning/INTEGRATION-PLAN.md` | Cross-project integration (Hub ↔ Daily DNA) |
| `/dna-planning/ARCHITECTURE.md` | System architecture and data flows |
| `archive/` | Completed implementation docs |
