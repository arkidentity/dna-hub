# 90-Day Toolkit — Leader Guide Module Plan

**Last Updated:** February 21, 2026
**Status:** Planning — Ready to Build
**Project:** DNA Hub (Leader-facing Next.js app)

---

## Overview

The 90-Day Toolkit Leader Guide is a new module in the DNA Training dashboard that gives leaders week-by-week session guides for leading their DNA group through the first 12 weeks (Phase 1: Foundation Building). It is the leader-facing counterpart to the disciple's Pathway tab in the Daily DNA app.

This is a content-rich, multi-page module broken into an overview, three month intro pages, and twelve individual session pages.

---

## Source Content

All content lives in:

```
/docs/resources/90-day-toolkit-leader-version/
  THE 90-DAY TOOLKIT_ Overview.md
  THE 90-DAY TOOLKIT_ First 30.md       ← Month 1 (Weeks 1-4)
  THE 90-DAY TOOLKIT_ Month 2.md        ← Month 2 (Weeks 5-8)
  The 90-Day TOOLKIT_ Month 3.md        ← Month 3 (Weeks 9-12)
```

---

## Architecture Decision: Separate Progress Tables

The existing `disciple_checkpoint_completions` and `disciple_toolkit_progress` tables belong to the **disciple** (Daily DNA app). The leader's toolkit guide is a separate reference/training tool.

| Layer | Table | Owner |
|---|---|---|
| Disciple progress | `disciple_toolkit_progress` + `disciple_checkpoint_completions` | Daily DNA app → Hub reads it |
| Leader guide progress | `leader_toolkit_progress` *(new — Migration 071)* | DNA Hub training module |

Zero overlap. The leader's progress tracks which session guides they've read/completed — not their personal discipleship pathway.

---

## Migration 071 — `leader_toolkit_progress`

```sql
CREATE TABLE leader_toolkit_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id     UUID NOT NULL REFERENCES dna_leaders(id) ON DELETE CASCADE,
  week_number   INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 12),
  completed     BOOLEAN DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  UNIQUE (leader_id, week_number)
);

ALTER TABLE leader_toolkit_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaders manage own toolkit progress"
  ON leader_toolkit_progress
  FOR ALL USING (
    leader_id IN (
      SELECT id FROM dna_leaders WHERE user_id = auth.uid()
    )
  );
```

Month-level completion is derived (weeks 1–4 all complete = Month 1 complete). No separate month tracking needed.

---

## Route Structure

```
/training/toolkit/                       ← Overview + month index
/training/toolkit/month/1/               ← Month 1 intro + session cards
/training/toolkit/month/2/               ← Month 2 intro + session cards
/training/toolkit/month/3/               ← Month 3 intro + session cards
/training/toolkit/week/[1–12]/           ← Individual session guide pages
```

### API Routes

```
GET  /api/training/toolkit/              ← Progress summary (all 12 weeks)
GET  /api/training/toolkit/week/[id]/   ← Single week data + completion status
POST /api/training/toolkit/week/[id]/complete  ← Mark week complete
```

---

## File Structure

```
src/
  app/
    training/
      toolkit/
        page.tsx                         ← Overview page
        month/
          [monthId]/
            page.tsx                     ← Month intro page
        week/
          [weekId]/
            page.tsx                     ← Session guide page
  lib/
    toolkit-90day-data.ts                ← All static content (12 weeks)
  app/
    api/
      training/
        toolkit/
          route.ts                       ← GET progress
          week/
            [id]/
              route.ts                   ← GET week
              complete/
                route.ts                 ← POST mark complete
```

---

## Data Structure — `toolkit-90day-data.ts`

Follows the same pattern as `dna-manual-data.ts`. All content is static TypeScript — no DB needed for content, only for progress.

```typescript
interface ToolkitWeek {
  week: number                          // 1-12
  month: 1 | 2 | 3
  title: string                         // e.g., "Life Assessment"
  subtitle: string                      // e.g., "Understanding Where We Are"
  purpose: string
  whyThisMatters: string
  preparation: {
    leaders: string[]
    disciples: string[]
  }
  meetingStructure: MeetingSection[]
  afterMeeting: string[]                // Leader debrief questions
  coachingTips: CoachingTip[]           // { problem, solution }
  watchFor: {
    goodSigns: string[]
    redFlags: string[]
  }
  completionChecklist: string[]         // 3-4 items gating Mark Complete button
  pdfSlug: string                       // e.g., "week-01-life-assessment"
}

interface MeetingSection {
  stepNumber: number
  title: string
  duration: string                      // e.g., "15 min"
  content: ContentBlock[]
}

interface ContentBlock {
  type: 'paragraph' | 'scripture' | 'discussion' | 'steps' | 'callout' | 'header' | 'checklist'
  text?: string
  ref?: string                          // Scripture reference
  questions?: string[]
  items?: string[]
  title?: string
}

interface ToolkitMonth {
  month: 1 | 2 | 3
  title: string                         // e.g., "Foundation"
  focus: string                         // One-line focus statement
  intro: string                         // Narrative intro paragraph
  weekStructure: {
    week: number
    tool: string
    purpose: string
    timeCommitment: string
  }[]
  criticalSuccessFactors: { title: string; description: string }[]
  watchFor: {
    goodSigns: string[]
    redFlags: string[]
  }
  leaderPrepChecklist: string[]
  evaluationCriteria: {
    greenLights: string[]
    yellowLights?: string[]             // Month 2 + 3 only
    redLights: string[]
  }
}

export interface ToolkitData {
  overview: {
    title: string
    subtitle: string
    intro: string
    bigPicture: PhaseRow[]             // Phase 0-3 table
    keyPrinciples: { title: string; description: string }[]
    leaderExpectations: {
      beforeStart: string[]
      during: string[]
      afterWeek12: string[]
    }
    commonMistakes: { title: string; description: string }[]
    faq: { question: string; answer: string }[]
    afterWeek12Checklist: string[]
  }
  months: ToolkitMonth[]              // 3 months
  weeks: ToolkitWeek[]                // 12 weeks
}
```

---

## Page Designs

### Overview Page — `/training/toolkit/`

- Back to Training Dashboard link
- Header: "90-Day Toolkit" + subtitle + description
- Progress bar: X of 12 weeks complete
- 3 Month cards (clickable → month intro pages)
  - Each card shows: month title, focus, 4 week titles, completion badge when all 4 done
- Phase 0→3 big picture table (collapsible)
- Leader Expectations (collapsible: before/during/after)
- Common Mistakes (collapsible)
- FAQ (collapsible)

### Month Intro Pages — `/training/toolkit/month/[1|2|3]/`

- Back to Toolkit Overview
- Month badge (e.g., "Month 1 — Foundation")
- Intro narrative
- 4-week structure table
- Critical Success Factors (collapsible)
- What to Watch For — green lights / red flags (collapsible)
- Leader Prep Checklist for this month (collapsible)
- Evaluation Criteria — green / yellow / red lights (collapsible)
- 4 Session cards (Week 1–4/5–8/9–12):
  - Shows: week number, title, time commitment, completed/locked state
  - CTA: "Begin", "Continue", or "Review"

### Session Pages — `/training/toolkit/week/[n]/`

**Always visible:**
- Back to Month X / breadcrumb nav
- Week number + title + month badge + "90 min meeting" chip
- Purpose
- Why This Matters
- Preparation block (leader bullets + disciple bullets)
- Meeting Structure — full numbered steps with timing, teaching text, discussion questions, activity instructions

**Expandable accordions (chevron toggle):**
- Leader Prep Checklist
- After the Meeting — Leader Debrief questions
- Coaching Tips — problem/solution format
- What to Watch For — good signs + red flags

**Bottom of page:**
- Session Completion Checklist (3–4 checkboxes, e.g.:)
  - [ ] Read this guide 2–3 days before the meeting
  - [ ] Completed the activity yourself first
  - [ ] Prayed for each disciple by name
  - [ ] Led the meeting
- **Mark Complete** button (enabled when all checklist items checked)
  - POST to `/api/training/toolkit/week/[id]/complete`
- **Download PDF** button → links to Supabase Storage PDF
- Previous Week ← | → Next Week navigation

---

## PDF Strategy

**Approach:** Pre-generated static PDFs, one per session (12 total), stored in Supabase Storage.

**Storage path pattern:**
```
toolkit-pdfs/week-01-life-assessment.pdf
toolkit-pdfs/week-02-3d-journal.pdf
toolkit-pdfs/week-03-4d-prayer.pdf
toolkit-pdfs/week-04-creed-cards.pdf
toolkit-pdfs/week-05-qa-deep-dive.pdf
toolkit-pdfs/week-06-listening-prayer.pdf
toolkit-pdfs/week-07-outreach-mission.pdf
toolkit-pdfs/week-08-testimony-time.pdf
toolkit-pdfs/week-09-breaking-strongholds.pdf
toolkit-pdfs/week-10-identity-shift.pdf
toolkit-pdfs/week-11-spiritual-gifts.pdf
toolkit-pdfs/week-12-life-assessment-revisited.pdf
```

**Upload:** Manual upload by admin (not generated at runtime). Session pages link to public URL.

No `@react-pdf/renderer` needed — content is static leader reference material, not personalized.

---

## Training Dashboard Card (5th Card)

Added to `/training/page.tsx`. Unlocked immediately when group is created (same gate as current toolkit unlock logic already in `ContentUnlocks.toolkit_90day`).

```
[ 📅  90-Day Toolkit                          ]
[  Week-by-week session guides for leading    ]
[  your first 12 weeks as a DNA group.        ]
[  Week 3 of 12 complete          Continue →  ]
```

- Gold border when in progress
- Teal border + checkmark when all 12 complete
- "Begin" when not started

---

## 12 Sessions — Content Map

| Week | Month | Title | Core Tool | Meeting Time |
|------|-------|-------|-----------|--------------|
| 1 | 1 | Life Assessment | Life Assessment | 90 min |
| 2 | 1 | The 3D Journal | 3D Journal | 90 min + 10 min daily |
| 3 | 1 | 4D Prayer | 4D Prayer | 90 min + 10 min daily |
| 4 | 1 | Foundation Doctrines (Creed Cards) | Creed Cards | 90 min |
| 5 | 2 | Q&A Deep Dive | Discussion | 90 min |
| 6 | 2 | Listening Prayer Circle | Listening Prayer | 90 min |
| 7 | 2 | Outreach / Mission | Outreach | 2–3 hours |
| 8 | 2 | Testimony Time | STORY Framework | 90 min |
| 9 | 3 | Breaking Strongholds | Reveal/Renounce/Replace | 90 min |
| 10 | 3 | Identity Shift | Identity Battle Plan | 90 min |
| 11 | 3 | Spiritual Gifts | Gifts Assessment + Activation | 90 min |
| 12 | 3 | Life Assessment Revisited | Comparison Report | 90 min |

---

## Expandable Sections — All 12 Weeks

Every session page includes these four collapsible accordions after the main meeting content:

| Accordion | Contents |
|-----------|----------|
| Leader Prep Checklist | Bullet list of things to do before the meeting |
| After the Meeting | Leader + co-leader debrief questions |
| Coaching Tips | Problem/solution pairs for common leader challenges |
| What to Watch For | Good signs (green) + Red flags with guidance |

---

## Completion Checklist Items (per session)

Each session has 3–4 items that must be checked before "Mark Complete" is enabled. These are session-specific. Example for Week 2 (3D Journal):

- [ ] Read this guide 2–3 days before the meeting
- [ ] Completed your own 3D Journal entry before the meeting
- [ ] Prayed for each disciple by name
- [ ] Led the 3D Journal session with your group

These are local state only (not persisted to DB) — they just gate the Mark Complete button. The DB only stores the final `completed` boolean + timestamp.

---

## Build Order

1. **Migration 071** — Create `leader_toolkit_progress` table + RLS policy
2. **`toolkit-90day-data.ts`** — Full structured content for all 12 weeks + 3 months + overview
3. **API routes** — `GET /api/training/toolkit`, `POST /api/training/toolkit/week/[id]/complete`
4. **Overview page** — `/training/toolkit/page.tsx`
5. **Month intro pages** — `/training/toolkit/month/[monthId]/page.tsx`
6. **Session pages** — `/training/toolkit/week/[weekId]/page.tsx`
7. **Training dashboard card** — Add 5th card to `/training/page.tsx`
8. **PDFs** — Upload 12 session PDFs to Supabase Storage (manual step)

---

## Notes & Gotchas

- **`disciple_checkpoint_completions` is NOT touched by this module** — that table is for the disciple's Daily DNA app pathway, read-only for leaders in the Groups dashboard.
- `toolkit_90day` unlock already exists in `ContentUnlocks` interface on the training dashboard — no schema change needed for that.
- Month completion is derived from week completion — no separate month-complete flag in DB.
- PDF URLs use public Supabase Storage URLs — no signed URLs needed if the bucket is public.
- Session page should show disciple progress data (from `disciple_toolkit_progress`) if a group is active — this is a future enhancement, not in scope for initial build.
- Next.js 15+: `params` in `[weekId]` and `[monthId]` routes must be `await`ed.
