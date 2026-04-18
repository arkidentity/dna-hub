# Lifeline Build Plan
## April 2026

---

## Overview

Two separate deliverables. One is an in-app feature built in Claude Code. The other is a formatted PDF Leader Guide built using the DNA PDF style system.

---

## Key Decisions (Settled April 2026)

- **Placement:** Pre-Launch phase — not Phase 1 or Phase 2. The Lifeline is the on-ramp that bonds the group before formal phases begin.
- **Format:** One person shares per week. Leader goes first. 4 weeks total (leader + 3 members). Groups of 4+ may take 5 weeks.
- **Mode:** Individual prep (member fills out privately in app), group sharing (in person, one per session). No live/real-time group fill-in mode.
- **Layout:** Vertical timeline on mobile. Decades as section headers, events as cards. High/low is a toggle on each card (not above/below a horizontal line).
- **Age/decades:** Manually entered by the member. No DOB stored.
- **Availability:** Tool is available to a disciple as soon as they are added to a group — before Phase 1 unlocks.
- **Data flow:** Member fills out in Daily DNA → leader views read-only in DNA Hub disciple profile.

---

## Deliverable 1: In-App Lifeline Tool

**Platform:** Daily DNA (Next.js PWA) + DNA Hub (read-only leader view)
**Location:** New route in Daily DNA (`/lifeline`), accessible as a Pre-Launch pathway tool. Read-only view inside the disciple profile in DNA Hub groups dashboard.

### What It Does

An interactive, persistent vertical timeline where a DNA group member maps their life story before Phase 1 begins. Decade sections contain event cards marked as highs or lows, each with a label and a "God part" field. The timeline saves automatically to Supabase and syncs read-only to the leader's disciple profile in DNA Hub.

### Layout & Interaction (Mobile-First)

- Vertical scroll layout — decades as labeled section headers
- Tap "+ Add moment" within any decade to create a new event card
- Each card shows: label, high/low toggle (with visual treatment — gold for highs, muted/cool for lows), and "God part" text
- Cards have a drag handle for reordering within or across decades
- Edit and delete on each card
- "Where I am today" and "What I hope for in this group" text fields below the timeline
- Auto-saves on change (debounced)
- Member can return and update at any time

### Data Model

New table: `lifeline_events`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to `disciple_app_accounts` |
| `decade_start` | int | Section label (0, 10, 20, etc.) |
| `label` | text | Short event title |
| `god_part` | text | What God was doing in this moment |
| `position` | enum | `high` or `low` |
| `sort_order` | int | For ordering within a decade |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

Add to existing disciple profile table (or linked `lifeline_summary` table if profile table is large):

| Field | Type | Notes |
|---|---|---|
| `lifeline_today` | text | "Where I am today" statement |
| `lifeline_hope` | text | "What I hope for in this group" |

### User-Facing Features (Daily DNA)

- Vertical timeline with decade section headers, manually set by the member
- Tap to add an event card in any decade
- Each card: label field, high/low toggle, "God part" field
- Cards are reorderable (drag handle), editable, and deletable
- Visual distinction: high = gold accent, low = muted/cool accent
- "Where I am today" and "What I hope for in this group" text fields at the bottom
- Auto-saves on change (debounced)
- Available before Phase 1 unlocks (pre-launch availability)

### Leader-Facing Features (DNA Hub)

- Read-only view of the member's complete lifeline inside the disciple profile in the DNA Hub groups dashboard
- Displays all events with labels, God parts, high/low indicator, and "where I am today" statement
- No editing capability for the leader

### Claude Code Prompt

> Build the DNA Lifeline feature across two apps: Daily DNA (member-facing interactive tool) and DNA Hub (leader read-only view).
>
> **Context:** The Lifeline is a Pre-Launch exercise completed before a DNA group enters Phase 1. Each member fills it out privately in the Daily DNA app. The leader reads it in the disciple profile inside DNA Hub before the group sharing session.
>
> Before writing any code:
> 1. Review the existing disciple profile schema in Supabase — check `disciple_app_accounts` and related tables
> 2. Review the disciple profile page in DNA Hub (`/api/groups/[id]/disciples/[discipleId]/route.ts` and related components)
> 3. Review the Daily DNA pathway tools structure and how tools are made available pre-Phase 1
> 4. Do not create conflicting tables or duplicate profile fields
>
> **Data model (new table: `lifeline_events`):** id (uuid), user_id (FK to `disciple_app_accounts`), decade_start (int — 0, 10, 20, etc.), label (text), god_part (text), position (enum: `high` | `low`), sort_order (int), created_at, updated_at.
>
> Also add `lifeline_today` (text) and `lifeline_hope` (text) to the existing disciple profile table, or a linked `lifeline_summary` table if the profile table is already large.
>
> **Daily DNA — user-facing features:**
> - New route: `/lifeline`
> - Vertical scroll layout. Decade sections as labeled headers (manually set by the member — no DOB stored).
> - Tap "+ Add moment" within any decade to create an event card.
> - Each card: label field, high/low toggle (gold accent for high, muted/cool for low), "God part" text field.
> - Cards have a drag handle for reordering within or across decades.
> - "Where I am today" and "What I hope for in this group" text fields below the timeline.
> - Auto-saves on change (debounced).
> - Tool must be available before Phase 1 unlocks (pre-launch availability).
>
> **DNA Hub — leader-facing features:**
> - Read-only view inside the existing disciple profile page in the groups dashboard.
> - Shows all events (label, God part, high/low indicator, decade) and the "where I am today" statement.
> - No editing for the leader.
>
> **Design:** Match existing app visual styles. Check existing component libraries before building new components. The Daily DNA app uses dark-mode styling on tool pages. The DNA Hub uses the standard navy/gold/teal/cream palette.
>
> Do not build a standalone disconnected page. This feature lives within the existing pathway tool structure in Daily DNA and the existing disciple profile in DNA Hub.

---

## Deliverable 2: Lifeline Leader Guide PDF

**Format:** PDF using DNA PDF style system
**Slot in pathway:** Pre-Launch phase (before Phase 1 begins)
**Source content:** `dna-lifeline-exercise.md` (needs update to reflect Pre-Launch placement before building)

### Page Map

| Page | Type | Content |
|---|---|---|
| 1 | Cover | DNA logo, "Lifeline" title, "Leader Guide" subtitle |
| 2 | Splash/Intro | Purpose statement — what the Lifeline exercise is and why it belongs in Pre-Launch before Phase 1 |
| 3 | Content | The 4-step exercise (Draw, Mark Moments, Add the God Part, Where You Are Today) |
| 4 | Content | Facilitation guidelines — timing (4 weeks, one person per week), leader goes first, group response dos and don'ts |
| 5 | Content | Why this matters for DNA (three goals), connection to 3D Journal and Listening Prayer |
| 6 | Content | Sample leader script |
| 7 | Workbook page | Lifeline template (printable) — name, timeline, event fields, where I am today, what I hope for |
| 8 | Content | Follow-up discussion questions for after all lifelines are shared |

### Before Building the PDF

Update `dna-lifeline-exercise.md` to reflect:
- Pre-Launch placement (remove all "Phase 2: Invitation" references)
- 4-week timing (leader week 1, members weeks 2-4; groups of 4+ may take 5 weeks)
- Discussion week folds into the final sharing session or the first Phase 1 meeting

### Skills to Read Before Building

- `/mnt/skills/user/dna-pdf-style/SKILL.md` — required, read first
- `/mnt/skills/user/dna-tools-reference/SKILL.md` — for consistency with existing Leader Guides

### How to Start

Update `dna-lifeline-exercise.md` first. Then open a new chat and say:

> Build the Lifeline Leader Guide as an official DNA PDF. Source content is in `dna-lifeline-exercise.md` in the project folder. Read the `dna-pdf-style` skill first. Do not add or rewrite any content — formatting and layout only. Follow the page map in the lifeline build plan.

---

## Writing Rules (All DNA Content)

- Em-dashes: Maximum one or two per full page. Default to periods, commas, or rewrites.
- Voice: Pastor-to-pastor. Never SaaS or self-help.
- Scripture: Always italicized. Reference in bold.
- Locked phrases: Use verbatim. Never paraphrase.
- Content fidelity: Never add content not in the source document.

---

*Last updated: April 2026*
