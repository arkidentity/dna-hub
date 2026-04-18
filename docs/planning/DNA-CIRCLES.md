# DNA Circles — Feature Plan

## Overview

DNA Circles are peer-led accountability groups for disciples who are not yet in a formal DNA group. Any authenticated user can create a Circle, invite friends by email, and use the same journaling, prayer, and testimony tools they already have — with shared visibility into each other's daily habits.

The goal is a compelling on-ramp: low barrier to entry, no leader required, familiar enough that joining a formal DNA group later feels like a natural upgrade rather than something new.

---

## Core Concept

| | DNA Circle | DNA Group |
|---|---|---|
| Created by | Any disciple | DNA Leader only |
| Max members | 12 | No hard cap |
| Pathway access | No | Yes (when invited) |
| Leader dashboard | No | Yes (Hub) |
| Chat | Yes (same module) | Yes (same module) |
| Activity feed | Yes | Yes |
| Formal meetings | No | Yes (scheduled) |
| Cost | Free | Tied to church subscription |

Circles and groups coexist — there is no graduation mechanic. A DNA leader can start a formal group and invite some or all of their Circle members into it. Overlap is fine and expected.

---

## Who Can Create a Circle

- Any authenticated Daily DNA user (no leader status required)
- No church affiliation required
- One person = creator = implicit "host" (can rename, remove members, delete circle)
- Host role is not displayed prominently in the UI — this is peer-to-peer, not hierarchical

---

## Membership

- Cap: **12 members** (including creator)
- Invite by email address
- Invited user receives a push notification: *"[Name] invited you to join their DNA Circle"*
- Invitation persists until accepted or declined — no expiry
- If the email doesn't match an existing account, a signup nudge is sent (same pattern as existing invites)
- Members can leave at any time
- Host can remove members

---

## Chat + Activity Feed

Reuses the existing DNA group chat module — same components, same data layer, same feel.

**Activity feed events** surface inline in the chat thread as system messages (not user-posted):

| Event | Feed message |
|---|---|
| Journal entry completed | "Travis completed a 3D Journal entry" |
| Prayer card set prayed | "Sarah prayed for 4 cards" |
| Testimony added | "Marco added a testimony" |
| Who Else tool used | "Jordan identified someone to invite" |
| Streak milestone | "Travis has journaled 7 days in a row 🔥" |

- Feed messages are non-intrusive — visually distinct from chat bubbles (smaller, muted color)
- No content is shared — activity visibility only (not the journal text itself)
- Users can optionally mute activity feed events in their notification settings

---

## Tool Access

All four Daily DNA core tools remain open to Circle members regardless of pathway status:

1. 3D Journal
2. 4D Prayer cards
3. Who Else tool
4. Testimony builder

The formal DNA pathway (assessments, phases, cohort content) remains locked until a user is invited into an official DNA group by a leader.

---

## Navigation + UI

### Daily DNA App

- New "Circles" section in the app nav (alongside or below DNA Group entry point)
- Circle detail view:
  - Member list with streak indicators
  - Shared activity feed + chat (unified thread)
  - "Invite someone" button (email)
- Create Circle flow: name the circle → invite by email → done (3 steps max)
- Max one screen to create — keep it frictionless

### Hub (Leader Dashboard)

- Leaders are not Circle admins — no Hub management panel needed
- Exception: if a Hub leader is a *member* of a Circle (not as a leader, just as a person), no special UI needed
- Future consideration: if a leader wants to formalize a Circle into a DNA group, they can create a new DNA group and re-invite from within Hub — no automated migration

---

## Database Plan

### New Tables

**`disciple_circles`**
```sql
id              uuid PK
name            text NOT NULL
created_by      uuid REFERENCES users(id)
created_at      timestamptz DEFAULT now()
updated_at      timestamptz
```

**`circle_members`**
```sql
circle_id       uuid REFERENCES disciple_circles(id)
user_id         uuid REFERENCES users(id)
role            text CHECK (role IN ('host', 'member')) DEFAULT 'member'
joined_at       timestamptz DEFAULT now()
PRIMARY KEY (circle_id, user_id)
```

**`circle_invitations`**
```sql
id              uuid PK
circle_id       uuid REFERENCES disciple_circles(id)
invited_by      uuid REFERENCES users(id)
invited_email   text NOT NULL
status          text CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending'
created_at      timestamptz DEFAULT now()
responded_at    timestamptz
```

**`circle_activity_events`**
```sql
id              uuid PK
circle_id       uuid REFERENCES disciple_circles(id)
user_id         uuid REFERENCES users(id)
event_type      text CHECK (event_type IN ('journal', 'prayer', 'testimony', 'who_else', 'streak_milestone'))
metadata        jsonb  -- e.g. { streak: 7 } for milestone events
created_at      timestamptz DEFAULT now()
```

### Reused Tables

- Existing `group_messages` or equivalent chat table — extend with `source_type` column (`dna_group` | `circle`) and `source_id` to avoid a separate messages table

### RPCs Needed

| RPC | Purpose |
|---|---|
| `create_circle` | Insert circle + add creator as host member |
| `invite_to_circle` | Insert invitation record + trigger push notification |
| `respond_to_circle_invitation` | Accept/decline, insert member row on accept |
| `get_my_circles` | All circles the user belongs to |
| `get_circle_detail` | Members + recent activity + chat |
| `leave_circle` | Remove self from circle_members |
| `remove_circle_member` | Host removes a member |
| `log_circle_activity_event` | Called server-side when user completes a tool action |
| `delete_circle` | Host deletes (soft delete or hard) |

---

## Activity Event Logging

Activity events are logged **server-side** when the user completes a tool action. For each user who is a member of one or more Circles, the API route that saves the journal/prayer/testimony data also writes a `circle_activity_event` row for each of their Circles.

This keeps the client simple — the app doesn't need to know about Circles when submitting a journal entry.

---

## Push Notifications

| Trigger | Notification |
|---|---|
| Invited to a Circle | "[Name] invited you to join [Circle Name]" |
| Someone accepts your invite | "[Name] joined your Circle" |
| Activity event in a Circle | "[Name] journaled today" (batched, max 1/day per circle) |
| New chat message | "[Name]: [preview]" |
| Streak milestone for a member | "[Name] is on a 7-day streak!" |

Activity notifications are **digest-style** — one per circle per day max, not per event — to avoid noise.

---

## Phased Build

### Phase 1 — Core (MVP)
- [ ] Database migration (circles, members, invitations)
- [ ] `create_circle`, `invite_to_circle`, `respond_to_invitation`, `get_my_circles`, `get_circle_detail` RPCs
- [ ] Daily DNA: Create Circle flow, Circle detail view, member list
- [ ] Invite by email + push notification on invite
- [ ] Reuse existing chat module for circle thread

### Phase 2 — Activity Feed
- [ ] `circle_activity_events` table + `log_circle_activity_event` RPC
- [ ] Server-side event logging on journal, prayer, testimony, who-else completions
- [ ] Activity feed rendering in circle chat thread (system message style)
- [ ] Streak milestone events

### Phase 3 — Polish
- [ ] Activity notification digests (1/day/circle)
- [ ] Streak indicators on member list
- [ ] Leave / remove member / delete circle flows
- [ ] Invitation pending state UI ("Waiting for Sarah...")

---

## What This Is Not

- Not a chat replacement for iMessage/WhatsApp — it's accountability, not general messaging
- Not a leader tool — no Hub dashboard component needed in v1
- Not a content gate — no pathway features unlocked by Circle membership
- Not auto-upgraded to a DNA group — circles and groups are separate things that coexist

---

## Open Questions

1. **Circle naming** — should users be required to name their circle, or can it default to member names (e.g. "Travis, Sarah, Marco")?
2. **Visibility of activity** — should members be able to opt out of broadcasting their activity to the circle?
3. **Multiple circles** — should a user be allowed to be in more than one circle, or capped at one?
4. **Circle discovery** — v1 is invite-only. Should there ever be a "public circle" or church-wide circle concept?
