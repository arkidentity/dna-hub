# DNA Cohort — Architecture & Planning

**Created:** February 10, 2026
**Status:** Planned — not yet built
**Priority:** Post-launch (build after Groups Calendar + Pathway Locking)

---

## The Problem This Solves

Generation 1 DNA leaders need to:
1. Experience the 90-day toolkit as disciples would — on the app, week by week
2. Get used to the DNA Hub dashboard before they launch their own groups
3. Stay connected as a peer community *after* they graduate and launch groups
4. Have a place to ask questions, share wins, and receive training updates long-term

Currently there is no structure that supports leader peer community. Leaders graduate from training and are essentially orphaned into solo leading. The DNA Cohort solves that by making the cohort **permanent** — it never disbands.

---

## Core Concept

A DNA leader belongs to two things simultaneously, permanently:

| | DNA Cohort | DNA Groups |
|---|---|---|
| **Purpose** | Leader peer community, training, encouragement | Disciple formation |
| **Members** | Peers (all leaders at the church) | Leader + disciples |
| **Duration** | **Permanent — never disbands** | 90-day cycles |
| **Chat** | Strategy, wins, prayer, training updates | Discipleship conversation |
| **Calendar** | Cohort events, training days, retreats | Group meetings |
| **Pathway** | Used during training phase, fades after launch | Active for disciples |

The cohort is not a DNA group. It should not be forced into the DNA group structure.

---

## Two-Surface Architecture (Option C)

### DNA Hub — Cohort (church-scoped, relational + structured)

New top-level nav item alongside Groups and Training:

```
DNA Hub Navigation
  ├── Dashboard
  ├── Groups          ← church-scoped, your disciples
  ├── Cohort          ← church-scoped, peer community  ← NEW
  │     ├── Feed         — trainer announcements, milestones
  │     ├── Discussion   — any DNA leader at the church can post + read
  │     ├── Members      — full roster of all DNA leaders at this church
  │     └── Calendar     — cohort events (training days, retreats, launches)
  ├── Training        ← global, universal, no church scope (unchanged)
  │     ├── Flow Assessment
  │     ├── DNA Manual
  │     ├── Launch Guide
  │     └── 90-Day Toolkit Trainer Guides  ← coming soon
  └── Settings
```

**Key distinction:** Training is global (same content for every church, ARK-managed). Cohort is church-scoped (Boulevard's leaders talk only to each other).

**Discussion tab:** Open to all DNA leaders at the church — not limited to groups of 4. Every generation of leaders at the church can post and read. As more generations join, the discussion grows. This is intentionally a church-wide DNA leader forum, not a small group chat.

**Feed tab:** Trainer-posted announcements and updates. Not a free-for-all. Trainers post, everyone reads. Structured, not noisy.

**Trainer role:** A trainer is a cohort member with elevated permissions — they post to the Feed and can manage the cohort calendar. They are *inside* the cohort, not managing it from a separate admin panel.

---

### Daily DNA App — Cohort Card (lightweight window into Hub)

**Placement:** Inside the Groups tab, above the list of DNA groups. A distinct card with visual differentiation from regular DNA groups.

**What the card shows:**
- Latest trainer announcement (one-line preview)
- Current cohort week/focus in the training timeline
- "Open Cohort →" button that deep-links to the Hub cohort

**What it does NOT do:**
- No parallel chat channel in the app — conversation lives in the Hub
- No reactions-only feed — that creates passive consumers, not active leaders
- No duplicate of Hub content — just a surface window

**Why this placement works:**
- Leaders are in the app daily for journaling and prayer
- The cohort card keeps them aware without demanding their attention
- When they want to go deeper, they tap through to the Hub
- Keeps the app focused on personal rhythms; Hub handles community

---

## G1 Leader Experience (e.g. Boulevard — 20 leaders)

### During training (pre-launch):
- 20 leaders split into **5 groups of 4** in the Hub
- All 4 in each group have leader-level access — they see each other's dashboards, profiles, assessment results
- They experience the 90-day toolkit on the Daily DNA app as disciples would — pathway, journal, prayer, assessments, chat
- They see the DNA Hub dashboard from day one, getting comfortable with the tools they'll use to lead
- The trainer oversees all 5 groups (added as co-leader to each, or via a cohort-level trainer view)
- Life Assessment taken at Week 1 and Week 12 — results visible to all 4 peers in their group (powerful for vulnerability and growth)

### After training (post-launch):
- Each leader creates their own DNA group(s) with real disciples
- Their training-phase group of 4 doesn't disappear — it naturally transitions into being part of the broader cohort community
- The 90-day pathway fades from relevance; they use the app for Journal, Prayer, and group chats with their disciples
- The cohort Hub stays active for discussion, announcements, and cohort calendar events
- New generations of leaders (G2, G3) join the cohort over time — the community grows

---

## Group Structure for Training Phase

**The group-of-4 during training is a special configuration:**
- All 4 members have leader-level Hub access (not just 1 leader + 1 co-leader)
- This is not the normal DNA group structure — it's a peer learning pod
- After launch, these training pods are not maintained as formal groups — members continue in the broader cohort community

**What this requires architecturally:**
- A `group_type` field on `dna_groups`: `'dna_group' | 'training_cohort'`
- Training cohort groups allow up to 4 leader-level members (not 1+1+disciples)
- `cohort_id` field to link all training groups under one cohort program (e.g. "Boulevard G1 2026")
- Trainer has read access across all groups in a cohort

---

## Database Schema (Planned)

### New tables needed:

```sql
-- The cohort itself (church-scoped)
CREATE TABLE dna_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) NOT NULL,
  name TEXT NOT NULL,  -- e.g. "Boulevard G1 — Spring 2026"
  generation INT,      -- 1, 2, 3...
  status TEXT CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  started_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort members (all DNA leaders at the church)
CREATE TABLE dna_cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES dna_cohorts(id) NOT NULL,
  leader_id UUID REFERENCES dna_leaders(id) NOT NULL,
  role TEXT CHECK (role IN ('trainer', 'leader')) DEFAULT 'leader',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cohort_id, leader_id)
);

-- Cohort feed posts (trainer-authored announcements)
CREATE TABLE dna_cohort_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES dna_cohorts(id) NOT NULL,
  author_id UUID REFERENCES dna_leaders(id) NOT NULL,
  post_type TEXT CHECK (post_type IN ('announcement', 'update', 'resource')) DEFAULT 'announcement',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort discussion (any leader can post)
CREATE TABLE dna_cohort_discussion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES dna_cohorts(id) NOT NULL,
  author_id UUID REFERENCES dna_leaders(id) NOT NULL,
  parent_id UUID REFERENCES dna_cohort_discussion(id),  -- for threading
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohort calendar events
CREATE TABLE dna_cohort_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES dna_cohorts(id) NOT NULL,
  created_by UUID REFERENCES dna_leaders(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Modify existing table:
```sql
-- Add cohort support to dna_groups
ALTER TABLE dna_groups
  ADD COLUMN group_type TEXT CHECK (group_type IN ('dna_group', 'training_cohort')) DEFAULT 'dna_group',
  ADD COLUMN cohort_id UUID REFERENCES dna_cohorts(id);
```

---

## Hub Pages to Build

| Page | Route | Description |
|------|-------|-------------|
| Cohort home | `/cohort` | Feed + latest discussion + upcoming events |
| Cohort feed | `/cohort/feed` | Trainer announcements, pinned posts |
| Cohort discussion | `/cohort/discussion` | Threaded forum for all church leaders |
| Cohort members | `/cohort/members` | Roster with generation, role, training status |
| Cohort calendar | `/cohort/calendar` | Events, training days, retreats |
| Post detail | `/cohort/feed/[id]` | Single announcement with comments |
| Discussion thread | `/cohort/discussion/[id]` | Single thread with replies |

---

## Daily DNA App Changes

| Location | Change |
|----------|--------|
| Groups tab | Add cohort card above DNA group list |
| Cohort card | Show latest post title + "Open Cohort →" deep link to Hub |
| No new tab needed | Cohort lives inside Groups tab, not as a 5th tab |

---

## Roles & Permissions

| Role | Feed | Discussion | Members | Calendar | Training groups |
|------|------|------------|---------|----------|-----------------|
| **Trainer** | Post + manage | Post + moderate | View all | Create + manage | View all groups in cohort |
| **DNA Leader** | Read + comment | Post + reply | View | View | View own group only |
| **Church Admin** | Full access | Full access | Full access | Full access | Full access |
| **ARK Admin** | Full access | Full access | Full access | Full access | Full access |

---

## Open Questions (Resolve Before Building)

1. **Multi-cohort per church:** Can a church have multiple active cohorts (G1 + G2 running simultaneously)? Almost certainly yes — need to decide if the Discussion tab shows all cohorts or is scoped per cohort.

2. **Cohort creation flow:** Who creates a cohort — Church Admin in the Hub, or ARK Admin as part of onboarding? Likely Church Admin.

3. **Training group transition:** When training-phase groups of 4 finish the 90 days, do they formally dissolve in the system or just naturally go inactive? Recommend: mark as `status: 'graduated'`, keep chat history, stop showing pathway progress.

4. **App notification:** When a trainer posts a new announcement, does the leader get a push notification or just sees it on the cohort card next time they open the app? Recommend email + in-app card update for now (no push until PWA notifications are reliable).

5. **Cross-church cohort visibility:** Should cohort discussion ever be visible across churches (e.g. a network-level discussion for all ARK-affiliated leaders)? Not for v1 — keep church-scoped. Revisit at scale.

---

## Build Order (When Ready)

1. Database migrations — cohorts, members, posts, discussion, events + `dna_groups` alterations
2. Hub Cohort section — Feed + Members (highest value, lowest complexity)
3. Hub Discussion tab — threaded posts
4. Hub Calendar tab — cohort events (can reuse calendar infra from Groups Calendar)
5. Training cohort group type — allow 4 leader-level members
6. Trainer view — aggregate across all training groups in a cohort
7. Daily DNA app — cohort card in Groups tab

---

## Related Docs

- `NEXT-STEPS.md` — overall roadmap
- `DNA-GROUPS-COMPLETE-PLAN.md` — DNA Groups architecture
- `DNA-TRAINING-IMPLEMENTATION-PLAN.md` — Training platform (content that cohort references)
