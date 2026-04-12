# DNA Hub — Notifications & Pop-ups Master Doc
*Audience: leader-facing app (church leaders, DNA leaders, admins)*
*Last updated: 2026-04-11*

This is the single source of truth for all messaging in DNA Hub pop-ups, modals, banners, and prompts.
Edit copy here, then apply the change to the referenced component file.

**Format key**
- `[EDITABLE]` — safe to change; copy only
- `[DYNAMIC]` — generated at runtime, not editable here
- `→` — navigation destination on CTA tap
- `[NOT BUILT]` — spec only, no code yet
- Icon names use Lucide React naming (`Lock`, `Zap`, `X`, etc.)

---

## Table of Contents

**Active**
1. [Upgrade Nudge Modal](#1-upgrade-nudge-modal)
2. [Event Modal](#2-event-modal-create--edit-meeting)
3. [Block Config Modal](#3-block-config-modal-service-builder)
4. [Demo Banner](#4-demo-banner)
5. [Booking Modal](#5-booking-modal-demo)
6. [Inline Toasts & Alerts](#6-inline-toasts--alerts-hub)

**Coming Next — Hub Leader Onboarding**
7. [Hub Welcome Flow](#7-hub-welcome-flow-not-built) `[NOT BUILT]`
8. [First Group Nudge](#8-first-group-nudge-not-built) `[NOT BUILT]`
9. [Branding Setup Nudge](#9-branding-setup-nudge-not-built) `[NOT BUILT]`
10. [Live Service Discovery Banner](#10-live-service-discovery-banner-not-built) `[NOT BUILT]`
11. [Pathway Milestone Toast](#11-pathway-milestone-toast-not-built) `[NOT BUILT]`

---

## 1. Upgrade Nudge Modal

| Field | Current value |
|-------|--------------|
| **Type** | Modal (z-50, centered, backdrop blur) |
| **Icon** | `Lock` (Lucide, gold, 24×24 in gold/10 circle) |
| **Audience** | Church leaders (can upgrade) · DNA leaders (must escalate) |
| **Trigger** | User hits a free plan limit (e.g., max church leaders, max groups) |
| **File** | `src/components/billing/UpgradeNudgeModal.tsx` |

### Copy — shared header
```
Title: [EDITABLE] Free plan limit reached

Body:  [EDITABLE] Your free plan supports up to {limit} {limitLabel}. Upgrade to
       unlock the full DNA system — unlimited {limitLabel}, groups, cohort,
       pathway customization, and Live Service Mode.
```

### Variant: `church-leader`
*User can upgrade directly.*

| Button | Icon | Label | Action |
|--------|------|-------|--------|
| Primary | `Zap` | [EDITABLE] Upgrade your plan | → /dashboard?tab=billing |
| Secondary | — | [EDITABLE] Not right now | Closes |

### Variant: `dna-leader`
*User must ask their church admin.*

```
Info box: [EDITABLE] Ask your church admin to upgrade the DNA plan to add more
          {limitLabel}.
```

| Button | Label | Action |
|--------|-------|--------|
| Secondary | [EDITABLE] Got it | Closes |

---

## 2. Event Modal (Create / Edit Meeting)

| Field | Current value |
|-------|--------------|
| **Type** | Modal (z-50, full overlay) |
| **Icon** | None |
| **Audience** | DNA leaders · Church leaders |
| **Trigger** | Click "Schedule Meeting" in GroupMeetings |
| **File** | `src/components/groups/EventModal.tsx` |

### Copy
```
Title (create): [EDITABLE] Schedule Meeting
Title (edit):   [EDITABLE] Edit Meeting

Fields:
  Event Title   [EDITABLE placeholder] e.g. DNA Group Meeting
  Date          [EDITABLE label] Date
  Time          [EDITABLE label] Time
  Duration      [EDITABLE label] Duration  (default: 60 min)
  Description   [EDITABLE label] Description (optional)
  Location      [EDITABLE label] Location (optional)
  Recurring     [EDITABLE label] Make this recurring

Recurring options (when toggled):
  [EDITABLE labels] frequency, end date
```

### CTAs
| Button | Label | Action |
|--------|-------|--------|
| Primary | [EDITABLE] Save Meeting | Submits to /api/calendar/events |
| Secondary | [EDITABLE] Cancel | Closes |
| × | — | Closes |

---

## 3. Block Config Modal (Service Builder)

| Field | Current value |
|-------|--------------|
| **Type** | Modal (z-50, full overlay, scrollable) |
| **Icon** | Block-type specific (gear/config icon in block list) |
| **Audience** | Church leaders / service organizers |
| **Trigger** | Click config icon on any service block |
| **File** | `src/components/dashboard/services/BlockConfigModal.tsx` |

### Copy
```
Title: [EDITABLE] Configure Block  (or block-type name — verify in file)

Fields:  [Per block type — all EDITABLE labels/placeholders in BlockConfigModal]
         See blockTypeConfig.ts for 13 block type form definitions.

Display toggle: [EDITABLE] Show on projection display
```

### CTAs
| Button | Label | Action |
|--------|-------|--------|
| Primary | [EDITABLE] Save | Saves config to Supabase |
| Secondary | [EDITABLE] Cancel | Closes |
| × | — | Closes |

---

## 4. Demo Banner

| Field | Current value |
|-------|--------------|
| **Type** | Fixed top banner (z-40, full width) |
| **Icon** | None |
| **Audience** | Prospects viewing Hub in demo mode |
| **Trigger** | `dna_demo_mode = '1'` in localStorage |
| **File** | `src/components/demo/DemoBanner.tsx` |
| **Storage** | `dna_demo_mode`, `dna_demo_page_url`, `dna_demo_booking_url` (localStorage) |

### Copy
```
Left link:     [EDITABLE] ← Back to demo
Right button:  [EDITABLE] Book a Call →
```

### CTAs
| Button | Label | Action |
|--------|-------|--------|
| Left | [EDITABLE] ← Back to demo | → `dna_demo_page_url` |
| Right | [EDITABLE] Book a Call → | Opens Booking Modal |
| × | — | Clears all demo localStorage keys |

---

## 5. Booking Modal (Demo)

| Field | Current value |
|-------|--------------|
| **Type** | Modal (fixed inset-0, z-2000, backdrop blur) |
| **Icon** | None |
| **Audience** | Prospects |
| **Trigger** | Click "Book a Call" from Demo Banner or other entry points |
| **File** | `src/components/demo/BookingModal.tsx` |

### Copy
```
Title: [EDITABLE] Book a Discovery Call
Body:  [Embedded Google Calendar iframe — no copy to edit]
```

### CTAs
| Button | Label | Action |
|--------|-------|--------|
| × | — | Closes |
| Click backdrop | — | Closes |

---

## 6. Inline Toasts & Alerts (Hub)

Hub uses inline error/success states within forms rather than a global toast system.
Verify current patterns by running:

```bash
grep -r "alert\|toast\|error\|success" src/components --include="*.tsx" -l
```

Key confirmed locations:
- EventModal: inline error display on submit failure
- Service Builder: optimistic UI with inline error states
- BrandingTab: inline save confirmation

*All toast/alert copy should be documented here as callsites are found.*

| Context | Type | Current message |
|---------|------|-----------------|
| Event save failed | error | [EDITABLE — verify in EventModal] |
| Service published | success | [EDITABLE — verify in ServicesTab] |
| Branding saved | success | [EDITABLE — verify in BrandingTab] |

---

---

## 7. Hub Welcome Flow `[NOT BUILT]`

*This is the Hub-side counterpart to the Daily DNA leader onboarding. Fires on first login for church leaders.*

| Field | Value |
|-------|-------|
| **Type** | 3-step modal sequence |
| **Audience** | `role = church_leader` · first login · `hub_onboarding_completed` not set |
| **Storage** | DB flag (persists across devices — not localStorage) |
| **Note** | Full spec to be developed in next session |

### Step 1 — Welcome
```
Icon:  DNA Hub logo or welcome SVG
Title: [EDITABLE] Welcome to DNA Hub, {firstName}!
Body:  [EDITABLE] This is your command center for discipleship. Everything you
       need to manage your church's DNA implementation lives here. Let's take
       a quick look around.

CTA:   [EDITABLE] Let's Go → advances to Step 2
```

### Step 2 — Create Your First Group
```
Icon:  People / group SVG
Title: [EDITABLE] Start With a Group
Body:  [EDITABLE] DNA works best in community. Create your first DNA Group
       and invite a leader to get started — or add yourself as the leader.

Bullets:
  • [EDITABLE] Add disciples and track their journey
  • [EDITABLE] Schedule weekly meetings
  • [EDITABLE] View real-time progress from the Daily DNA app

CTA1:  [EDITABLE] Create a Group → /groups
CTA2:  [EDITABLE] I'll do this later → advances to Step 3
```

### Step 3 — Brand Your App
```
Icon:  Paint / palette SVG
Title: [EDITABLE] Make It Yours
Body:  [EDITABLE] Add your church name, logo, and brand colors so your
       disciples feel at home when they open their app.

CTA1:  [EDITABLE] Set Up Branding → /dashboard?tab=branding
CTA2:  [EDITABLE] Skip for now → marks onboarding complete
```

---

## 8. First Group Nudge `[NOT BUILT]`

*Persistent banner on /groups page if church leader has no groups yet.*

| Field | Value |
|-------|-------|
| **Type** | Inline banner (top of groups page, dismissible) |
| **Audience** | Church leaders with 0 groups |
| **Trigger** | Load /groups · `dna_groups.count === 0` for this church |
| **Storage** | `hub_first_group_nudge_dismissed` (localStorage) |

### Copy
```
Title: [EDITABLE] No groups yet — let's fix that
Body:  [EDITABLE] Create your first DNA Group and invite a leader. Once
       disciples join through Daily DNA, you'll see their progress here.

CTA1:  [EDITABLE] Create a Group → opens group creation flow
CTA2:  [EDITABLE] Dismiss → closes + sets flag
```

---

## 9. Branding Setup Nudge `[NOT BUILT]`

*One-time prompt encouraging church leaders to complete branding.*

| Field | Value |
|-------|-------|
| **Type** | Inline banner (dashboard, dismissible) |
| **Audience** | Church leaders with default/incomplete branding |
| **Trigger** | `logo_url` is null · `hub_branding_nudge_dismissed` not set |
| **Storage** | `hub_branding_nudge_dismissed` (localStorage) |

### Copy
```
Title: [EDITABLE] Your app is missing your identity
Body:  [EDITABLE] Add your church logo and brand colors so disciples recognize
       your app the moment they open it.

CTA1:  [EDITABLE] Set Up Branding → /dashboard?tab=branding
CTA2:  [EDITABLE] Later → closes
```

---

## 10. Live Service Discovery Banner `[NOT BUILT]`

*One-time in-dashboard banner surfacing Live Service Mode to leaders who haven't enabled it.*

| Field | Value |
|-------|-------|
| **Type** | Inline banner (dismissible, above dashboard tab bar) |
| **Audience** | Church leaders with `live_service_enabled = false` |
| **Trigger** | Account age ≥ 30 days OR first group reaches 5+ disciples · `hub_live_nudge_dismissed` not set |
| **Storage** | `hub_live_nudge_dismissed` (localStorage) |

### Copy
```
Title: [EDITABLE] Ready to go live?
Body:  [EDITABLE] DNA Hub includes a full live service platform — run polls,
       push Scripture, collect connect cards, and display everything on a
       projection screen.

CTA1:  [EDITABLE] Learn More → /dashboard?tab=services
CTA2:  [EDITABLE] Dismiss → closes + sets flag
```

---

## 11. Pathway Milestone Toast `[NOT BUILT]`

*Leader gets a toast when a disciple completes a Pathway phase.*

| Field | Value |
|-------|-------|
| **Type** | Toast (success, auto-dismiss) |
| **Audience** | DNA leaders and church leaders |
| **Trigger** | Disciple marks a Pathway phase complete |
| **File** | TBD — wired to groups dashboard disciple progress feed |

### Copy
```
Toast: [EDITABLE] {firstName} completed Phase {N} of the Pathway.
```

---

*End of DNA Hub master doc.*
*Implementation reference (file paths, trigger logic): `dna-hub/docs/POPUPS-NOTIFICATIONS-AUDIT.md`*
*Hub onboarding pop-ups (detailed spec): to be developed in next session.*
