# Fireflies Meeting Notes Implementation

## Overview

Simplified the Fireflies integration to store **AI-generated meeting summaries only** (no full transcripts). Meeting notes are automatically attached to DNA Journey milestones and displayed in a collapsed view.

---

## What We Built

### ✅ Completed

1. **Database Schema Simplification**
   - Removed `meeting_transcripts` table (full transcript storage)
   - Removed `unmatched_fireflies_meetings` table
   - Added `milestone_id` to `scheduled_calls` table
   - Added `church_notes` to `church_progress` table
   - Kept `fireflies_webhook_log` for debugging
   - Kept `fireflies_settings` for API configuration

2. **Backend Logic**
   - Updated `matchMeetingToChurch()` to auto-match meetings to milestones
   - Added `matchCallTypeToMilestone()` helper function
   - Maps call types (discovery, proposal, strategy, etc.) to relevant milestones
   - Uses church's current phase to narrow down milestone search
   - Updated webhook handler to save milestone_id with meeting notes

3. **Frontend UI - AI Meeting Notes**
   - Collapsible "Meeting Notes" section in DNA Journey
   - Shows AI summary, action items, and keywords from Fireflies
   - Purple-themed styling to distinguish from other notes
   - Link to view full transcript on Fireflies.ai (optional)
   - Only visible when admin approves (`visible_to_church = true`)

4. **Frontend UI - Church Notes**
   - Separate "Your Notes" section for churches
   - Blue-themed styling (distinct from admin notes and AI notes)
   - Churches can add/edit their own notes on milestones
   - Stored in `church_progress.church_notes` (separate from admin notes)

---

## How It Works

### Automatic Flow

```
1. Meeting Scheduled
   └─> Church leader + fred@fireflies.ai invited

2. Meeting Happens
   └─> Fireflies records and transcribes

3. Fireflies Processes (5-10 min)
   └─> Generates AI summary + action items

4. Webhook Fired
   └─> Fireflies → DNA Hub webhook

5. Keyword Filter
   ├─> Check if title contains DNA-related keywords
   ├─> If NO: Skip and log (prevents processing non-DNA meetings)
   └─> If YES: Continue to matching

6. Auto-Matching
   ├─> Match by participant email to church
   ├─> PRIMARY: Match by date (±24 hours)
   ├─> BACKUP: Match by call type keywords
   └─> Save AI notes to scheduled_calls

7. Admin Reviews
   └─> Checks admin dashboard, marks visible_to_church = true

8. Church Views
   └─> Meeting notes appear in DNA Journey under relevant milestone
```

### Keyword Filter (Prevents Non-DNA Meetings)

Before processing, the webhook checks if the meeting title contains DNA-related keywords:

**DNA Keywords:**
- dna
- discovery
- proposal
- strategy
- assessment
- onboarding
- kickoff / kick-off
- discipleship
- implementation
- church partnership
- leader preparation

**If NO keywords match:**
- Meeting is skipped
- Logged as "Skipped: Not a DNA-related meeting"
- Webhook marked as processed
- **No AI notes stored**

**If keywords match:**
- Continue to church/call matching

This prevents processing of unrelated Fireflies meetings (personal calls, other work meetings, etc.).

### Milestone Matching Logic

Call types are mapped to milestones based on keywords:

| Call Type | Matched Milestones |
|-----------|-------------------|
| **discovery** | "Vision Alignment Meeting", "Initial Discovery" |
| **proposal** | "Review Partnership Agreement", "Proposal" |
| **strategy** | "Set Implementation Timeline", "Strategy" |
| **kickoff** | "Kick-off Meeting", "Launch", "Begin" |
| **assessment** | "Complete Dam Assessment", "Assessment" |
| **onboarding** | "Onboarding", "Getting Started" |
| **checkin** | "Check-in", "Follow-up", "Review" |

The system searches within the church's current phase (and adjacent phases) for matching milestones.

---

## Files Modified

### Database
- `/supabase-migration-fireflies-simplify.sql` - New migration to simplify schema

### Backend
- `/src/lib/fireflies.ts` - Added milestone matching logic
- `/src/app/api/webhooks/fireflies/route.ts` - Updated webhook handler
- `/src/lib/types.ts` - Updated interfaces for `ScheduledCall` and `ChurchProgress`

### Frontend
- `/src/components/dashboard/MilestoneItem.tsx` - Added AI notes + church notes UI

---

## Data Storage

### What IS Stored:
✅ AI-generated summary (text)
✅ Action items (array of strings)
✅ Keywords (array of strings)
✅ Meeting date, duration, participants
✅ Link to Fireflies (for full transcript viewing)
✅ Milestone linkage (which milestone this meeting relates to)

### What is NOT Stored:
❌ Full transcript text
❌ Sentence-by-sentence transcript
❌ Speaker-by-speaker transcript
❌ Audio/video recordings
❌ Audio/video URLs

**Full transcripts stay on Fireflies.ai**

---

## UI Components

### 1. AI Meeting Notes (Collapsed by default)

```
📋 MEETING NOTES ▶

[When expanded:]

Summary:
Discussed DNA implementation timeline. Church has 5 identified leaders...

✓ Next Steps:
• Send proposal by Friday
• Schedule follow-up strategy call
• Share leader training resources

[Keywords: timeline | leaders | resources]

→ View full transcript on Fireflies
```

**Styling:**
- Purple theme (`purple-50`, `purple-600`, `purple-700`)
- Microphone icon
- Collapsed by default, click to expand
- Only visible if `visible_to_church = true`

### 2. Church Notes

```
Your Notes:

[If no notes yet:]
+ Add your notes

[If notes exist:]
Your Notes:
"We're excited about starting in February. Main concern is..."
[Edit button]
```

**Styling:**
- Blue theme (`blue-50`, `blue-300`, `blue-700`)
- Speech bubble icon
- Always editable by churches
- Separate from admin notes (gold theme) and AI notes (purple theme)

---

## Security & Privacy

### Admin Control
- AI notes are NOT visible to churches by default
- `visible_to_church` defaults to `false`
- Admin must explicitly approve each meeting note

### Row Level Security
- Churches can only edit their own `church_notes`
- RLS policies enforce data privacy
- Webhook logs are admin-only

### Data Minimization
- Only AI summaries stored (not full transcripts)
- Smaller database footprint
- Faster queries
- Privacy-focused approach

---

## Next Steps (To Complete)

### ⏳ Remaining Tasks

1. **Wire up Church Notes in JourneyTab component**
   - Add state management for `editingChurchNotesId`
   - Add `editChurchNotesValue` state
   - Add handlers: `onStartEditingChurchNotes`, `onSaveChurchNotes`, `onCancelEditChurchNotes`
   - Pass these props to `MilestoneItem`

2. **Create API endpoint for church notes**
   - POST `/api/church/progress/notes`
   - Update `church_progress.church_notes` field
   - Verify RLS policies allow church to update their own records

3. **Update Admin Settings UI**
   - Remove "Unmatched Transcripts" section (no longer needed)
   - Simplify Fireflies connection UI
   - Show recent webhook activity

4. **Run Database Migration**
   - Execute `/supabase-migration-fireflies-simplify.sql`
   - Verify tables dropped correctly
   - Verify new columns added

5. **Testing Checklist**
   - [ ] Test Fireflies webhook receives meeting
   - [ ] Verify auto-matching to church
   - [ ] Verify auto-matching to milestone
   - [ ] Check AI notes saved to `scheduled_calls`
   - [ ] Test admin approval flow (`visible_to_church`)
   - [ ] Test church viewing AI notes in DNA Journey
   - [ ] Test church adding/editing their own notes
   - [ ] Verify RLS policies working correctly

---

## Example Use Case

### Scenario: Discovery Call with First Church

1. **Admin schedules Discovery Call** via Google Calendar
   - Invites pastor@firstchurch.com
   - Invites fred@fireflies.ai

2. **Call happens on Tuesday at 10am**
   - Discussion about DNA implementation timeline
   - 5 leaders identified, ready to start
   - Main concern: balancing with existing programs

3. **Fireflies processes (10 minutes later)**
   - AI Summary: "Discussed DNA implementation timeline. Church has 5 identified leaders ready to start. Main concern is balancing with existing programs."
   - Action Items: ["Send proposal by Friday", "Schedule follow-up strategy call", "Share leader training resources"]
   - Keywords: ["timeline", "leaders", "existing programs"]

4. **Webhook fires**
   - Matches to "First Church" by email (pastor@firstchurch.com)
   - Matches to "Vision Alignment Meeting" milestone (Phase 1)
   - Saves AI notes to database

5. **Admin reviews**
   - Checks `/admin` dashboard
   - Reviews AI summary (looks good!)
   - Marks `visible_to_church = true`

6. **Church sees meeting notes**
   - Logs in to DNA Hub
   - Goes to DNA Journey → Phase 1 → "Vision Alignment Meeting"
   - Sees collapsed "Meeting Notes" section
   - Clicks to expand, reads AI summary and action items
   - Clicks "Add your notes" to add: "Excited to start! Need to finalize February launch date."

---

## Color Coding Summary

| Note Type | Color | Icon | Who Can Edit |
|-----------|-------|------|--------------|
| **Admin Notes** | Gold (`gold`, `gold/5`, `gold/30`) | 💬 MessageSquare | Admin only |
| **AI Meeting Notes** | Purple (`purple-50`, `purple-600`) | 🎤 Mic | Nobody (read-only) |
| **Church Notes** | Blue (`blue-50`, `blue-300`, `blue-700`) | 💬 MessageSquare | Church leaders |

---

## Migration Instructions

### Step 1: Backup
```sql
-- Backup existing Fireflies data (just in case)
SELECT * FROM meeting_transcripts;
SELECT * FROM unmatched_fireflies_meetings;
```

### Step 2: Run Migration
```bash
# Copy contents of supabase-migration-fireflies-simplify.sql
# Run in Supabase SQL Editor
```

### Step 3: Verify
```sql
-- Check new columns exist
SELECT milestone_id FROM scheduled_calls LIMIT 1;
SELECT church_notes FROM church_progress LIMIT 1;

-- Check old tables are gone
SELECT * FROM meeting_transcripts; -- Should error
SELECT * FROM unmatched_fireflies_meetings; -- Should error
```

### Step 4: Deploy Code
```bash
git add .
git commit -m "Simplify Fireflies: AI meeting notes only, attached to milestones"
git push origin main
```

---

## Troubleshooting

### Meeting was skipped (not processed)
**Symptoms:**
- Meeting recorded in Fireflies
- No AI notes in DNA Hub
- Webhook log shows "Skipped: Not a DNA-related meeting"

**Cause:**
- Meeting title doesn't contain DNA-related keywords

**Fix:**
- Rename meeting title to include keywords like "DNA", "Discovery", "Strategy", etc.
- Or manually update `scheduled_calls` with AI notes from Fireflies

**Prevention:**
- Always include DNA-related keywords in meeting titles
- Examples: "DNA Discovery Call - First Church", "Strategy Session - DNA Implementation"

### Meeting not matched to milestone
**Check:**
- Is the meeting title using standard call type keywords?
- Is the church in the correct phase?
- Are there milestones with matching titles in that phase?

**Fix:**
- Admin can manually update `scheduled_calls.milestone_id` via SQL
- Or adjust milestone title matching logic

### Church can't see meeting notes
**Check:**
- Is `scheduled_calls.visible_to_church = true`?
- Is the church leader logged in correctly?
- Are RLS policies active?

**Fix:**
- Admin should approve the notes first
- Verify RLS policies in Supabase

### Church notes not saving
**Check:**
- Does API endpoint exist? (Need to create `/api/church/progress/notes`)
- Do RLS policies allow church to update `church_progress`?

**Fix:**
- Create the API endpoint
- Verify RLS policy exists for church updates

---

## Architecture Decisions

### Why simplify to AI summaries only?

1. **Privacy** - Full transcripts contain sensitive info
2. **Database size** - Summaries are 100x smaller than full transcripts
3. **Cost** - Less storage = lower costs
4. **Focus** - Churches want actionable insights, not verbose transcripts
5. **Speed** - Faster queries and page loads

### Why attach to milestones?

1. **Context** - Meeting notes make sense in the DNA Journey timeline
2. **Organization** - Notes grouped by phase/milestone
3. **Relevance** - Easy to find notes related to specific milestones
4. **Auto-matching** - Less manual admin work

### Why separate church notes?

1. **Collaboration** - Churches can add their perspective
2. **Ownership** - Churches feel ownership over their notes
3. **Distinction** - Clear separation: AI notes (purple), admin notes (gold), church notes (blue)
4. **Privacy** - Churches control what they write

---

## Future Enhancements

### Phase 3 (Optional)
- Email notifications when new meeting notes available
- Search/filter meeting notes
- Export notes as PDF
- Admin UI for bulk approving multiple notes
- Custom AI prompts for summaries
- Meeting notes in multiple languages

---

**Status:** Backend ✅ | Frontend UI ✅ | API Wiring ⏳ | Testing ⏳

**Last Updated:** January 14, 2026
