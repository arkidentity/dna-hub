# Phase 2: Fireflies Integration - Setup Guide

## 🎉 Phase 2 Complete!

I've built the complete backend infrastructure and admin UI for Fireflies.ai integration. Here's what's been created and how to set it up.

---

## ✅ What's Been Built

### Backend (Complete)
- ✅ Database schema with 4 new tables
- ✅ Fireflies GraphQL API client
- ✅ Webhook handler for receiving transcripts
- ✅ Automatic church/call matching logic
- ✅ Admin API endpoints for managing transcripts
- ✅ Church API endpoint for viewing transcripts
- ✅ Full TypeScript type definitions

### Admin UI (Complete)
- ✅ Fireflies connection interface in Admin Settings
- ✅ API key input and management
- ✅ Connection status display
- ✅ Unmatched meetings view
- ✅ Last webhook activity tracking

### Church UI (Pending)
- ⏳ Display meeting notes on church dashboard
- ⏳ Show AI summaries and action items
- ⏳ View full transcripts

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Run Database Migration

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy the contents of `/supabase-migration-fireflies.sql`
4. Run the migration
5. Verify tables were created:
   - `meeting_transcripts`
   - `fireflies_webhook_log`
   - `fireflies_settings`
   - `unmatched_fireflies_meetings`

### Step 2: Get Your Fireflies API Key

1. Go to [https://app.fireflies.ai/](https://app.fireflies.ai/)
2. Log in to your Fireflies account
3. Click **Settings** (gear icon)
4. Go to **Integrations** → **Custom Integrations**
5. Find **Fireflies API**
6. Click **Generate API Key** or copy existing key
7. Save this key (you'll need it in Step 4)

### Step 3: Deploy Your Code

```bash
git add .
git commit -m "Add Fireflies integration (Phase 2)"
git push origin main
```

Vercel will automatically deploy your changes.

### Step 4: Connect Fireflies in DNA Hub

1. Go to `https://dna.arkidentity.com/admin/settings`
2. Scroll down to **Fireflies.ai Meeting Notes** section
3. Click **Connect Fireflies.ai**
4. Paste your API key from Step 2
5. Click **Connect**
6. You should see "Fireflies connected successfully!"

### Step 5: Test It!

1. Create a Google Meet for a test call
2. Invite `fred@fireflies.ai` to the meeting
3. Have a quick 2-3 minute test conversation
4. Wait 5-10 minutes for Fireflies to process
5. Go back to `/admin/settings`
6. Check for webhook activity or unmatched meetings

---

## 📋 Detailed File Changes

### New Files Created

```
/src/lib/fireflies.ts                             # Fireflies API client
/src/app/api/webhooks/fireflies/route.ts          # Webhook handler
/src/app/api/admin/fireflies/settings/route.ts    # Settings API
/src/app/api/admin/transcripts/route.ts           # Transcripts management
/src/app/api/admin/transcripts/match/route.ts     # Manual matching
/src/app/api/transcripts/route.ts                 # Church-facing API
/supabase-migration-fireflies.sql                 # Database schema
/docs/FIREFLIES_INTEGRATION.md                    # Technical documentation
/PHASE_2_SETUP.md                                 # This file
```

### Modified Files

```
/src/lib/types.ts                                 # Added Fireflies types
/src/app/admin/settings/page.tsx                  # Added Fireflies UI
```

---

## 🔧 How It Works

### The Complete Flow

```
1. Schedule Meeting
   └─> Add fred@fireflies.ai as guest

2. Meeting Happens
   └─> Fireflies joins, records, transcribes

3. Processing (5-10 min)
   └─> AI generates summary, action items, keywords

4. Webhook Fired
   └─> Fireflies → https://dna.arkidentity.com/api/webhooks/fireflies

5. Auto-Match
   └─> Match by participant email or church name in title

6. Save to Database
   ├─> meeting_transcripts (full data)
   ├─> scheduled_calls (summary + metadata)
   └─> unmatched_fireflies_meetings (if no match)

7. Admin Review
   └─> Check /admin/settings for new transcripts

8. Approve for Church
   └─> Mark visible_to_church = true (via API)

9. Church Views
   └─> Church dashboard shows meeting notes
```

### Matching Logic

**Priority 1: Email Match**
- If any meeting attendee email matches a church leader
- Most reliable method

**Priority 2: Title Match**
- If meeting title contains a church name
- Case-insensitive search

**Priority 3: Unmatched**
- Saved to `unmatched_fireflies_meetings`
- Admin can manually match later

---

## 🎯 Using Fireflies Day-to-Day

### For Every Church Call

1. **Schedule the meeting** (Google Calendar)
2. **Add two guests:**
   - Church leader's email
   - `fred@fireflies.ai`
3. **Have the call** as usual
4. **Wait ~10 minutes** after the call
5. **Check admin settings** for the transcript
6. **Review the AI summary**
7. **Edit if needed** (remove sensitive info)
8. **Approve for church** (mark visible)
9. **Church sees it** on their dashboard

### Checking for New Transcripts

**Option 1: Admin Settings Page**
- Go to `/admin/settings`
- Scroll to "Fireflies.ai Meeting Notes"
- Check "Last transcript received"
- View "Unmatched Transcripts" section

**Option 2: API Directly**
- GET `/api/admin/transcripts`
- GET `/api/admin/transcripts?unmatched=true`

### Handling Unmatched Meetings

If a transcript couldn't be auto-matched:

1. Go to `/admin/settings`
2. Find "Unmatched Transcripts" section
3. Click "View" to see full transcript
4. Note the church it belongs to
5. Use the API to match:

```bash
curl -X POST https://dna.arkidentity.com/api/admin/transcripts/match \
  -H "Content-Type: application/json" \
  -d '{
    "unmatched_meeting_id": "uuid-from-ui",
    "church_id": "church-uuid",
    "create_call": {
      "call_type": "discovery",
      "scheduled_at": "2026-01-14T10:00:00Z"
    }
  }'
```

---

## 🔒 Security Features

### Transcripts Are Private by Default

- `visible_to_church` defaults to `false`
- Admins MUST approve before churches see them
- This lets you review and edit summaries first
- Remove sensitive info before sharing

### Row Level Security (RLS)

All tables have RLS policies:
- Admins see everything
- Churches only see their approved transcripts
- Webhook logs and settings are admin-only

### Webhook Signature Verification

Optional but recommended:
1. Generate a webhook secret
2. Add it when connecting Fireflies
3. Webhooks will be verified using HMAC SHA-256

---

## 🧪 Testing Checklist

### Before Going Live

- [ ] Database migration ran successfully
- [ ] Fireflies API key connected in settings
- [ ] Test meeting with fred@fireflies.ai
- [ ] Webhook received (check fireflies_webhook_log)
- [ ] Transcript saved to database
- [ ] Meeting auto-matched to correct church
- [ ] Can manually match unmatched meetings
- [ ] Can approve transcript for church viewing
- [ ] RLS policies working correctly

### Test Script

```bash
# 1. Check Fireflies connection
curl https://dna.arkidentity.com/api/admin/fireflies/settings

# 2. Check webhook logs
# (View in Supabase: fireflies_webhook_log table)

# 3. List all transcripts
curl https://dna.arkidentity.com/api/admin/transcripts

# 4. Check unmatched meetings
curl https://dna.arkidentity.com/api/admin/transcripts?unmatched=true

# 5. Test church view (as church user)
curl https://dna.arkidentity.com/api/transcripts
```

---

## 🐛 Troubleshooting

### Problem: "Webhook not received"

**Checks:**
1. Did Fireflies join the meeting? (check Meet participants)
2. Was the meeting recorded?
3. Check Supabase `fireflies_webhook_log` table
4. Check Vercel function logs for errors

**Solutions:**
- Ensure webhook URL is correct in Fireflies
- Verify API key is valid
- Check network/firewall settings

### Problem: "Meeting not matched"

**Checks:**
1. Church leader was invited to meeting?
2. Email matches exactly in database?
3. Auto-match enabled in settings?

**Solutions:**
- View `unmatched_fireflies_meetings` table
- Manually match via `/api/admin/transcripts/match`
- Update church leader email if needed

### Problem: "Church can't see transcript"

**Checks:**
1. `scheduled_calls.visible_to_church` = true?
2. Transcript linked to correct church?
3. Church status is `active`?
4. Church leader logged in?

**Solutions:**
- Use API to set visible_to_church
- Verify RLS policies in Supabase
- Check church_leaders table

---

## 📊 Database Query Examples

### View all transcripts
```sql
SELECT
  mt.title,
  mt.meeting_date,
  mt.ai_summary,
  sc.call_type,
  c.name as church_name
FROM meeting_transcripts mt
LEFT JOIN scheduled_calls sc ON mt.scheduled_call_id = sc.id
LEFT JOIN churches c ON sc.church_id = c.id
ORDER BY mt.meeting_date DESC;
```

### View unmatched meetings
```sql
SELECT * FROM unmatched_fireflies_meetings
WHERE matched_church_id IS NULL
ORDER BY meeting_date DESC;
```

### View webhook activity
```sql
SELECT
  fireflies_meeting_id,
  event_type,
  processed,
  error_message,
  received_at
FROM fireflies_webhook_log
ORDER BY received_at DESC
LIMIT 20;
```

### Approve transcript for church viewing
```sql
UPDATE scheduled_calls
SET visible_to_church = true
WHERE id = 'your-call-uuid';
```

---

## 🎨 Next: Church Dashboard UI

The backend is complete! The remaining work is:

1. **Update ScheduleCallCard component**
   - Add "View Notes" button for calls with transcripts
   - Display AI summary inline
   - Show action items

2. **Update JourneyTab component**
   - Add meeting notes section
   - Link transcripts to relevant milestones

3. **Create MeetingNotesModal component**
   - Full transcript viewer
   - Speaker-by-speaker breakdown
   - Timestamps and key moments

**Want me to build the church dashboard UI next?** Just say the word!

---

## 📚 API Quick Reference

### Admin Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/fireflies/settings` | GET | Get connection status |
| `/api/admin/fireflies/settings` | POST | Connect Fireflies |
| `/api/admin/fireflies/settings` | DELETE | Disconnect |
| `/api/admin/transcripts` | GET | List transcripts |
| `/api/admin/transcripts` | PATCH | Update transcript |
| `/api/admin/transcripts/match` | POST | Manual match |

### Church Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/transcripts` | GET | Get visible transcripts |

### Webhook Endpoint

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/fireflies` | POST | Receive Fireflies notifications |

---

## 💰 Fireflies Pricing Note

You mentioned you're on the **Fireflies Pro plan** ($10/month):
- ✅ 8,000 minutes/month (133+ hours)
- ✅ Unlimited AI summaries
- ✅ Unlimited transcripts
- ✅ API access
- ✅ Webhooks

This is perfect for your needs!

---

## 🚨 Important Reminder

**Before going live with real church calls:**

1. Test with internal meetings first
2. Verify auto-matching works correctly
3. Practice the admin review workflow
4. Set `auto_share_with_churches = false` initially
5. Manually approve first few transcripts
6. Train team on the approval process

**Privacy matters!** Always review transcripts before sharing with churches.

---

## ✉️ Need Help?

If you hit any issues during setup:

1. Check the logs:
   - Supabase: `fireflies_webhook_log` table
   - Vercel: Function logs for `/api/webhooks/fireflies`
2. Verify database migration ran completely
3. Test API endpoints directly with curl
4. Check Fireflies dashboard for webhook delivery status

---

**Phase 2 Status: Backend ✅ Complete | Admin UI ✅ Complete | Church UI ⏳ Pending**

*Ready to deploy and test! Let me know when you want to tackle the church dashboard UI.*
