# Live Service Mode — Architecture & Implementation Plan

> **Status:** Planning (March 2026)
> **Apps affected:** DNA Hub (church admin), Daily DNA (congregation + conductor)
> **Dependencies:** Supabase Realtime (already in use for Prayer Wall)

---

## Table of Contents

1. [Vision](#vision)
2. [Phase 1 — Pre-Live Features](#phase-1--pre-live-features)
3. [Phase 2 — Interactive Services](#phase-2--interactive-services)
4. [Block Types](#block-types)
5. [Live Church Mode (Congregation UX)](#live-church-mode-congregation-ux)
6. [Conductor View](#conductor-view)
7. [Service Builder UI](#service-builder-ui)
8. [Guest Mode & Connect Card](#guest-mode--connect-card)
9. [Display Mode (Projection Screen)](#display-mode-projection-screen)
10. [Multi-Campus & Multi-Service](#multi-campus--multi-service)
11. [Service Archive](#service-archive)
12. [Starter Templates](#starter-templates)
13. [Data Models](#data-models)
14. [Scale & Infrastructure](#scale--infrastructure)
15. [Build Order](#build-order)
16. [What NOT to Build Yet](#what-not-to-build-yet)
17. [Open Questions](#open-questions)

---

## Vision

Live Service Mode transforms the DNA app into a real-time interactive church experience. During a Sunday service, a conductor (pastor or assigned leader) pushes content blocks to every phone in the room — scripture, polls, breakout prompts, giving links, and next-step invitations. The congregation follows along in a live feed that accumulates throughout the service. After service, that same feed becomes a browsable archive.

No join codes. No separate app. The church subdomain is the session scope. If you're on `dna.firstbaptist.com`, you're in First Baptist's service.

---

## Phase 1 — Pre-Live Features

Small-lift features that ship before the full interactive service system.

### 1A — Testimony Builder → Church Submission

The Testimony Builder already exists in Daily DNA as a personal discipleship tool. The new piece: a **"Share with Church"** button that submits the finished testimony to church moderators.

- Disciple finishes their testimony in the builder
- Taps "Share with My Church"
- Testimony lands in a moderation queue in the Hub
- Church leaders decide how to use it — video recording, live reading at service, display screen, etc.
- This is an "in-between services" feature, not a live moment

**Not building:** A separate live testimony submission moment. Answered prayers already capture testimonies through the existing prayer wall flow.

### 1B — 4D Prayer Activation

Nothing to build. The 4D Prayer module already works. This is a service methodology: pastor says "Open your 4D Prayer." Document it as a suggested activation.

### 1C — Creed Card Push

- In Hub church admin: dropdown to select any Creed Card
- "Push to Church" button — sets an active card record for that subdomain
- In Daily DNA: on app open, check for active Creed Card → surface as a banner prompt with "View Card" CTA
- Auto-expires after 24 hours

**Build effort:** Medium. One dashboard field + app-side check on load.

**Note:** This becomes a block type in Phase 2, but can ship standalone first.

---

## Phase 2 — Interactive Services

The core system. A pastor builds a service as an ordered sequence of blocks, then steps through them live, pushing each to the congregation's phones.

---

## Block Types

Ten block types for v1, organized in three categories.

### Content Blocks (no response, information only)

| Block | Description | Details |
|-------|-------------|---------|
| **Scripture** | Passage pushed to phones | Displays passage text. Tap → "Journal this passage?" → opens 3D Journal with passage pre-loaded. After service, users can return to the archive and journal any scripture from that week. |
| **Teaching Note** | Pastor's outline or key points | Text display. Could include fill-in-the-blank sections. Pastor writes these in the service builder. |
| **Creed Card** | Push an existing Creed Card | Select from existing cards. Appears as a viewable card in the feed. |
| **Worship Set** | Song list for that service | Artist + song title. Worship pastor enters manually. Future: Planning Center integration. Solves "what was that song?" |

### Engagement Blocks (congregation responds)

| Block | Description | Details |
|-------|-------------|---------|
| **Poll** | Multiple choice question | 2-4 options. Anonymous by default. Results aggregated in real time. Conductor + display screen show live results. |
| **Open Response** | Free text answers | Question pushed to phones. Responses go to moderation queue. Conductor selects which appear on display screen. |
| **Breakout Prompt** | Discussion question + timer | Question appears on phones and display screen with countdown timer. When timer ends, pastor brings room back together. Timer syncs across all devices. |

### Action Blocks (congregation takes a step)

| Block | Description | Details |
|-------|-------------|---------|
| **Giving** | Push church's giving link | Opens the church's configured giving URL (Tithe.ly, Pushpay, etc.). Church sets their giving link once in church settings. No payment processing built into DNA. |
| **Next Steps** | One-tap identified responses | Pastor configures 2-5 options (join a group, get baptized, follow Jesus, serve on a team, meet with a pastor). Congregation taps one button. Since they're authenticated, their name + email + selection instantly appears in the conductor/moderator queue. Zero friction. Optional auto-response per option. |
| **Connect Card** | Guest/visitor information form | Pushed during announcements. Pre-filled for guests who entered via QR. Additional fields: first time?, address, how did you hear about us?, prayer requests. Submissions go to church admin queue. |

### Future Block Types (not v1)

- **Q&A Queue** — congregation submits questions, upvotes surface the most wanted. Medium-large build due to upvoting complexity.
- **Word Cloud** — open text responses rendered as weighted word cloud on display. Needs word cloud rendering library.
- **Video/Media** — push a video link or embed to phones.
- **Live Testimony Moment** — if needed later, quick 1-2 sentence spontaneous submissions.

---

## Live Church Mode (Congregation UX)

When a service is active, the app transforms into a focused, immersive experience.

### Entry

- **Authenticated users:** Banner at top of Daily DNA: "Your church is live — tap to join." Tap → enter Live Church Mode.
- **Guests:** Scan QR code on projection screen → quick registration → land directly in Live Church Mode.
- **Returning guests (within 30 days):** QR code recognizes them via cookie/localStorage. "Welcome back, Sarah!" → straight into the feed.

### The Feed

- A scrolling timeline of every block that has been pushed so far
- New blocks appear with a subtle animation when the conductor pushes them
- Users can scroll up to review past blocks — re-read the scripture, see poll results, check the worship set
- Each block remains interactive — tap to journal a scripture, change a poll vote, tap a next step
- Users **cannot** see upcoming blocks — only what's been activated
- The feed IS the service. Nothing else is visible in this mode.

### Focus & Immersion

- **Full-screen mode:** No bottom nav, no distractions. Small "Exit" button in the corner.
- **DND prompt on entry:** A gentle card: "For the best experience, enable Do Not Disturb" with a button that opens the phone's DND settings. (Apps cannot programmatically silence other notifications on iOS/Android — this is the best we can do and it's effective.)
- **No pull-to-refresh or infinite scroll patterns.** Content only appears when the conductor pushes it. This removes the "let me check something else" instinct.

### Service End

- Conductor closes the service
- The feed stays visible as the service archive
- Soft prompt: "Service has ended. Create an account to save your history." (for guests)
- Normal Daily DNA navigation returns

---

## Conductor View

A privileged interface within Daily DNA for users with `church_leader` role. Not a separate app.

### Access

- `church_leader` role on that church subdomain
- Future: assignable `service_conductor` flag for tech volunteers (not v1)

### Screens

1. **Service selector** — choose which pre-built service to run (or create one on the fly)
2. **Block sequencer** — ordered list of all blocks in the service. Current block highlighted. "Push Next" button advances to the next block.
3. **Live dashboard** — for the active block:
   - Poll: live response counts + bar chart
   - Open Response: moderation queue (approve/reject for display)
   - Next Steps: list of names + selections as they come in
   - Breakout: timer controls (start, pause, end early)
   - Connect Card: submission count + new entries
4. **Display mode trigger** — push current results to the fullscreen projection URL
5. **End service** — closes the live session, archives the service

### Key UX Decisions

- The conductor sees ALL blocks (past, current, upcoming). The congregation only sees up to current.
- The conductor can skip a block, reorder on the fly, or insert an ad-hoc block mid-service.
- Response data (poll results, next steps, connect cards) is visible to the conductor in real time and persists after service for follow-up.

---

## Service Builder UI

Located in DNA Hub church admin. This is where pastors design their service flow before Sunday.

### Core Features

- Create a new interactive service (title, date, location, service time)
- Add blocks from the ten block types
- Drag-and-drop reorder
- Configure each block (passage reference, poll question + options, next step labels, timer duration, etc.)
- Preview mode — see what the congregation will see for each block
- Save as draft, publish (makes it available to conductor)
- **Clone from template** — start from a starter template and customize
- **Save as template** — save a service flow the church likes for reuse

### Template System

- DNA provides starter templates (see [Starter Templates](#starter-templates))
- Churches can clone any template and customize it
- Churches can save their own services as templates
- Templates are just interactive services with a `is_template: true` flag

---

## Guest Mode & Connect Card

Two-moment system designed to capture first-time visitors with zero friction.

### Moment 1: Guest Entry

**Trigger:** Visitor scans QR code on the projection screen (or types a short URL).

**Flow:**
1. Lands on a clean, church-branded page (uses existing subdomain system)
2. Three fields: **Name**, **Phone**, **Email**
3. Brief privacy notice: "Your info is shared only with [Church Name] to help them connect with you."
4. One tap: **"Join Service"**
5. Immediately enters Live Church Mode
6. Behind the scenes: `church_guests` record created, session token stored in browser (cookie + localStorage)

**Friction level:** ~10 seconds. Name, phone, email, tap. Done.

### Moment 2: Connect Card Block

- The conductor pushes a Connect Card block during announcements (it's a standard block type)
- **For guests:** Pre-filled with their name/email/phone from entry
- **Additional fields:** First time? (checkbox), Address, How did you hear about us?, Anything you'd like prayer for?
- **For authenticated members:** Same form, partially pre-filled from their profile. Church can optionally push to members or guests only.
- Submissions go straight to church admin queue

### Guest Session Lifecycle

- **Duration:** 30-day browser session via cookie/localStorage
- **Return visit:** "Welcome back, Sarah!" — no re-entry needed
- **Gentle account nudge after 2-3 visits:** Soft card: "Create an account to save your history and join a group."
- **Natural conversion moments:** After tapping a Next Step ("I'm interested in a group"), prompt: "Create an account so your group leader can connect with you."
- **Google/Apple sign-in:** One tap. Match by email, merge all guest data (past services, connect card, next steps).
- **Don't push account creation during the service.** That's a sacred moment. Nudge in the days after.

### Guest → Member Data Merge

When a guest creates a real account with the same email:
- All `church_guests` data links to their new user profile
- Past service participation preserved
- Connect card responses preserved
- Next steps responses preserved
- Church leader sees full history — "Sarah visited 3 times before creating an account, tapped 'interested in groups' on week 2"

---

## Display Mode (Projection Screen)

A fullscreen URL designed for screen projection. No login required.

**URL pattern:** `dna.churchname.com/display` (or `/live/display`)

### What it Shows

- Whatever block is currently active for that church's live service
- Auto-updates via Supabase Realtime
- Block-specific display:
  - **Scripture:** Large, readable passage text
  - **Poll:** Live-updating bar chart of results
  - **Breakout:** Question + large countdown timer
  - **Open Response:** Approved responses cycling on screen
  - **Next Steps:** Aggregate counts ("12 people took a next step today")
  - **Word Cloud:** (future) Weighted word visualization
  - **Worship Set:** Song list with artist
  - **Connect Card / Giving:** QR code to scan

### Between Blocks

- Church logo + "Open your DNA app" with QR code
- Could rotate through ambient content (prayer wall, etc.)

### Foundation

The Prayer Wall display route (`/prayer-wall/display/[churchId]/`) is the existing prototype. Evolve this into the unified display route rather than building from scratch.

---

## Multi-Campus & Multi-Service

### Data Model

Churches can have multiple **locations** (campuses). Each location can have multiple **service schedules** (times). Each interactive service is tied to a specific location + time slot.

### User Experience

- When entering Live Church Mode, user selects their campus and service time (dropdown)
- App remembers the selection for next week
- The conductor runs each service independently
- A church with 9am and 11am at Campus A creates two interactive services (probably cloned from the same template) and runs them at different times
- Campus B has entirely separate services

### Geotag (Future, Not v1)

- Could auto-detect campus based on phone GPS
- Adds friction (location permission prompt)
- Manual selection works fine and avoids permission issues
- Revisit if churches with 5+ campuses find selection tedious

---

## Service Archive

After a service ends, the live feed persists as a browsable archive.

### Congregation View

- "Past Services" section in Daily DNA (under the church area)
- Tap a past service → see the full block feed, read-only
- Content blocks remain interactive: tap a scripture → "Journal this passage?"
- Poll results visible (how the church voted)
- Their own responses visible (what next step they tapped)

### Church Admin View

- Service history in Hub
- Per-service analytics: how many people joined, poll response counts, next steps breakdown, connect card submissions
- Exportable contact lists from next steps + connect cards

---

## Starter Templates

Three pre-built interactive service templates that ship with the system. They serve two purposes: usable out of the box AND they teach pastors how to structure an interactive service.

**Templates will be designed once the Service Builder UI is functional.** Travis will pick three ARK lessons and build them as interactive services within the tool, then save as templates.

### Template Concepts (to be refined)

1. **Discovery Bible Study** — Scripture block → 3D Journal activation → breakout prompt → open response share-back → creed card
2. **Response Sunday** — Teaching note → poll → breakout discussion → next steps → prayer wall activation → creed card
3. **Deep Dive** — Scripture → teaching note → open response → poll → breakout → 3D Journal activation

### Template System

- DNA provides these starter templates globally
- A church clones a template to customize it
- Churches can save their own service flows as templates for reuse
- Template = interactive service with `is_template: true` flag

---

## Data Models

### Core Tables

```sql
-- Church locations (campuses)
church_locations (
  id uuid PRIMARY KEY,
  church_id uuid REFERENCES churches(id),
  name text NOT NULL,              -- "Main Campus", "North Campus"
  address text,
  created_at timestamptz DEFAULT now()
);

-- Service time slots per location
service_schedules (
  id uuid PRIMARY KEY,
  location_id uuid REFERENCES church_locations(id),
  day_of_week int NOT NULL,        -- 0=Sunday, 1=Monday, etc.
  start_time time NOT NULL,        -- '09:00', '11:00'
  label text,                      -- "9am Traditional", "11am Contemporary"
  created_at timestamptz DEFAULT now()
);

-- Interactive service (the designed service flow)
interactive_services (
  id uuid PRIMARY KEY,
  church_id uuid REFERENCES churches(id),
  location_id uuid REFERENCES church_locations(id),
  schedule_id uuid REFERENCES service_schedules(id),
  title text NOT NULL,
  service_date date,
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'draft',     -- draft, published, live, archived
  is_template boolean DEFAULT false,
  template_name text,              -- only if is_template = true
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Blocks within a service
service_blocks (
  id uuid PRIMARY KEY,
  service_id uuid REFERENCES interactive_services(id) ON DELETE CASCADE,
  block_type text NOT NULL,        -- scripture, teaching_note, creed_card,
                                   -- worship_set, poll, open_response,
                                   -- breakout_prompt, giving, next_steps,
                                   -- connect_card
  config jsonb NOT NULL DEFAULT '{}',
  sort_order int NOT NULL,
  is_active boolean DEFAULT false, -- currently pushed live
  activated_at timestamptz,        -- when conductor pushed this block
  created_at timestamptz DEFAULT now()
);

-- Live session state (one per active service)
live_sessions (
  id uuid PRIMARY KEY,
  service_id uuid REFERENCES interactive_services(id),
  church_id uuid REFERENCES churches(id),
  is_live boolean DEFAULT true,
  current_block_id uuid REFERENCES service_blocks(id),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Block responses (polls, next steps, open responses)
block_responses (
  id uuid PRIMARY KEY,
  block_id uuid REFERENCES service_blocks(id),
  session_id uuid REFERENCES live_sessions(id),
  user_id uuid REFERENCES auth.users(id),  -- NULL for guests
  guest_id uuid REFERENCES church_guests(id), -- NULL for members
  response_type text NOT NULL,     -- poll_vote, open_text, next_step_tap,
                                   -- connect_card
  response_data jsonb NOT NULL,    -- { option: "B" } or { text: "..." }
                                   -- or { step: "baptism" }
  is_approved boolean,             -- for moderated responses
  created_at timestamptz DEFAULT now()
);

-- Aggregate counts (maintained by triggers for performance)
block_response_counts (
  block_id uuid PRIMARY KEY REFERENCES service_blocks(id),
  counts jsonb NOT NULL DEFAULT '{}',  -- { "option_a": 42, "option_b": 31 }
  total int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Guest records
church_guests (
  id uuid PRIMARY KEY,
  church_id uuid REFERENCES churches(id),
  name text NOT NULL,
  email text,
  phone text,
  session_token text UNIQUE,       -- stored in browser cookie
  merged_to_user_id uuid,          -- set when guest creates account
  first_visit_at timestamptz DEFAULT now(),
  last_visit_at timestamptz DEFAULT now(),
  visit_count int DEFAULT 1
);

-- Connect card submissions (extends guest/member data)
connect_card_submissions (
  id uuid PRIMARY KEY,
  block_id uuid REFERENCES service_blocks(id),
  session_id uuid REFERENCES live_sessions(id),
  user_id uuid REFERENCES auth.users(id),
  guest_id uuid REFERENCES church_guests(id),
  is_first_time boolean,
  address text,
  how_heard text,
  prayer_request text,
  custom_fields jsonb,             -- church-configurable extra fields
  created_at timestamptz DEFAULT now()
);
```

### Block Config JSON Examples

```jsonc
// Scripture block
{
  "passage_ref": "Romans 12:1-2",
  "passage_text": "Therefore, I urge you, brothers and sisters...",
  "translation": "NIV"
}

// Poll block
{
  "question": "Where are you at with this?",
  "options": [
    { "id": "a", "label": "I'm all in" },
    { "id": "b", "label": "I'm wrestling with it" },
    { "id": "c", "label": "I need to learn more" },
    { "id": "d", "label": "I'm not sure" }
  ],
  "anonymous": true,
  "show_results_live": true
}

// Next Steps block
{
  "prompt": "What's your next step today?",
  "steps": [
    { "id": "groups", "label": "I want to join a DNA Group", "icon": "users" },
    { "id": "baptism", "label": "I'm interested in getting baptized", "icon": "water" },
    { "id": "salvation", "label": "I made a decision to follow Jesus", "icon": "heart" },
    { "id": "serve", "label": "I want to serve on a team", "icon": "hand" },
    { "id": "pastor", "label": "I'd like to meet with a pastor", "icon": "message" }
  ],
  "auto_responses": {
    "baptism": { "message": "Next baptism class: April 12 at 6pm", "icon": "calendar" }
  }
}

// Breakout Prompt block
{
  "question": "Turn to someone near you and share: what's one area where you need to trust God more?",
  "timer_seconds": 180,
  "timer_warning_at": 30
}

// Worship Set block
{
  "songs": [
    { "title": "Goodness of God", "artist": "Bethel Music" },
    { "title": "Build My Life", "artist": "Housefires" },
    { "title": "Way Maker", "artist": "Sinach" }
  ]
}

// Giving block
{
  "giving_url": "https://tithe.ly/give?c=12345",
  "message": "Thank you for your generosity."
}

// Connect Card block
{
  "fields": ["first_time", "address", "how_heard", "prayer_request"],
  "custom_fields": [
    { "label": "Are you interested in volunteering?", "type": "checkbox" }
  ]
}
```

### Realtime Subscriptions

```
Channel: live_service:{church_id}

Events:
  - block_activated    → new block pushed to congregation
  - block_deactivated  → block is no longer current (still visible in feed)
  - session_ended      → service is over
  - response_count     → updated aggregate (for live poll results on display)
  - response_approved  → moderated response approved (for display screen)
```

---

## Scale & Infrastructure

### Current Stack

- **App:** Next.js on Vercel (currently free tier)
- **Database + Realtime:** Supabase (currently free tier)
- **Auth:** Supabase Auth
- **Subdomains:** Already built and working

### Upgrade Path

Move to paid tiers **before** launching Live Service Mode to any church.

| Service | Plan | Monthly Cost | What You Get |
|---------|------|-------------|--------------|
| Supabase | Pro | $25 base | 500 Realtime connections, 8GB DB, 250GB bandwidth |
| Supabase | Realtime add-on | ~$10/1,000 connections | Scale beyond 500 concurrent |
| Vercel | Pro | $20 | 1TB bandwidth, generous serverless invocations |

### Cost at Scale

| Scale | Concurrent Users | Est. Monthly Cost |
|-------|-----------------|-------------------|
| 5 churches (pilot) | ~1,000 | $45-75 |
| 20 churches | ~5,000 | $75-150 |
| 50 churches | ~20,000 | $150-300 |
| 100 churches | ~50,000 | $300-500 |

These numbers are affordable. Most church software charges $50-200/church/month. At 100 churches, the entire infrastructure costs what 2-3 churches pay for Planning Center.

### Architecture for Performance

1. **One Realtime channel per church.** Not per user, not per service. One broadcast fans out to all subscribers.
2. **Optimistic UI.** When someone votes, show their response instantly on their phone. Write to DB async.
3. **Database triggers for aggregation.** A Postgres trigger on `block_responses` maintains running counts in `block_response_counts`. The conductor reads one row, not a COUNT query across thousands.
4. **Static app shell via CDN.** Vercel serves the Next.js app globally. Supabase handles all real-time data. Serverless functions stay lean — they only fire on user actions (vote, tap next step, submit card).
5. **Lazy-load block history.** When someone enters mid-service, fetch past blocks once from the DB. Then Realtime handles everything new. No polling.
6. **No SSR for live mode.** The live feed is fully client-rendered. No server load per page view.

### Offline Resilience

If a phone loses connection mid-service:
- The Realtime subscription drops
- On reconnect, the client re-subscribes and fetches current state from the database
- All missed blocks appear in the feed automatically
- No data loss — the feed catches up

This works because the feed reads from the database (source of truth), not just from Realtime events. Realtime is the notification layer, not the data layer.

### Why Supabase is the Right Choice

Vercel's database offerings (Neon Postgres) don't have built-in Realtime subscriptions. Migrating would require building a custom WebSocket layer — months of work. Supabase's Realtime is the reason this entire concept is feasible without a large engineering team. Stay on Supabase.

---

## Build Order

### Phase 1 — Pre-Live Features (can ship independently)

1. Testimony Builder "Share with Church" button + moderation queue in Hub
2. Creed Card push (standalone, before full service system)

### Phase 2 — Core Infrastructure

1. Supabase migration: `church_locations`, `service_schedules`, `interactive_services`, `service_blocks`, `live_sessions`, `block_responses`, `block_response_counts`, `church_guests`, `connect_card_submissions`
2. RLS policies for all new tables
3. Realtime channel setup + database triggers for response aggregation

### Phase 3 — Service Builder UI (Hub)

1. Create/edit interactive services (title, date, location, time)
2. Block CRUD — add, configure, reorder, delete blocks
3. Drag-and-drop block ordering
4. Preview mode
5. Publish flow
6. Clone from template / save as template

### Phase 4 — Conductor View (Daily DNA)

1. Leader role gate
2. Service selector (which published service to run)
3. Block sequencer — "Push Next" to activate blocks
4. Live dashboard per block type (poll results, response lists, moderation queue, timer controls)
5. End service flow

### Phase 5 — Congregation Experience (Daily DNA)

1. Live Church Mode entry (banner when service is live)
2. Live feed — scrolling timeline of activated blocks
3. Block renderers (one component per block type)
4. Realtime subscription — new blocks appear live
5. Focus/immersive mode (full-screen, DND prompt)

### Phase 6 — Guest Mode

1. QR landing page (church-branded, 3-field entry)
2. Guest session management (cookie/localStorage, 30-day persistence)
3. Guest participation in live feed (same experience as members)
4. Connect Card block (pre-filled for guests)
5. Guest → member merge logic (match by email on account creation)

### Phase 7 — Display Mode

1. Unified display route (`/live/display/[churchId]`)
2. Block-specific display renderers (poll chart, timer, approved responses, etc.)
3. Between-blocks view (church logo + QR code)
4. Evolve from existing Prayer Wall display route

### Phase 8 — Service Archive

1. "Past Services" view in Daily DNA
2. Re-engagement with content blocks (tap scripture → journal)
3. Church admin service history + analytics in Hub

### Phase 9 — Templates & Polish

1. Build three starter templates within the UI (Travis picks ARK lessons)
2. Template clone + customize flow
3. Church-saved templates
4. Multi-campus location/schedule selection UI
5. Worship set block (manual song entry)

### Future Phases

- Planning Center integration (OAuth per church, pull song lists)
- Q&A Queue with upvoting
- Word Cloud rendering
- Geotag auto-detection for multi-campus
- Service conductor role assignment (tech volunteers)
- Push notification option (opt-in, when service goes live)
- Per-service analytics dashboard
- Pre-built service templates library (community-shared)

---

## What NOT to Build Yet

- **Push notifications per service event** — too intrusive. Let the app experience speak.
- **Pre-built service template marketplace** — let patterns emerge from usage first.
- **Per-service analytics** — the data will be in the tables. Build the dashboard after 3+ churches are using it.
- **Planning Center / CCLI integration** — manual song entry is fine for v1. Add when churches ask.
- **Geotag campus detection** — manual selection works. Add when 5+ campus churches find it tedious.
- **Payment processing** — churches already have giving platforms. Just link to them.
- **Video/media block type** — adds streaming complexity. Defer.

---

## Open Questions

1. **Starter template content** — Travis to select three ARK lessons for the initial templates. Build these after the Service Builder UI is functional.
2. **Song data source** — manual entry for v1. Planning Center integration worth exploring once 10+ churches are active.
3. **Guest privacy notice** — exact legal wording for the QR landing page data notice. May need legal review.
4. **Bandwidth monitoring** — set up Supabase usage alerts before first church pilot. Know the thresholds.
5. **Connect Card custom fields** — how much configurability do churches need? Start with the standard fields, add custom fields if requested.
6. **Conductor on tablet vs phone** — should the conductor view be optimized for tablet (larger screen for moderation queue)? Probably yes, but phone-first is fine for v1.
7. **Block timing data** — should we track how long each block was active? Useful for future analytics. Low effort to capture (just timestamp `activated_at` and `deactivated_at`).
