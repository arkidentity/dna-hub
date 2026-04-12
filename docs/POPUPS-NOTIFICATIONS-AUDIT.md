# Pop-ups & Notifications Audit
*Last updated: 2026-04-11*

This document is the canonical reference for every pop-up, modal, banner, toast, drawer, and notification in both apps. Use it to review and edit messaging, coordinate triggers, and plan new UX sequences.

---

## Table of Contents

1. [Daily DNA — Toasts](#1-daily-dna--toasts)
2. [Daily DNA — Push Notifications](#2-daily-dna--push-notifications)
3. [Daily DNA — Challenge System](#3-daily-dna--challenge-system)
4. [Daily DNA — Journal Modals](#4-daily-dna--journal-modals)
5. [Daily DNA — Prayer Modals](#5-daily-dna--prayer-modals)
6. [Daily DNA — Testimony Modals](#6-daily-dna--testimony-modals)
7. [Daily DNA — Live Service](#7-daily-dna--live-service)
8. [Daily DNA — Onboarding](#8-daily-dna--onboarding)
9. [Daily DNA — Drawers & Navigation](#9-daily-dna--drawers--navigation)
10. [Daily DNA — Install & Device Prompts](#10-daily-dna--install--device-prompts)
11. [DNA Hub — Demo Flow](#11-dna-hub--demo-flow)
12. [DNA Hub — Leader Modals](#12-dna-hub--leader-modals)
13. [Storage Keys Reference](#storage-keys-reference)
14. [Gaps & Recommended New Pop-ups](#gaps--recommended-new-pop-ups)
15. [Messaging Copy to Refine](#messaging-copy-to-refine)

---

## 1. Daily DNA — Toasts

### 1.1 Toast System (Global)
- **File:** `components/ui/Toast.js`
- **Component:** `ToastProvider` / `useToast()`
- **Type:** Toast (fixed bottom-left, stacked)
- **Audience:** All users
- **Trigger:** Any component calling `showToast(message, type)`
- **Types:** `success` (green), `error` (red), `info` (blue), `warning` (yellow)
- **Duration:** 3000ms default; auto-dismiss
- **Dismissal:** Auto-timeout or click
- **Persistence:** None

**Current message examples (compiled from usage):**
| Context | Type | Message |
|---------|------|---------|
| Journal saved | success | "Entry saved!" |
| Journal save failed | error | "Failed to save. Try again." |
| Copied link | success | "Link copied!" |
| Prayer submitted | success | "Prayer submitted" |
| Cloud sync success | success | "Synced to your account" |
| Cloud sync failed | error | "Couldn't sync — try again" |

> **Refine:** Audit all `showToast()` callsites to ensure consistent tone and capitalisation. Some say "Entry saved!" with exclamation; others are flat. Standardise.

---

## 2. Daily DNA — Push Notifications

### 2.1 Web Push Permission Prompt
- **File:** `components/notifications/NotificationPrompt.tsx`
- **Component:** `NotificationPrompt`
- **Type:** Bottom sheet (portal-rendered)
- **Audience:** Logged-in disciples
- **Trigger:** App load, if:
  - Permission = "default" (not yet granted or denied)
  - Not iOS non-PWA (native iOS blocks push until installed)
  - `notif_prompt_completed` not set in localStorage
  - Fewer than 3 prior dismissals
  - Last dismissal was 7+ days ago
- **Delay:** 2 seconds after load
- **Dismissal:** "Turn On Notifications" OR "Not Now"
- **Persistence:** localStorage — see [Storage Keys Reference](#storage-keys-reference)

**Current copy:**
> **Title:** Stay in the Loop
> **Body:** Turn on notifications to receive:
> - Message updates from your group
> - Devotional reminders
> - Pathway tasks

> **Refine:** "Devotional reminders" is generic — consider "Daily Scripture reminders" to match app language. "Pathway tasks" is internal jargon; consider "DNA journey nudges" or remove if not yet functional.

---

## 3. Daily DNA — Challenge System

All challenge popups live in `components/journal/ChallengePopups.tsx`.

### 3.1 Invitation Popup
- **Audience:** Disciples — first-time journalers (no active challenge)
- **Trigger:** After first journal entry save
- **Type:** Modal (centered, z-50)
- **Dismissal:** "Start the Challenge" → opens Tier Selection | "Maybe Later"

**Current copy:**
> **Title:** Great First Entry!
> **Body:** Ready to build a habit? The 3D Bible Challenge helps you journal daily and go from distracted to devoted.
> *[Shows 7, 21, 50 day tiers]*

> **Refine:** "Distracted to devoted" is punchy — keep it. Consider adding a social proof line: "Thousands of disciples have completed this challenge."

---

### 3.2 Tier Selection Popup
- **Audience:** Disciples selecting challenge level
- **Trigger:** User taps "Start the Challenge" from 3.1
- **Type:** Modal (scrollable)
- **Dismissal:** Tap a tier card | "Maybe Later" | click-outside

**Current copy:**
> **Title:** The 3D Bible Challenge
> **Subtitle:** Pick your commitment level
> *[Tier cards: 7, 21, 50, 100, 365 days with taglines]*

> **Refine:** Tier taglines (e.g., "Just getting started", "Real commitment") should be reviewed for tone consistency.

---

### 3.3 Tier Confirmation Popup
- **Audience:** Disciples
- **Trigger:** User selects a tier in 3.2
- **Type:** Modal
- **Dismissal:** "Start My X-Day Challenge" | "Choose a different challenge"

---

### 3.4 Encouragement Popup (Post-Journal)
- **Audience:** Disciples in active challenge
- **Trigger:** After each journal save (shown from day 1 onward)
- **Type:** Modal
- **Dismissal:** "Keep Going!" | "Share What You Wrote"

**Current copy elements:**
> Streak display: "🔥 Day X" + progress bar
> Dynamic title + body message (varies by streak)

> **Refine:** Verify the full list of dynamic messages — they need to avoid feeling repetitive if shown daily. Consider 10–15 unique messages rotating.

---

### 3.5 Milestone Popup (Every 10 Days)
- **Audience:** Disciples
- **Trigger:** Days 10, 20, 30, etc.
- **Type:** Modal
- **Dismissal:** "Keep Going!"

**Current copy:**
> **Title:** Day X! Incredible Consistency
> *[Day count + remaining days displayed]*

---

### 3.6 Halfway Popup
- **Audience:** Disciples
- **Trigger:** 50% completion point (e.g., Day 11 of 21)
- **Type:** Modal
- **Dismissal:** "Keep Pushing!"

**Current copy:**
> **Title:** Halfway There! Day X of Y
> *[Progress bar at 50%]*

---

### 3.7 Upgrade Offer Popup (One Day Left)
- **Audience:** Disciples
- **Trigger:** 1 day before challenge completion
- **Type:** Modal
- **Dismissal:** "Yes, Level Up to X Days!" | "Finish at Y Days"

**Current copy:**
> **Title:** One Day Left! Day X of Y
> *[Next tier preview + explanation of continuous streak]*

---

### 3.8 Badge Award Popup
- **Audience:** Disciples
- **Trigger:** Final day of challenge completed
- **Type:** Modal
- **Dismissal:** "Continue to X Days" | "I'm Done For Now" | "Amazing Work!"

**Current copy:**
> **Title:** Challenge Complete! X-Day Badge Earned
> *[Animated badge + celebration message]*

---

### 3.9 Challenge Banner (Persistent, Journal Page)
- **File:** `components/journal/ChallengeBanner.tsx`
- **Type:** Sticky banner (top of journal, full-width, gold background)
- **Audience:** Disciples
- **Trigger:** Always shown when challenge system is active

**States:**
| State | Copy |
|-------|------|
| Not registered | "Join a 3D Bible Challenge — 7, 21, or 50 Days" |
| Registered, in progress | "X-Day Challenge — Day Y, [N]% complete" |

---

### 3.10 Who Else Invite Popup
- **File:** `components/journal/WhoElseInvitePopup.tsx`
- **Type:** Modal (centered, max-width sm, gold accent)
- **Audience:** Disciples
- **Trigger:** After 1st, 10th, and 30th journal entries (once per milestone)
- **Dismissal:** "Open Who Else?" | "Maybe Later" | click-outside

**Current copy by milestone:**
| Entry # | Title | Body |
|---------|-------|------|
| 1st | (intro) | "One journal down. You started something..." |
| 10th | (momentum) | "10 journals. Real momentum. Who in your life needs what you've been learning?" |
| 30th | (commitment) | "30 journals. That's commitment. Someone near you needs to start the same journey." |

> **Refine:** These are strong. The 30-entry line could be more specific: "...Someone near you needs to start the same journey — and you're exactly the right person to invite them."

---

## 4. Daily DNA — Journal Modals

### 4.1 Login Gate Modal
- **File:** `components/journal/LoginGateModal.tsx`
- **Type:** Modal (centered, z-50)
- **Audience:** Logged-out users attempting to save
- **Trigger:** Save journal entry without being signed in
- **Dismissal:** "Sign In / Create Account" | "Continue without account" | Escape | click-outside

**Current copy:**
> **Title:** Sign In to Save
> **Benefits list:**
> - Save unlimited journal entries
> - Sync across devices
> - Track your streak
> - Join the 3D Challenge

> **Refine:** "Save unlimited journal entries" is the weakest opener — lead with the most emotionally compelling benefit. Consider reordering: Track your streak → Join the 3D Challenge → Sync across devices → Save unlimited entries.

---

### 4.2 Save Confirm Popup
- **File:** `components/journal/SaveConfirmPopup.tsx`
- **Type:** Modal (gold header, centered)
- **Audience:** Logged-in disciples
- **Trigger:** Successful journal save
- **Dismissal:** "Keep Journaling" | "View Journal Archive"

**Current copy:**
> **Title:** Entry Saved!
> **Subtitle:** [Scripture reference]
> **Body:** Your journal entry has been saved. What would you like to do next?

> **Note:** This fires alongside the Encouragement Popup (3.4) for challenge users. Confirm there's no double-fire.

---

### 4.3 Journal View Modal
- **File:** `components/journal/JournalViewModal.tsx`
- **Type:** Modal (full content, scrollable)
- **Audience:** Disciples
- **Trigger:** Tap a saved journal entry in archive
- **Dismissal:** X button | Escape | click-outside
- **Actions:** Optional "Edit Entry" | "Delete"

---

### 4.4 Journal Info Modal (3D Tutorial)
- **File:** `components/journal/JournalInfoModal.tsx`
- **Type:** Modal (bottom sheet mobile / centered desktop)
- **Audience:** All users
- **Trigger:** Tap "What is the 3D Journal?" help icon OR focus on a dimension
- **Dismissal:** X | Escape | click-outside | "Start Journaling"

**Current copy:**
> **Overview:** "The 3D Bible Study method helps you move beyond just reading Scripture..."
> **HEAD:** "What is this passage saying?" + prompts
> **HEART:** "God, what are You saying to me?" + prompts
> **HANDS:** "God, what action do You want me to take?" + prompts
> **Footer:** James 1:22 quote

---

### 4.5 Passage Popup (Full Scripture)
- **File:** `components/journal/PassagePopup.tsx`
- **Type:** Modal (max-width lg, scrollable)
- **Audience:** Disciples
- **Trigger:** Tap "Read Full Passage"
- **Dismissal:** X | click-outside | Escape

---

### 4.6 Reading Plan Modal
- **File:** `components/journal/ReadingPlanModal.tsx`
- **Type:** Modal (full screen, scrollable)
- **Audience:** Disciples
- **Trigger:** User accesses reading plan feature

---

## 5. Daily DNA — Prayer Modals

### 5.1 Prayer Info Modal
- **File:** `components/prayer/PrayerInfoModal.tsx`
- **Type:** Modal
- **Audience:** Disciples
- **Trigger:** Tap "What is 4D Prayer?" info icon
- **Dismissal:** × | "Got It"

**Current copy:**
> **Title:** What is 4D Prayer?
> *[Four dimensions: Revere, Reflect, Rest — with descriptions]*

> **Refine:** Confirm the fourth dimension is named. "4D" implies four but the audit shows three headings (Revere, Reflect, Rest). Verify or update the title to match.

---

### 5.2 Mark Answered Modal
- **File:** `components/prayer/MarkAnsweredModal.tsx`
- **Type:** Modal
- **Audience:** Disciples
- **Trigger:** Tap "Mark as Answered" on a prayer card
- **Dismissal:** "Cancel" | "Celebrate!"

**Current copy:**
> **Title:** Prayer Answered!
> **Body:** *[Prayer excerpt]*
> **Textarea:** "What did God do?" (optional testimony)

---

### 5.3 Share to Church Prayer Wall Modal
- **File:** `components/prayer/ShareToChurchModal.tsx`
- **Type:** Modal
- **Audience:** Disciples
- **Trigger:** Tap "Share to Prayer Wall" on a prayer card
- **Dismissal:** "Cancel" | "Share"

**Current copy:**
> **Title:** Share to Prayer Wall
> *[Prayer title, anonymous toggle, approval notice if moderation is on]*

---

## 6. Daily DNA — Testimony Modals

### 6.1 Share Testimony to Church Modal
- **File:** `components/testimony/ShareTestimonyToChurchModal.tsx`
- **Type:** Modal
- **Audience:** Disciples
- **Trigger:** Tap "Share with My Church" in testimony builder
- **Dismissal:** "Cancel" | "Share"

**Current copy:**
> **Title:** Share with My Church
> **Body:** Submit '[Title]' to your church leaders for review?
> **Notice:** Leaders will review your testimony before it appears.

---

## 7. Daily DNA — Live Service

### 7.1 Live Service Overlay (Pop-up + Persistent Indicator)
- **File:** `components/live/LiveServiceOverlay.tsx`
- **Type:** Popup modal (one-time per session) + persistent "LIVE" pill indicator
- **Audience:** Disciples in live-service-enabled church
- **Trigger:** Active live session detected (polling every 30s, backs off to 5min)
- **Excluded pages:** `/live`, `/conductor`, `/join`
- **Popup dismissal:** "Join Live" (→ /live) | "Not Now" (→ shows indicator)
- **Indicator:** Always visible on all pages while session is live; click → /live
- **Persistence:** `sessionStorage` key: `dna_live_popup_dismissed`

**Current popup copy:**
> **Title:** Your church is live right now
> **Body:** [Church name] has started a live service. Join now to participate.
> **Buttons:** "Join Live" | "Not Now"

> **Refine:** Add context about what they'll experience: "Join to follow along, answer questions, and connect in real time."

---

### 7.2 DND Prompt
- **File:** `components/live/DndPrompt.tsx`
- **Type:** Inline banner/prompt
- **Audience:** Users entering live service
- **Trigger:** First load of `/live` page
- **Dismissal:** "Got it"
- **Persistence:** `sessionStorage`: `live-dnd-dismissed`

**Current copy:**
> "For the best experience, enable Do Not Disturb on your phone."

> **Refine:** Add a quick reason: "For the best experience, turn on Do Not Disturb — so nothing interrupts your service."

---

### 7.3 Service End Card
- **File:** `components/live/ServiceEndCard.tsx`
- **Type:** Inline card (bottom of live feed)
- **Audience:** Disciples + guests
- **Trigger:** Service session ends
- **Actions (disciple):** "View Past Services" | "Back to Home"
- **Actions (guest):** "Create an Account" nudge + above

**Guest nudge copy:**
> *(current copy not confirmed — needs review)*

> **Refine:** Guest nudge should connect the account to continuity: "Create an account to access your notes, responses, and past services anytime."

---

### 7.4 Creed Push Banner
- **File:** `components/creed/CreedPushBanner.tsx`
- **Type:** Modal overlay (z-9999, animated scale+translate, church-branded)
- **Audience:** Disciples in branded church
- **Trigger:** Church has an active creed card push; card not yet dismissed by this user
- **Dismissal:** X | "Later" | "View Creed Card" (→ navigates to card)
- **Persistence:** localStorage: `dna_creed_push_${card_id}_${expires_at}`

**Current copy:**
> **Title:** Your Church is Studying [Card Title]
> *[Shield icon, brief creed card description]*

---

## 8. Daily DNA — Onboarding

### 8.1 Leader Onboarding Flow
- **File:** `components/onboarding/LeaderOnboardingFlow.tsx`
- **Type:** Series of 3 modals (portal-rendered)
- **Audience:** Church leaders (role = `church_leader`) — first PWA open only
- **Trigger:** Standalone PWA mode, role = church_leader, `leader_onboarding_completed` not set
- **Persistence:** localStorage: `leader_onboarding_completed` (with timestamp)

**Steps:**

| Step | Delay | Title | Body | CTA |
|------|-------|-------|------|-----|
| 1 — Welcome | 10s | "Welcome, Pastor!" | "This is your church's discipleship app..." | [CTA button] |
| 2 — Pathway | 90s | "Explore the Pathway" | "12-week journey..." | [CTA button] |
| 3 — Dashboard | 3min | "Your Leadership Dashboard" | "Manage groups, training, track journey..." | [CTA button] |

> **Refine:** These delays (10s, 90s, 3min) are aggressive. Step 2 at 90s may interrupt the user mid-browse. Consider making steps 2 & 3 trigger on specific actions (e.g., step 2 triggers after they tap a Pathway card) rather than pure timers.

---

## 9. Daily DNA — Drawers & Navigation

### 9.1 Settings Drawer
- **File:** `components/settings/SettingsDrawer.tsx`
- **Type:** Drawer (slides in from right, portal-rendered)
- **Trigger:** Tap settings/gear icon
- **Audience:** All users
- **Contains:** Onboarding checklist, profile stats, display name edit, Bible translation, notification prefs, install app prompt, share church trigger, version info

### 9.2 Links Drawer
- **File:** `components/navigation/LinksDrawer.tsx`
- **Type:** Drawer (slides in from right)
- **Trigger:** Tap "More" / Links tab in bottom nav
- **Audience:** All users
- **Contains:** Church-branded custom links (up to 5), QR code to join church app, share options, Hub dashboard link

### 9.3 Members Drawer
- **File:** `components/groups/MembersDrawer.tsx`
- **Type:** Drawer
- **Trigger:** Tap "Members" in group view
- **Audience:** Group members
- **Contains:** Member list with avatars, role badges (Leader, Co-Leader)

### 9.4 Share Church Modal
- **File:** `components/navigation/ShareChurchModal.tsx`
- **Type:** Modal (portal-rendered, z-[10002])
- **Trigger:** Tap "Share" in SettingsDrawer or LinksDrawer
- **Audience:** All users
- **Contains:** Church name, QR code, share link, platform share options (Copy, SMS, Email, Native Share)

### 9.5 Share Content Modal (Groups)
- **File:** `components/groups/ShareContentModal.tsx`
- **Type:** Modal
- **Trigger:** Share journal/testimony/prayer to group chat
- **Audience:** Disciples in groups
- **Contains:** Tabs (Journal / Testimony / Prayer Card), last 20 entries list

---

## 10. Daily DNA — Install & Device Prompts

### 10.1 PWA Install Prompt
- **File:** `components/pwa/PwaInstallPrompt.tsx`
- **Type:** Bottom sheet modal (portal-rendered, z-50)
- **Audience:** Mobile users (not already installed as PWA)
- **Trigger:** 20 seconds after app load, if not installed and within dismissal limits
- **Dismissal:** "Got it" | X | click-outside
- **Persistence:** localStorage — see [Storage Keys Reference](#storage-keys-reference)

**Current copy:**
> **Title:** Install the App
> **Body:** Add to your home screen for the best experience
> *[Platform-specific numbered steps — iOS vs Android]*

> **Refine:** "Add to your home screen for the best experience" is weak. More specific: "Add to your home screen to receive notifications, access offline, and use the app without a browser bar."

---

### 10.2 Calendar Sync Modal
- **File:** `components/calendar/CalendarSyncModal.tsx`
- **Type:** Modal (bottom sheet, z-12000)
- **Audience:** Disciples
- **Trigger:** Tap "Sync Calendar" in group view
- **Dismissal:** X (top-right)

**Current copy:**
> **Title:** Sync Calendar
> *[Platform-specific instructions for Apple, Google, Outlook]*
> **Actions:** Subscribe button (opens webcal:// for Apple) | Copy (for Google HTTPS URL)

---

## 11. DNA Hub — Demo Flow

### 11.1 Demo Banner
- **File:** `src/components/demo/DemoBanner.tsx`
- **Type:** Fixed top banner (z-40)
- **Audience:** Prospects in demo mode
- **Trigger:** localStorage keys `dna_demo_mode`, `dna_demo_page_url`, `dna_demo_booking_url` are set
- **Dismissal:** X (clears all demo localStorage keys)

**Current copy:**
> [Back to demo] ... [Book a Call →]

---

### 11.2 Booking Modal (Demo)
- **File:** `src/components/demo/BookingModal.tsx`
- **Type:** Modal (z-2000, backdrop blur)
- **Audience:** Prospects
- **Trigger:** Tap "Book a Call" from DemoBanner or other entry points
- **Dismissal:** X | click-outside

**Current copy:**
> **Title:** Book a Discovery Call
> *[Embedded Google Calendar booking iframe]*

---

## 12. DNA Hub — Leader Modals

### 12.1 Event Modal (Create/Edit Meeting)
- **File:** `src/components/groups/EventModal.tsx`
- **Type:** Modal (fixed inset-0, z-50)
- **Audience:** DNA leaders, Church leaders
- **Trigger:** Click "Schedule Meeting" in GroupMeetings
- **Dismissal:** "Cancel" | X
- **Fields:** Title, Date, Time, Duration, Description, Location, Recurring toggle

---

### 12.2 Block Config Modal (Service Builder)
- **File:** `src/components/dashboard/services/BlockConfigModal.tsx`
- **Type:** Modal (full-screen scrollable)
- **Audience:** Service organizers, admins
- **Trigger:** Click config icon on a service block
- **Dismissal:** "Cancel" | X
- **Block types supported:** scripture, teaching_note, creed_card, worship_set, poll, open_response, breakout_prompt, giving, next_steps, connect_card, fill_in_blank, prayer_wall, announcement

---

### 12.3 Upgrade Nudge Modal
- **File:** `src/components/billing/UpgradeNudgeModal.tsx`
- **Type:** Modal (z-50, backdrop blur)
- **Audience:** Church leaders (upgrade path) or DNA leaders (escalate to admin)
- **Trigger:** Hitting a free plan limit
- **Dismissal:** X | "Not right now" / "Got it"

**Variants:**
| Variant | CTA | Copy |
|---------|-----|------|
| church-leader | "Upgrade your plan" → /dashboard?tab=billing | Free plan limit reached + upgrade benefits |
| dna-leader | "Got it" | "Ask your church admin to upgrade..." |

---

## Storage Keys Reference

### Daily DNA — localStorage
| Key | Purpose | Expiry Logic |
|-----|---------|-------------|
| `notif_prompt_completed` | Push prompt permanently dismissed after grant | Never expires |
| `notif_prompt_dismiss_count` | Count of "Not Now" taps (max 3) | Reset never |
| `notif_prompt_dismissed_at` | Timestamp of last dismiss | 7-day cooldown |
| `pwa_install_dismiss_count` | PWA prompt dismissal count (max 3) | Reset never |
| `pwa_install_dismissed_at` | Timestamp of last PWA dismiss | 7-day cooldown |
| `dna_creed_push_${card_id}_${expires_at}` | Per-card creed push seen/dismissed | Per card expiry |
| `leader_onboarding_completed` | Leader onboarding done | Never expires |

### Daily DNA — sessionStorage
| Key | Purpose |
|-----|---------|
| `live-dnd-dismissed` | DND prompt dismissed this session |
| `dna_live_popup_dismissed` | Live service popup dismissed this session |

### DNA Hub — localStorage
| Key | Purpose |
|-----|---------|
| `dna_demo_mode` | Demo mode active flag |
| `dna_demo_page_url` | Demo return URL |
| `dna_demo_booking_url` | Booking embed URL for demo |

---

## Gaps & Recommended New Pop-ups

The following sequences are currently missing and would meaningfully improve usability or activation.

---

### NEW-1 — First-Time App Open (Disciple Welcome)
- **Audience:** New disciples — first login, no journal entries
- **Trigger:** Successful sign-in + `journal_entry_count === 0` + `disciple_welcome_seen` not set
- **Type:** 2-step modal sequence (not a timer — fires once on arrival)
- **Persistence:** localStorage: `disciple_welcome_seen`

**Proposed Step 1:**
> **Title:** Welcome to Daily DNA
> **Body:** This is your personal space to read Scripture, journal, and grow — one day at a time.
> **CTA:** "Let's Start" →

**Proposed Step 2:**
> **Title:** Today's Passage is Ready
> **Body:** Every day a new Scripture passage is waiting for you. Open it, reflect on it, and write what God is saying.
> **CTA:** "Open Today's Passage" → (navigates to journal)

---

### NEW-2 — Group Invite Accepted (First Group Join)
- **Audience:** Disciples who just joined a group
- **Trigger:** First group join confirmed (route or state change)
- **Type:** Toast or inline confirmation banner
- **Persistence:** None (ephemeral)

**Proposed copy:**
> **Toast (success):** "You joined [Group Name]! Say hello in the chat."

---

### NEW-3 — Streak Recovery Prompt (Missed Day)
- **Audience:** Disciples with streak >= 3 who missed yesterday
- **Trigger:** App open after a missed day
- **Type:** Bottom sheet modal
- **Persistence:** sessionStorage (show once per session)

**Proposed copy:**
> **Title:** Don't Lose Your Streak
> **Body:** You're on a [N]-day streak. Journal today to keep it going.
> **CTA:** "Open Today's Passage" | "I'll do it later"

---

### NEW-4 — Church Leader Sign-up Welcome (Hub)
- **Audience:** Church leaders immediately after account creation in DNA Hub
- **Trigger:** First login with `role = church_leader` + `onboarding_step` not completed
- **Type:** 3-step modal flow (can't be skipped — or lightly gated)
- **Persistence:** Hub database flag (not localStorage, so it persists across devices)

**Proposed Steps:**

| Step | Title | Body | CTA |
|------|-------|------|-----|
| 1 | "Welcome to DNA Hub" | "This is your command center for discipleship. Let's get your church set up in 3 quick steps." | "Let's Go" |
| 2 | "Invite Your First Disciple" | "DNA works best in community. Add a group and invite your first disciple to Daily DNA." | "Create a Group" → groups tab |
| 3 | "Customize Your App" | "Add your church name, colors, and logo so your disciples feel at home." | "Set Up My App" → branding tab |

---

### NEW-5 — Live Service Discovery (First-Time, In-App)
- **Audience:** Church leaders who haven't enabled Live Service Mode
- **Trigger:** After 30 days of account age OR after first group reaches 5+ disciples — whichever comes first
- **Type:** In-app banner (dismissible, not a modal)
- **Location:** Dashboard tab bar (above Services tab)
- **Persistence:** localStorage or Hub DB flag

**Proposed copy:**
> **Title:** Ready to go live?
> **Body:** DNA Hub includes a full live service platform — run polls, push Scripture, collect connect cards, and display everything on a projection screen.
> **CTA:** "Learn More" → services tab | "Dismiss"

---

### NEW-6 — Post-Journal Share Nudge (After 5th Entry)
- **Audience:** Disciples — after 5th journal entry, no group membership
- **Trigger:** Save 5th journal entry + no active group
- **Type:** Modal (appears after SaveConfirmPopup closes)
- **Persistence:** localStorage: `share_nudge_5_seen`

**Proposed copy:**
> **Title:** Journaling is better together
> **Body:** Join or start a group to share what God is saying to you — and hear from others doing the same.
> **CTA:** "Find My Group" → groups tab | "Keep Going Solo"

---

### NEW-7 — Guest-to-Account Conversion (After Live Service)
- **Audience:** Guests who submitted a response during live service
- **Trigger:** Service ends (ServiceEndCard renders for guests)
- **Type:** Inline card section (not a modal — ServiceEndCard already visible)
- **Status:** Partially exists — needs stronger copy

**Proposed copy:**
> **Title:** Want to keep what you experienced today?
> **Body:** Create a free account to access your notes, past services, and daily Scripture — all in one place.
> **CTA:** "Create My Account" | "Maybe Later"

---

### NEW-8 — Pathway Completion Milestone (Hub)
- **Audience:** DNA leaders whose disciple completes a Pathway phase
- **Trigger:** Disciple marks a Pathway module complete → leader sees notification
- **Type:** Toast in Hub dashboard
- **Persistence:** None

**Proposed copy:**
> **Toast:** "[Disciple Name] completed Phase 2 of the Pathway."

---

## Messaging Copy to Refine

A focused list of copy that needs editing — pull from above and update in the source files.

| # | Component | Current Copy | Suggested Revision | File |
|---|-----------|-------------|-------------------|------|
| 1 | Notification Prompt | "Devotional reminders" | "Daily Scripture reminders" | `NotificationPrompt.tsx` |
| 2 | Notification Prompt | "Pathway tasks" | Remove or rename to "DNA journey nudges" | `NotificationPrompt.tsx` |
| 3 | Login Gate | "Save unlimited journal entries" (listed first) | Move to last; open with emotional benefit | `LoginGateModal.tsx` |
| 4 | PWA Install Prompt | "Add to your home screen for the best experience" | "Add to your home screen — get notifications, offline access, and a cleaner experience." | `PwaInstallPrompt.tsx` |
| 5 | Live Service Overlay | "Your church is live right now" | Add: "Join to follow along, answer questions, and connect in real time." | `LiveServiceOverlay.tsx` |
| 6 | DND Prompt | "For the best experience, enable Do Not Disturb on your phone." | "Turn on Do Not Disturb — so nothing interrupts your service." | `DndPrompt.tsx` |
| 7 | Who Else Invite (30th) | "Someone near you needs to start the same journey." | "...and you're exactly the right person to invite them." | `WhoElseInvitePopup.tsx` |
| 8 | Prayer Info Modal | "What is 4D Prayer?" with 3 dimensions shown | Verify 4th dimension or rename to "3D Prayer" | `PrayerInfoModal.tsx` |
| 9 | Guest ServiceEndCard | *(copy not confirmed)* | "Create an account to access your notes, responses, and past services anytime." | `ServiceEndCard.tsx` |
| 10 | Leader Onboarding Step 2 | Fires at 90s timer | Trigger on action (Pathway card tap) instead | `LeaderOnboardingFlow.tsx` |

---

*End of document. To implement any of the NEW-X pop-ups above, reference the existing patterns in `ChallengePopups.tsx` (modal) or `LiveServiceOverlay.tsx` (overlay with sessionStorage gate) as the best structural templates.*
