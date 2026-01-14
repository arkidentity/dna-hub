# Google Calendar Integration - Implementation Plan

> This document tracks the Google Calendar API integration for DNA Hub.

## Overview

Integrate Google Calendar as the master calendar for all DNA calls. Calendar events automatically sync to `scheduled_calls` table, meeting notes get pulled in, and status changes create new calendar events.

---

## Prerequisites (User Action Required)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name it: `DNA Hub`
4. Click "Create"

### Step 2: Enable APIs

1. Go to [API Library](https://console.cloud.google.com/apis/library)
2. Search and enable these APIs:
   - **Google Calendar API** (required)
   - **Google Drive API** (for Meet recordings - optional Phase 2)

### Step 3: Configure OAuth Consent Screen

1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Select "Internal" (if using Google Workspace) or "External"
3. Fill in:
   - App name: `DNA Hub`
   - User support email: your email
   - Developer contact: your email
4. Click "Save and Continue"
5. Add scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
6. Click "Save and Continue" through the rest

### Step 4: Create OAuth Credentials

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: `DNA Hub Web Client`
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://dna.arkidentity.com/api/auth/google/callback` (production)
6. Click "Create"
7. Copy the **Client ID** and **Client Secret**

### Step 5: Add Environment Variables

Add to `.env.local` and Vercel:

```bash
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=https://dna.arkidentity.com/api/auth/google/callback
```

---

## Implementation Phases

### Phase 1: Calendar Sync (Core) ⬜ NOT STARTED

**Goal:** Sync Google Calendar events → `scheduled_calls` table

#### Database Changes

```sql
-- Migration: supabase-migration-google-calendar.sql

-- Store Google OAuth tokens for admin
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add google_event_id to scheduled_calls for sync tracking
ALTER TABLE scheduled_calls
ADD COLUMN IF NOT EXISTS google_event_id TEXT UNIQUE;

-- Add google_meet_link to scheduled_calls
ALTER TABLE scheduled_calls
ADD COLUMN IF NOT EXISTS meet_link TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_google_event_id
ON scheduled_calls(google_event_id);
```

#### Files to Create

| File | Purpose |
|------|---------|
| `/src/lib/google-calendar.ts` | Google Calendar API client wrapper |
| `/src/app/api/auth/google/route.ts` | Start OAuth flow |
| `/src/app/api/auth/google/callback/route.ts` | Handle OAuth callback |
| `/src/app/api/cron/calendar-sync/route.ts` | Periodic sync job |
| `/src/app/admin/settings/page.tsx` | Admin settings with "Connect Google Calendar" button |

#### Sync Logic

```typescript
// Pseudocode for calendar sync

async function syncCalendarEvents() {
  // 1. Get events from last 30 days and next 30 days
  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: thirtyDaysAgo,
    timeMax: thirtyDaysFromNow,
    singleEvents: true,
  });

  for (const event of events) {
    // 2. Check if event title contains DNA-related keywords
    const callType = detectCallType(event.summary);
    if (!callType) continue;

    // 3. Try to match to a church by attendee email or title
    const church = await matchChurch(event);
    if (!church) continue;

    // 4. Upsert to scheduled_calls
    await upsertScheduledCall({
      google_event_id: event.id,
      church_id: church.id,
      call_type: callType,
      scheduled_at: event.start.dateTime,
      meet_link: event.hangoutLink,
      completed: isPast(event.end.dateTime),
    });
  }
}

function detectCallType(title: string): 'discovery' | 'proposal' | 'strategy' | null {
  const lower = title.toLowerCase();
  if (lower.includes('discovery')) return 'discovery';
  if (lower.includes('proposal')) return 'proposal';
  if (lower.includes('strategy')) return 'strategy';
  if (lower.includes('dna')) return 'discovery'; // Default for DNA calls
  return null;
}
```

#### Cron Schedule

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/follow-ups",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/calendar-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Syncs every 15 minutes.

---

### Phase 2: Meeting Notes Automation ⬜ NOT STARTED

**Goal:** Pull Google Meet summaries/transcripts into church records

#### Requirements
- Google Meet recording enabled
- Gemini note-taking enabled in Google Workspace
- Google Drive API access

#### Flow

1. After meeting ends (detected via calendar sync)
2. Check Google Drive for meeting recording/transcript
3. If Gemini summary exists, pull it
4. Save to `funnel_documents` as `discovery_notes` or `agreement_notes`

#### Files to Create

| File | Purpose |
|------|---------|
| `/src/lib/google-drive.ts` | Google Drive API for meeting files |
| `/src/lib/google-meet.ts` | Helper to find meeting artifacts |

#### Considerations

- Google Meet transcripts are stored in Google Drive
- Gemini summaries appear in Google Docs linked to the meeting
- May need to parse/extract from these formats
- Rate limits on Drive API

---

### Phase 3: Two-Way Sync ⬜ NOT STARTED

**Goal:** DNA Hub status changes → create Google Calendar events

#### When to Create Events

| Status Change | Action |
|---------------|--------|
| `pending_assessment` → `awaiting_discovery` | Create "Discovery Call - [Church]" event suggestion |
| `awaiting_discovery` → `proposal_sent` | Create "Proposal Review - [Church]" event suggestion |
| `awaiting_agreement` → `awaiting_strategy` | Create "Strategy Call - [Church]" event suggestion |

#### Flow

1. Admin changes church status
2. System creates calendar event (or draft)
3. Event includes:
   - Church leader as attendee
   - Google Meet link auto-generated
   - Description with church context

#### Files to Modify

| File | Change |
|------|--------|
| `/src/app/api/admin/churches/route.ts` | Add calendar event creation on status change |
| `/src/lib/google-calendar.ts` | Add `createEvent()` function |

---

## Admin UI for Integration

### Settings Page (`/admin/settings`)

```
┌─────────────────────────────────────────────────┐
│  Google Calendar Integration                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  Status: ✅ Connected                            │
│  Calendar: travis@arkidentity.com               │
│  Last sync: 2 minutes ago                       │
│                                                  │
│  [Disconnect]  [Sync Now]                       │
│                                                  │
├─────────────────────────────────────────────────┤
│  Sync Settings                                   │
│                                                  │
│  ☑ Auto-sync every 15 minutes                   │
│  ☑ Create events on status change               │
│  ☑ Pull meeting notes (requires Drive access)   │
│                                                  │
│  Keywords to match:                              │
│  [DNA, Discovery, Proposal, Strategy, Church]   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Event Matching Strategy

To match calendar events to churches:

### Primary: Attendee Email Match
```typescript
// If event has attendee email that matches a church_leader
const attendees = event.attendees || [];
for (const attendee of attendees) {
  const leader = await findLeaderByEmail(attendee.email);
  if (leader) return leader.church_id;
}
```

### Secondary: Title Match
```typescript
// If event title contains church name
const churches = await getAllChurches();
for (const church of churches) {
  if (event.summary.toLowerCase().includes(church.name.toLowerCase())) {
    return church.id;
  }
}
```

### Fallback: Manual Link
- Show unmatched DNA events in admin UI
- Admin can manually link to a church
- Store the link for future events with same attendee

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Token expired | Auto-refresh using refresh_token |
| Refresh token invalid | Show "Reconnect Google Calendar" prompt |
| API rate limit | Exponential backoff, retry in next cron run |
| Event can't be matched | Log to `unmatched_calendar_events` table |
| Duplicate event | Use google_event_id as unique key, upsert |

---

## Security Considerations

1. **Token Storage**: OAuth tokens stored encrypted in Supabase (consider using Supabase Vault)
2. **Scope Limitation**: Only request calendar scopes needed
3. **Admin Only**: Only admins can connect Google Calendar
4. **Audit Log**: Log all calendar sync operations

---

## Testing Plan

### Phase 1 Testing
- [ ] OAuth flow completes successfully
- [ ] Tokens are stored and refreshed
- [ ] Events with "DNA" in title are synced
- [ ] Events are matched to correct churches
- [ ] Duplicate events are handled (upsert)
- [ ] Past events marked as completed

### Phase 2 Testing
- [ ] Meeting recordings are found in Drive
- [ ] Gemini summaries are extracted
- [ ] Notes are saved to correct church/document type

### Phase 3 Testing
- [ ] Status change creates calendar event
- [ ] Event has correct attendee
- [ ] Google Meet link is generated
- [ ] Event shows in Google Calendar

---

## Progress Tracking

### Phase 1 Checklist
- [ ] User: Create Google Cloud project
- [ ] User: Enable Calendar API
- [ ] User: Create OAuth credentials
- [ ] User: Add env variables
- [ ] Dev: Create database migration
- [ ] Dev: Build `/src/lib/google-calendar.ts`
- [ ] Dev: Build OAuth routes
- [ ] Dev: Build cron sync job
- [ ] Dev: Build admin settings page
- [ ] Dev: Test end-to-end

### Phase 2 Checklist
- [ ] User: Enable Drive API
- [ ] Dev: Build Google Drive client
- [ ] Dev: Build meeting notes extraction
- [ ] Dev: Integrate into sync job
- [ ] Dev: Test with real meeting

### Phase 3 Checklist
- [ ] Dev: Add event creation to status change
- [ ] Dev: Test calendar event creation
- [ ] Dev: Handle attendee invites

---

## Dependencies

```json
// package.json additions
{
  "dependencies": {
    "googleapis": "^128.0.0"
  }
}
```

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Calendar Sync | 6-8 hours |
| Phase 2: Meeting Notes | 4-6 hours |
| Phase 3: Two-Way Sync | 3-4 hours |
| **Total** | **13-18 hours** |

---

## Next Steps

1. **User**: Complete Prerequisites (Steps 1-5 above)
2. **User**: Share Client ID and Client Secret (via secure method)
3. **Dev**: Begin Phase 1 implementation

---

*Last updated: January 14, 2025*
