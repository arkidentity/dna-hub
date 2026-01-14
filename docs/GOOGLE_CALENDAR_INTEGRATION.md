# Google Calendar Integration

> Google Calendar API integration for DNA Hub - syncs calendar events to scheduled calls.

## Status: Phase 1 Complete

| Phase | Status |
|-------|--------|
| Phase 1: Calendar Sync | Complete |
| Phase 2: Meeting Notes | Not Started |
| Phase 3: Two-Way Sync | Not Started |

---

## How It Works

### What Gets Synced

The system pulls events from your Google Calendar and matches them to churches in DNA Hub.

**Keywords matched (case-insensitive):**
- `Discovery` → discovery call
- `Proposal` → proposal call
- `Strategy` → strategy call
- `Kick-Off` / `Kickoff` / `Kick Off` → kickoff call
- `Assessment` → assessment call
- `DNA` → defaults to discovery call

**Matching logic:**
1. **Primary:** Match by attendee email → if any attendee's email matches a church leader
2. **Secondary:** Match by title → if event title contains a church name
3. **Fallback:** Unmatched events are stored for manual review

### Sync Schedule

- **Automatic:** Daily at 8 AM UTC (Vercel Hobby plan limit)
- **Manual:** Click "Sync Now" in Settings anytime
- **Range:** 30 days past to 30 days future

---

## Files Created

| File | Purpose |
|------|---------|
| `/src/lib/google-calendar.ts` | Calendar API client, OAuth, sync logic |
| `/src/app/api/auth/google/route.ts` | Start OAuth flow |
| `/src/app/api/auth/google/callback/route.ts` | Handle OAuth callback |
| `/src/app/api/cron/calendar-sync/route.ts` | Daily cron sync job |
| `/src/app/api/admin/calendar/status/route.ts` | Get connection status |
| `/src/app/api/admin/calendar/sync/route.ts` | Manual sync trigger |
| `/src/app/api/admin/calendar/disconnect/route.ts` | Disconnect calendar |
| `/src/app/admin/settings/page.tsx` | Admin settings UI |
| `/supabase-migration-google-calendar.sql` | Database tables |

---

## Database Tables

### `google_oauth_tokens`
Stores OAuth tokens for connected admin accounts.

```sql
CREATE TABLE google_oauth_tokens (
  id UUID PRIMARY KEY,
  admin_email TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### `unmatched_calendar_events`
Events that couldn't be matched to a church automatically.

```sql
CREATE TABLE unmatched_calendar_events (
  id UUID PRIMARY KEY,
  google_event_id TEXT UNIQUE NOT NULL,
  event_title TEXT NOT NULL,
  event_start TIMESTAMPTZ NOT NULL,
  event_end TIMESTAMPTZ,
  attendee_emails TEXT[],
  meet_link TEXT,
  matched_church_id UUID REFERENCES churches(id),
  matched_at TIMESTAMPTZ,
  matched_by TEXT,
  created_at TIMESTAMPTZ
);
```

### `calendar_sync_log`
Tracks each sync run for debugging.

```sql
CREATE TABLE calendar_sync_log (
  id UUID PRIMARY KEY,
  sync_started_at TIMESTAMPTZ,
  sync_completed_at TIMESTAMPTZ,
  events_processed INTEGER,
  events_synced INTEGER,
  events_unmatched INTEGER,
  errors TEXT[],
  success BOOLEAN
);
```

### Modified: `scheduled_calls`
Added columns:
- `google_event_id TEXT UNIQUE` - Links to Google Calendar event
- `meet_link TEXT` - Google Meet link if present

---

## Environment Variables

Required in Vercel:

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://dna.arkidentity.com/api/auth/google/callback
```

---

## Admin UI

Access via: `/admin/settings` (gear icon in admin header)

### Features:
- **Connect/Disconnect** Google Calendar
- **Sync Now** button for manual sync
- **Last sync info** - timestamp, events processed/synced
- **Unmatched events** - shows events that need manual review
- **Sync settings** - displays current configuration

---

## Cron Configuration

In `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/follow-ups",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/calendar-sync",
      "schedule": "0 8 * * *"
    }
  ]
}
```

> Note: Vercel Hobby plan only allows daily cron jobs. Upgrade to Pro for more frequent syncs.

---

## Google Cloud Setup (Completed)

### Prerequisites (Already Done)
1. Google Cloud project created
2. Calendar API enabled
3. OAuth consent screen configured
4. OAuth 2.0 credentials created
5. Redirect URI added: `https://dna.arkidentity.com/api/auth/google/callback`
6. Environment variables set in Vercel

### First-Time Connection
1. Go to `/admin/settings`
2. Click "Connect Google Calendar"
3. Click "Advanced" → "Go to DNA Hub (unsafe)" (normal for unverified apps)
4. Grant calendar permissions
5. Redirects back with success message

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Token expired | Auto-refresh using refresh_token |
| Refresh token invalid | Deletes tokens, shows "Reconnect" prompt |
| API rate limit | Logged, retries on next sync |
| Event can't be matched | Stored in `unmatched_calendar_events` |
| Duplicate event | Uses `google_event_id` as unique key, upserts |
| `invalid_client` error | Check env vars match Google Console exactly |

---

## Future Phases

### Phase 2: Meeting Notes Automation
- Pull Google Meet transcripts/Gemini summaries
- Auto-save to church documents
- Requires Google Drive API

### Phase 3: Two-Way Sync
- Status changes create calendar events
- Auto-generate Google Meet links
- Add church leader as attendee

---

## Troubleshooting

### "invalid_client" error
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel match Google Console exactly
- No extra spaces or quotes
- Redeploy after changing env vars

### "Google hasn't verified this app" warning
- Normal for internal/dev apps
- Click "Advanced" → "Go to DNA Hub (unsafe)"
- Safe since you own the app

### Events not syncing
- Check event title contains a keyword (Discovery, Proposal, etc.)
- Verify church leader email matches an attendee
- Check Vercel logs for errors

### Settings page not loading
- Run the database migration: `supabase-migration-google-calendar.sql`
- Check `google_oauth_tokens` table exists

---

*Last updated: January 14, 2026*
