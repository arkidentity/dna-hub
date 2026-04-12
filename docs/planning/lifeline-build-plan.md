# Lifeline Build Plan
## April 2026

---

## Overview

Two separate deliverables. One is an in-app feature built in Claude Code. The other is a formatted PDF Leader Guide built using the DNA PDF style system.

---

## Deliverable 1: In-App Lifeline Tool

**Platform:** Next.js PWA / Supabase  
**Location in app:** Inside the member's profile and the DNA Hub disciple profile

### What It Does

An interactive, persistent timeline where a DNA group member maps their life story. Events sit above or below a horizontal line representing highs and lows. Each event has a label and a "God part" field. The timeline saves automatically and syncs to the disciple profile in the DNA Hub. The leader views it read-only.

### Data Model

New table: `lifeline_events`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Foreign key to existing user/disciple table |
| `age_range_start` | int | Decade start (0, 10, 20, etc.) |
| `age_range_end` | int | Decade end |
| `label` | text | Short event title |
| `god_part` | text | What God was doing in this moment |
| `position` | enum | `above` or `below` the line |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

Add to existing disciple profile table (or linked `lifeline_summary` table if profile table is large):

| Field | Type | Notes |
|---|---|---|
| `lifeline_today` | text | "Where I am today" statement |
| `lifeline_hope` | text | "What I hope for in this group" |

### User-Facing Features

- Horizontal timeline with decade segments, auto-populated based on user age or manual range
- Tap to add an event above or below the line
- Each event opens an edit panel: label field + "God part" field
- Events are draggable, editable, and deletable
- "Where I am today" and "What I hope for in this group" text fields below the timeline
- Auto-saves on change (debounced)
- User can return and update at any time as life continues

### Leader-Facing Features

- Read-only view of the member's complete lifeline inside the disciple profile in DNA Hub
- Displays all events with labels, God parts, position (high/low), and the "where I am today" statement
- No editing capability for the leader at this stage

### Claude Code Prompt

> Build the DNA Lifeline feature for the ARK Identity PWA (Next.js + Supabase).
>
> What it is: An interactive, persistent timeline where a DNA group member maps their life story. Events sit above or below a horizontal line (highs/lows), each with a label and a "God part" text field. It saves to Supabase and syncs to the member's disciple profile in the DNA Hub. The leader can view it read-only from that profile.
>
> Before writing any code:
> 1. Review the existing disciple profile schema in Supabase to understand current table structure
> 2. Review existing DNA Hub routing and profile page components
> 3. Do not create conflicting tables or duplicate profile fields
>
> Data model (new table: `lifeline_events`): id (uuid), user_id (foreign key to existing user/disciple table), age_range_start (int), age_range_end (int), label (text), god_part (text), position (enum: above | below), created_at, updated_at.
>
> Also add `lifeline_today` (text) and `lifeline_hope` (text) to the existing disciple profile table, or a linked `lifeline_summary` table if the profile table is already large.
>
> User-facing features: Interactive horizontal timeline with decade segments. Tap to add an event above or below the line. Each event has a label field and a "God part" field. Events are draggable, editable, and deletable. "Where I am today" and "What I hope for in this group" text fields below the timeline. Auto-saves on change (debounced). User can return and update at any time.
>
> Leader-facing features: Read-only view of the member's complete lifeline from the disciple profile in DNA Hub. Shows all events, labels, God parts, and the "where I am today" statement. No editing capability for the leader.
>
> Design: Match existing ARK Identity / DNA app visual style. Check existing component library before building new components.
>
> Do not build a standalone page disconnected from the disciple profile. This feature lives inside the existing app structure.

---

## Deliverable 2: Lifeline Leader Guide PDF

**Format:** PDF using DNA PDF style system  
**Slot in pathway:** Phase 2 — Invitation phase  
**Source content:** `dna-lifeline-exercise.md` (content is complete, formatting only)

### Page Map

| Page | Type | Content |
|---|---|---|
| 1 | Cover | DNA logo, "Lifeline" title, "Leader Guide" subtitle |
| 2 | Splash/Intro | Purpose statement — what the Lifeline exercise is and why it matters in Phase 2 |
| 3 | Content | The 4-step exercise (Draw, Mark Moments, Add the God Part, Where You Are Today) |
| 4 | Content | Facilitation guidelines — timing, leader goes first, group response dos and don'ts |
| 5 | Content | Why this matters for DNA (three goals), connection to 3D Journal and Listening Prayer |
| 6 | Content | Sample leader script |
| 7 | Workbook page | Lifeline template (printable) — name, timeline, event fields, where I am today, what I hope for |
| 8 | Content | Follow-up discussion questions for after all lifelines are shared |

### Skills to Read Before Building

- `/mnt/skills/user/dna-pdf-style/SKILL.md` — required, read first
- `/mnt/skills/user/dna-tools-reference/SKILL.md` — for consistency with existing Leader Guides

### How to Start

Open a new chat and say:

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
