# Fireflies.ai Integration (Phase 2)

> Automatic meeting transcription and AI summaries for DNA Hub

## Status: Phase 2 Complete (Backend + Admin UI)

| Component | Status |
|-----------|--------|
| Database Schema | ✅ Complete |
| API Endpoints | ✅ Complete |
| Webhook Handler | ✅ Complete |
| Admin Settings UI | ✅ Complete |
| Church Dashboard UI | ⏳ Pending |
| Testing | ⏳ Pending |

---

## Overview

Phase 2 adds automatic meeting transcription using Fireflies.ai. When you invite `fred@fireflies.ai` to your Google Meet calls, Fireflies joins, records, transcribes, and sends the results to DNA Hub automatically.

### What Gets Captured

- **Full transcript** with speaker identification and timestamps
- **AI summary** highlighting key points and decisions
- **Action items** automatically extracted
- **Keywords** identified by AI
- **Key moments** with timestamps
- **Audio/video URLs** for reference

---

## How It Works

### Workflow

1. **Schedule Call**: You schedule a Discovery/Proposal/Strategy call with a church
2. **Invite Fireflies**: Add `fred@fireflies.ai` to the Google Meet
3. **Meeting Happens**: Fireflies joins, records, and transcribes
4. **Processing** (5-10 min): Fireflies generates transcript and AI summary
5. **Webhook Fired**: Fireflies sends notification to DNA Hub
6. **Auto-Match**: DNA Hub matches meeting to church by participant email
7. **Save Transcript**: Full transcript saved to database
8. **Admin Review**: Admin can review/edit summary before sharing
9. **Approve for Church**: Admin marks transcript visible to church
10. **Church Views**: Church leader sees meeting notes on their dashboard

### Matching Logic

Fireflies meetings are automatically matched to churches using:

1. **Primary Strategy**: Match by participant email
   - If any meeting attendee's email matches a church leader
2. **Secondary Strategy**: Match by church name in title
   - If meeting title contains the church name
3. **Fallback**: Unmatched meetings saved for manual review

---

## Files Created

### Core Library

| File | Purpose |
|------|---------|
| `/src/lib/fireflies.ts` | Fireflies API client, webhook validation, matching logic |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/webhooks/fireflies` | POST | Receives webhook notifications from Fireflies |
| `/api/admin/fireflies/settings` | GET | Get connection status and settings |
| `/api/admin/fireflies/settings` | POST | Save/update API key |
| `/api/admin/fireflies/settings` | DELETE | Disconnect Fireflies |
| `/api/admin/transcripts` | GET | List all transcripts (with optional filters) |
| `/api/admin/transcripts` | PATCH | Update transcript (edit summary, approve for churches) |
| `/api/admin/transcripts/match` | POST | Manually match unmatched meeting to church |
| `/api/transcripts` | GET | Church-facing: Get visible transcripts |

### UI Components

| File | Purpose |
|------|---------|
| `/src/app/admin/settings/page.tsx` | Admin settings with Fireflies connection UI |

### Database

| File | Purpose |
|------|---------|
| `/supabase-migration-fireflies.sql` | Database schema for Fireflies integration |

### Types

| File | Purpose |
|------|---------|
| `/src/lib/types.ts` | TypeScript interfaces for Fireflies data (updated) |

---

## Database Schema

### New Tables

#### `meeting_transcripts`
Stores full transcript data from Fireflies meetings.

```sql
- id (UUID, PK)
- scheduled_call_id (UUID, FK to scheduled_calls)
- fireflies_meeting_id (TEXT, unique)
- title, duration, meeting_date, participants
- full_transcript (TEXT)
- sentences (JSONB) - array of {text, speaker_id, start_time}
- ai_summary, action_items, keywords
- key_moments (JSONB)
- transcript_url, audio_url, video_url
- processed_at, created_at, updated_at
```

#### `fireflies_webhook_log`
Logs all webhook events for debugging.

```sql
- id, fireflies_meeting_id, event_type, payload
- processed, matched_church_id, matched_call_id
- error_message
- received_at, processed_at
```

#### `fireflies_settings`
Stores API configuration.

```sql
- id, api_key, webhook_secret, admin_email
- auto_process_enabled, auto_match_enabled, auto_share_with_churches
- connected_at, last_webhook_received_at
```

#### `unmatched_fireflies_meetings`
Meetings that couldn't be auto-matched.

```sql
- id, fireflies_meeting_id, title, meeting_date, participants
- ai_summary, transcript_url
- match_attempted, match_attempt_count
- matched_church_id, matched_call_id, matched_at, matched_by
```

### Modified Tables

#### `scheduled_calls` (columns added)
```sql
- fireflies_meeting_id (TEXT, unique)
- transcript_url (TEXT)
- ai_summary (TEXT)
- action_items (TEXT[])
- keywords (TEXT[])
- transcript_processed_at (TIMESTAMPTZ)
- visible_to_church (BOOLEAN, default false)
```

---

## Setup Instructions

### 1. Run Database Migration

Run `/supabase-migration-fireflies.sql` in your Supabase SQL editor.

### 2. Get Fireflies API Key

1. Log in to [Fireflies.ai](https://app.fireflies.ai/)
2. Go to **Settings** → **Integrations** → **Custom Integrations**
3. Click **Fireflies API**
4. Copy your API key

### 3. Connect in DNA Hub

1. Go to `/admin/settings` in DNA Hub
2. Scroll to **Fireflies.ai Meeting Notes** section
3. Click **Connect Fireflies.ai**
4. Paste your API key
5. Click **Connect**

### 4. Configure Webhook (Optional)

If you want webhook signature verification:

1. Generate a webhook secret
2. Add it when connecting Fireflies
3. Configure in Fireflies dashboard:
   - Webhook URL: `https://dna.arkidentity.com/api/webhooks/fireflies`
   - Secret: (your secret)

**Note**: Fireflies automatically sends webhooks to registered endpoints. You may not need manual webhook configuration.

### 5. Test It

1. Schedule a test Google Meet
2. Invite `fred@fireflies.ai` to the meeting
3. Have a short test call (2-3 minutes)
4. Wait ~5-10 minutes for processing
5. Check `/admin/settings` for webhook activity
6. Check `/api/admin/transcripts` to see if transcript appeared

---

## Usage

### For Admins

#### Connecting Fireflies

1. Go to **Admin** → **Settings** (gear icon)
2. Find **Fireflies.ai Meeting Notes** section
3. Click **Connect Fireflies.ai**
4. Enter your API key from Fireflies dashboard
5. Click **Connect**

#### Inviting Fireflies to Meetings

When creating a Google Meet for a church call:
1. Add `fred@fireflies.ai` as a guest
2. Fireflies will automatically join, record, and transcribe
3. You'll receive transcripts 5-10 minutes after the meeting ends

#### Reviewing Transcripts

1. Go to **Admin** → **Settings**
2. View **Unmatched Transcripts** section for meetings that need review
3. Click **View** to see full transcript on Fireflies
4. Match manually if needed

#### Approving for Churches

Transcripts are NOT automatically visible to churches (security/privacy).

To share a transcript with a church:
1. Review the transcript and AI summary
2. Edit if needed (via API endpoint)
3. Mark `visible_to_church = true`
4. Church leader will then see it on their dashboard

### For Church Leaders

Once a transcript is approved by admin:
1. Go to **Dashboard** → **Overview** or **DNA Journey**
2. Find the relevant scheduled call
3. Click **View Notes** to see:
   - AI summary
   - Action items
   - Keywords
   - Link to full transcript

---

## API Reference

### Webhook Endpoint

**POST /api/webhooks/fireflies**

Receives notifications when transcripts are ready.

**Payload:**
```json
{
  "meetingId": "fireflies-meeting-uuid",
  "eventType": "transcription_completed",
  "clientReferenceId": "optional-reference",
  "timestamp": "2026-01-14T10:30:00Z"
}
```

**Headers:**
- `x-hub-signature`: SHA-256 HMAC signature (if webhook secret configured)

**Process:**
1. Verify signature (if secret configured)
2. Log webhook event
3. Fetch full transcript from Fireflies GraphQL API
4. Match to church/call (if auto-match enabled)
5. Save to `meeting_transcripts`
6. Link to `scheduled_calls` if matched
7. Save to `unmatched_fireflies_meetings` if not matched

### Admin Settings API

**GET /api/admin/fireflies/settings**

Returns connection status and settings.

**Response:**
```json
{
  "connected": true,
  "settings": {
    "admin_email": "admin@example.com",
    "auto_process_enabled": true,
    "auto_match_enabled": true,
    "auto_share_with_churches": false,
    "connected_at": "2026-01-14T10:00:00Z",
    "last_webhook_received_at": "2026-01-14T15:30:00Z"
  }
}
```

**POST /api/admin/fireflies/settings**

Save or update API key.

**Body:**
```json
{
  "api_key": "your-fireflies-api-key",
  "webhook_secret": "optional-webhook-secret"
}
```

**DELETE /api/admin/fireflies/settings**

Disconnect Fireflies (removes API key).

### Transcripts API

**GET /api/admin/transcripts**

List all meeting transcripts.

**Query Params:**
- `church_id`: Filter by church (optional)
- `unmatched`: If `true`, returns unmatched meetings only

**Response:**
```json
{
  "transcripts": [
    {
      "id": "transcript-uuid",
      "fireflies_meeting_id": "meeting-uuid",
      "title": "Discovery Call - First Church",
      "duration": 1800,
      "meeting_date": "2026-01-14T10:00:00Z",
      "ai_summary": "Discussion about DNA implementation...",
      "action_items": ["Send proposal by Friday", "Schedule follow-up"],
      "keywords": ["discipleship", "leaders", "timeline"],
      "transcript_url": "https://app.fireflies.ai/view/...",
      "scheduled_call": {
        "id": "call-uuid",
        "call_type": "discovery",
        "visible_to_church": false,
        "church": {
          "id": "church-uuid",
          "name": "First Church",
          "status": "awaiting_discovery"
        }
      }
    }
  ]
}
```

**PATCH /api/admin/transcripts**

Update transcript (edit summary, approve for viewing).

**Body:**
```json
{
  "transcript_id": "uuid",
  "call_id": "uuid",
  "ai_summary": "Updated summary...",
  "action_items": ["Updated action item 1", "Updated action item 2"],
  "visible_to_church": true
}
```

**POST /api/admin/transcripts/match**

Manually match an unmatched meeting.

**Body:**
```json
{
  "unmatched_meeting_id": "uuid",
  "church_id": "uuid",
  "call_id": "existing-call-uuid",
  // OR create new call:
  "create_call": {
    "call_type": "discovery",
    "scheduled_at": "2026-01-14T10:00:00Z"
  }
}
```

**GET /api/transcripts** (Church-facing)

Get transcripts visible to the authenticated church.

**Response:**
```json
{
  "transcripts": [
    {
      "id": "call-uuid",
      "call_type": "discovery",
      "scheduled_at": "2026-01-14T10:00:00Z",
      "ai_summary": "Summary of our discovery call...",
      "action_items": ["Action 1", "Action 2"],
      "keywords": ["keyword1", "keyword2"],
      "transcript_url": "https://app.fireflies.ai/view/...",
      "full_transcript": {
        "sentences": [...],
        "duration": 1800,
        "participants": ["user@example.com"]
      }
    }
  ]
}
```

---

## Configuration

### Auto-Processing Settings

Configured in `fireflies_settings` table:

- **auto_process_enabled** (default: `true`)
  - Automatically fetch and save transcripts when webhook received
  - If disabled, webhooks are logged but not processed

- **auto_match_enabled** (default: `true`)
  - Automatically match meetings to churches
  - If disabled, all meetings go to unmatched queue

- **auto_share_with_churches** (default: `false`)
  - Automatically make transcripts visible to churches
  - If `false`, admin must manually approve each transcript

### Webhook Security

Optional webhook signature verification using HMAC SHA-256:

1. Generate a secret key
2. Save it in `fireflies_settings.webhook_secret`
3. Configure in Fireflies dashboard
4. Webhook handler will verify `x-hub-signature` header

---

## Security & Privacy

### Transcript Visibility

By default, transcripts are **NOT visible** to churches until admin approval:

- `visible_to_church` defaults to `false`
- Admins can review summaries before sharing
- Admins can edit AI summaries to remove sensitive info
- Row Level Security (RLS) enforces visibility rules

### RLS Policies

**meeting_transcripts:**
- Admins: Full access
- Church leaders: Only if linked to their church AND `visible_to_church = true`

**scheduled_calls (transcripts):**
- Church leaders: Only their own calls AND `visible_to_church = true`

**fireflies_webhook_log, fireflies_settings, unmatched_fireflies_meetings:**
- Admin-only access

---

## Troubleshooting

### Webhook Not Received

**Check:**
1. Fireflies has correct webhook URL: `https://dna.arkidentity.com/api/webhooks/fireflies`
2. Meeting had `fred@fireflies.ai` invited
3. Meeting was recorded (Fireflies joined successfully)
4. Check `fireflies_webhook_log` table for errors

### Meeting Not Matched

**Possible causes:**
1. Church leader email doesn't match any attendee
2. Church name not in meeting title
3. Auto-match disabled in settings

**Solution:**
- View **Unmatched Transcripts** in admin settings
- Manually match using `/api/admin/transcripts/match`

### Transcript Not Visible to Church

**Check:**
1. `scheduled_calls.visible_to_church` is `true`
2. Transcript is linked to correct church
3. Church status is `active` or `completed`
4. Church leader is logged in

### API Key Invalid

**Symptoms:**
- Webhooks logged but transcripts not fetched
- Error messages in webhook log

**Solution:**
1. Verify API key in Fireflies dashboard
2. Reconnect in `/admin/settings`
3. Test with a new meeting

---

## Next Steps (Future Phases)

### Church Dashboard UI (Next)
- Display meeting notes on church dashboard
- Show AI summaries and action items
- Link to full transcripts
- View call history with notes

### Phase 3: Enhanced Features
- Admin UI for editing transcripts before sharing
- Manual transcript upload (for non-Fireflies meetings)
- Search and filter transcripts
- Export transcripts as PDFs
- Integration with church documents system

---

## Resources

- [Fireflies API Documentation](https://docs.fireflies.ai/)
- [Fireflies Webhook Guide](https://docs.fireflies.ai/graphql-api/webhooks)
- [Fireflies GraphQL API Reference](https://docs.fireflies.ai/graphql-api/query/transcript)

---

*Last updated: January 14, 2026*
*Phase 2 Status: Backend Complete, Church UI Pending*
