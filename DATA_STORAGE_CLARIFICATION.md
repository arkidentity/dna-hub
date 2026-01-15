# Fireflies Data Storage - What We Store vs. What We Don't

## ✅ What IS Stored in DNA Hub

We **ONLY** store AI-generated summaries and highlights:

### From `scheduled_calls` table:
- ✅ **AI Summary** - High-level overview of the meeting
- ✅ **Action Items** - Array of next steps extracted by AI
- ✅ **Keywords** - Important topics identified by AI
- ✅ **Link to Fireflies** - URL to view full transcript on Fireflies.ai

### From `meeting_transcripts` table:
- ✅ **Meeting Metadata** - Title, date, duration, participants
- ✅ **AI Summary** - Same as above (duplicated for reference)
- ✅ **Action Items** - Same as above
- ✅ **Keywords** - Same as above
- ✅ **Key Moments** - AI-identified highlights with timestamps
- ✅ **Fireflies Meeting ID** - For linking back to Fireflies
- ✅ **Link to Fireflies** - URL to view full transcript

---

## ❌ What is NOT Stored in DNA Hub

We **DO NOT** store full transcripts or recordings:

- ❌ **Full Transcript Text** - NOT stored
- ❌ **Sentence-by-Sentence Transcript** - NOT stored
- ❌ **Speaker-by-Speaker Transcript** - NOT stored
- ❌ **Audio Recording** - NOT stored
- ❌ **Video Recording** - NOT stored
- ❌ **Audio URL** - NOT stored
- ❌ **Video URL** - NOT stored

---

## 🔗 Where Full Transcripts Live

Full transcripts, audio, and video remain on **Fireflies.ai**.

If you or a church leader needs to see the full transcript:
1. Click the "View Transcript" link in DNA Hub
2. Opens Fireflies.ai in new tab
3. View full transcript with speaker identification and timestamps there

---

## 📊 Example of What's Stored

### In `scheduled_calls`:
```json
{
  "id": "uuid",
  "church_id": "uuid",
  "call_type": "discovery",
  "scheduled_at": "2026-01-14T10:00:00Z",
  "completed": true,
  "fireflies_meeting_id": "abc123",
  "transcript_url": "https://app.fireflies.ai/view/abc123",
  "ai_summary": "Discussed DNA implementation timeline. Church has 5 identified leaders ready to start. Main concern is balancing with existing programs.",
  "action_items": [
    "Send proposal by Friday",
    "Schedule follow-up strategy call for next week",
    "Share leader training resources"
  ],
  "keywords": ["timeline", "leaders", "existing programs", "resources"],
  "visible_to_church": false
}
```

### In `meeting_transcripts`:
```json
{
  "id": "uuid",
  "scheduled_call_id": "uuid",
  "fireflies_meeting_id": "abc123",
  "title": "Discovery Call - First Church",
  "duration": 1800,
  "meeting_date": "2026-01-14T10:00:00Z",
  "participants": ["pastor@firstchurch.com", "admin@dna.com"],
  "ai_summary": "Same as above",
  "action_items": ["Same as above"],
  "keywords": ["Same as above"],
  "key_moments": [
    {
      "title": "Discussion about leader readiness",
      "description": "Church has 5 leaders who completed DNA training",
      "start_time": 420
    }
  ],
  "transcript_url": "https://app.fireflies.ai/view/abc123",
  "full_transcript": null,
  "sentences": null,
  "audio_url": null,
  "video_url": null
}
```

---

## 🎯 Why This Approach?

### Benefits:
1. **Privacy** - Full conversation details stay on Fireflies
2. **Database Size** - Summaries are tiny compared to full transcripts
3. **Cost** - Less storage = lower costs
4. **Speed** - Faster queries and page loads
5. **Focus** - Churches see actionable insights, not verbose transcripts
6. **Flexibility** - Can still view full transcript on Fireflies if needed

### What Churches See:
- Meeting date and type (Discovery, Proposal, etc.)
- AI summary of key points
- Action items (what to do next)
- Keywords (topics discussed)
- Link to view full transcript on Fireflies (if they want details)

---

## 🔒 Data Flow

```
1. Meeting Happens
   └─> Fireflies records and transcribes

2. Fireflies Processes (5-10 min)
   └─> Generates AI summary, action items, keywords

3. Fireflies Stores
   ├─> Full transcript (on Fireflies.ai)
   ├─> Audio/video (on Fireflies.ai)
   └─> AI summary (on Fireflies.ai)

4. Webhook to DNA Hub
   └─> DNA Hub fetches ONLY:
       ├─> AI summary
       ├─> Action items
       ├─> Keywords
       ├─> Key moments
       └─> Link to Fireflies

5. DNA Hub Stores
   └─> Only the AI-generated content (no full transcript)

6. Churches See
   └─> Summary + Action Items + Link to full transcript
```

---

## 📝 What Gets Shared with Churches

When you mark a transcript `visible_to_church = true`, churches see:

**✅ Shared:**
- Meeting date and type
- AI summary
- Action items
- Keywords
- Link to view full transcript on Fireflies

**❌ NOT Shared (unless you explicitly approve):**
- Nothing! All meeting data requires admin approval before churches can see it.

---

## 🔧 Technical Implementation

### GraphQL Query to Fireflies:
```graphql
query GetTranscript($id: String!) {
  transcript(id: $id) {
    id
    title
    date
    duration
    participants { name, email }
    transcript_url
    summary {
      overview
      action_items
      keywords
      key_moments { title, description, start_time }
    }
  }
}
```

**Note:** We intentionally do NOT fetch:
- `sentences` field (full transcript)
- `audio_url` field
- `video_url` field

### Code Location:
- `/src/lib/fireflies.ts` - `fetchTranscript()` function (line 168)
- See comments: "We intentionally do NOT store full_transcript or sentences"

---

## ✨ Summary

**You wanted:** AI summaries, action items, and highlights - NOT full transcripts
**What we built:** Exactly that! ✅

Full transcripts stay on Fireflies.ai where they belong, and DNA Hub only stores the actionable insights.

---

*Last updated: January 14, 2026*
