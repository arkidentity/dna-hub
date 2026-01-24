# Fireflies.ai Integration

> Automatic meeting transcription and AI summaries for DNA Hub

## Status

| Component | Status |
|-----------|--------|
| Database Schema | Complete |
| Webhook Handler | Complete |
| Keyword Filtering | Complete |
| Date-based Matching | Complete |
| Milestone Assignment | Complete |
| Admin Settings UI | Complete |
| AI Notes UI | Complete |
| Church Notes UI | Complete |
| Church Notes API | Pending |

---

## Overview

DNA Hub integrates with Fireflies.ai to automatically capture meeting summaries. When you invite `fred@fireflies.ai` to your Google Meet calls, Fireflies joins, records, transcribes, and sends results to DNA Hub.

### What Gets Captured

**We store AI-generated content only (not full transcripts):**
- AI summary highlighting key points and decisions
- Action items automatically extracted
- Keywords identified by AI
- Link to Fireflies for full transcript viewing
- Meeting metadata (title, date, duration, participants)

**Full transcripts stay on Fireflies.ai** - we only store the actionable insights.

---

## How It Works

### Complete Flow

```
1. Schedule Meeting
   - Title: "DNA Discovery Call - [Church Name]"
   - Invite church leader + fred@fireflies.ai

2. Meeting Happens
   - Fireflies joins and records

3. Processing (5-10 min)
   - AI generates summary, action items, keywords

4. Webhook to DNA Hub
   - Keyword filter checks for DNA-related content
   - If NO keywords: Skip (prevents processing personal calls)
   - If keywords found: Continue

5. Auto-Matching
   - Match by participant email to church
   - PRIMARY: Match by date (within 24 hours)
   - BACKUP: Match by call type keywords
   - Assign to relevant milestone

6. Admin Review
   - Review AI summary in admin dashboard
   - Mark visible_to_church = true to share

7. Church Views
   - Meeting notes appear in DNA Journey
   - Collapsed purple section with summary
   - Churches can add their own notes (blue section)
```

### Keyword Filter

Before processing, the webhook checks if the meeting title contains DNA-related keywords:

```javascript
const dnaKeywords = [
  'dna', 'discovery', 'proposal', 'strategy',
  'assessment', 'onboarding', 'kickoff', 'kick-off',
  'discipleship', 'implementation', 'church partnership',
  'leader preparation'
];
```

**Meeting naming convention:**
```
[DNA Keyword] - [Church Name] - [Optional Details]

Examples:
- "DNA Discovery Call - First Church"
- "Strategy Session - Grace Community - Phase 2"
- "Discipleship Kickoff - New Life Church"
```

### Milestone Matching

Call types map to milestones:

| Call Type | Matched Milestones |
|-----------|-------------------|
| discovery | "Vision Alignment Meeting", "Initial Discovery" |
| proposal | "Review Partnership Agreement", "Proposal" |
| strategy | "Set Implementation Timeline", "Strategy" |
| kickoff | "Kick-off Meeting", "Launch", "Begin" |
| assessment | "Complete Dam Assessment", "Assessment" |
| onboarding | "Onboarding", "Getting Started" |
| checkin | "Check-in", "Follow-up", "Review" |

---

## Setup Instructions

### 1. Run Database Migration

```sql
-- Run in Supabase SQL Editor:
-- /supabase-migration-fireflies-simplify.sql
```

### 2. Get Fireflies API Key

1. Log in to [Fireflies.ai](https://app.fireflies.ai/)
2. Go to **Settings** > **Integrations** > **Custom Integrations**
3. Click **Fireflies API**
4. Copy your API key

### 3. Connect in DNA Hub

1. Go to `/admin/settings`
2. Scroll to **Fireflies.ai Meeting Notes**
3. Click **Connect Fireflies.ai**
4. Paste API key and click **Connect**

### 4. Test

1. Schedule Google Meet with DNA keyword in title
2. Invite `fred@fireflies.ai` + church leader
3. Have short test call (2-3 min)
4. Wait 10 minutes
5. Check `/admin/settings` for webhook activity

---

## Files Reference

### Core Library
| File | Purpose |
|------|---------|
| `/src/lib/fireflies.ts` | API client, matching logic, milestone assignment |

### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/webhooks/fireflies` | POST | Receives webhook notifications |
| `/api/admin/fireflies/settings` | GET/POST/DELETE | Manage connection |
| `/api/admin/transcripts` | GET/PATCH | List/update transcripts |
| `/api/admin/transcripts/match` | POST | Manual matching |
| `/api/transcripts` | GET | Church-facing transcript access |

### UI Components
| File | Purpose |
|------|---------|
| `/src/app/admin/settings/page.tsx` | Fireflies connection UI |
| `/src/components/dashboard/MilestoneItem.tsx` | AI notes + church notes display |

### Database
| File | Purpose |
|------|---------|
| `/supabase-migration-fireflies-simplify.sql` | Simplified schema |

---

## Database Schema

### Tables

**`fireflies_settings`** - API configuration
```sql
- api_key, webhook_secret, admin_email
- auto_process_enabled, auto_match_enabled
- connected_at, last_webhook_received_at
```

**`fireflies_webhook_log`** - Event logging
```sql
- fireflies_meeting_id, event_type, payload
- processed, error_message
- matched_church_id, matched_call_id, matched_milestone_id
```

### Modified Tables

**`scheduled_calls`** - Added columns:
```sql
- fireflies_meeting_id, transcript_url
- ai_summary, action_items, keywords
- milestone_id, visible_to_church
- transcript_processed_at
```

**`church_progress`** - Added column:
```sql
- church_notes (TEXT) - Church's own notes on milestones
```

---

## UI Components

### Three Note Types

| Type | Color | Who Writes | Who Sees |
|------|-------|------------|----------|
| Admin Notes | Gold | Admin | Admin + Church |
| AI Meeting Notes | Purple | Fireflies AI | Church (when approved) |
| Church Notes | Blue | Church | Church + Admin |

### AI Notes Display (Purple, Collapsed)
```
MEETING NOTES [expand arrow]

[When expanded:]
Summary:
Discussed DNA implementation timeline...

Next Steps:
- Send proposal by Friday
- Schedule follow-up strategy call

[Keywords: timeline | leaders | resources]

-> View full transcript on Fireflies
```

### Church Notes (Blue)
```
Your Notes:
[If empty:] + Add your notes
[If has notes:] "We're excited about..." [Edit]
```

---

## Security & Privacy

### Transcript Visibility
- `visible_to_church` defaults to `false`
- Admin must explicitly approve before churches see notes
- RLS policies enforce access control

### Data Minimization
- Only AI summaries stored (not full transcripts)
- Smaller database, faster queries, better privacy
- Full transcripts remain on Fireflies.ai

---

## Troubleshooting

### Meeting was skipped
**Cause:** Title doesn't contain DNA keywords
**Fix:** Always include keywords like "DNA", "Discovery", "Strategy" in titles

### Meeting not matched to church
**Check:** Participant email matches church leader email in database
**Fix:** Manually match via `/api/admin/transcripts/match`

### Church can't see notes
**Check:** `visible_to_church = true` on the scheduled call
**Fix:** Admin must approve the notes first

### Webhook not received
**Check:** `fireflies_webhook_log` table for errors
**Fix:** Verify API key is valid, webhook URL is correct

---

## Remaining Tasks

1. **Wire up church notes state** in JourneyTab component
2. **Create church notes API** endpoint (`/api/church/progress/notes`)
3. **Run migration** in production
4. **End-to-end testing**

---

## Monitoring Queries

```sql
-- Total webhooks received
SELECT COUNT(*) FROM fireflies_webhook_log;

-- Processed successfully
SELECT COUNT(*) FROM fireflies_webhook_log
WHERE processed = true AND error_message IS NULL;

-- Skipped (no keywords)
SELECT COUNT(*) FROM fireflies_webhook_log
WHERE error_message LIKE '%Skipped%';

-- Recent webhooks
SELECT * FROM fireflies_webhook_log
ORDER BY received_at DESC LIMIT 10;
```

---

*Last updated: January 2026*
