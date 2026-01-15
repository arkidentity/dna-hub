# Fireflies Keyword Filter

## Problem

Fireflies.ai records ALL meetings where `fred@fireflies.ai` is invited. This includes:
- Personal calls
- Other work meetings
- Non-DNA related church calls
- Random meetings

We only want to process DNA-related meetings.

---

## Solution: Keyword Filtering

Before processing any Fireflies meeting, check if the title contains DNA-related keywords.

### DNA Keywords

```javascript
const dnaKeywords = [
  'dna',
  'discovery',
  'proposal',
  'strategy',
  'assessment',
  'onboarding',
  'kickoff',
  'kick-off',
  'discipleship',
  'implementation',
  'church partnership',
  'leader preparation',
];
```

### Filter Logic

```
Meeting Title Contains DNA Keywords?
├─> YES: Process normally (match to church/call/milestone)
└─> NO:  Skip and log
```

---

## How It Works

### Webhook Flow

1. **Webhook receives notification** from Fireflies
2. **Fetch AI summary** from Fireflies API
3. **Check title for DNA keywords** ← NEW STEP
   - If NO match: Skip and return success
   - If match: Continue processing
4. **Match to church** (by email or name)
5. **Match to call** (by date, then keywords)
6. **Save AI notes** to `scheduled_calls`

### Code Location

`/src/app/api/webhooks/fireflies/route.ts` - Lines 22-42

```typescript
function isDNAMeeting(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  const dnaKeywords = [...];
  return dnaKeywords.some(keyword => lowerTitle.includes(keyword));
}
```

---

## Examples

### ✅ Processed (Contains Keywords)

| Title | Matched Keyword |
|-------|----------------|
| "DNA Discovery Call - First Church" | dna, discovery |
| "Strategy Session: Implementation Timeline" | strategy, implementation |
| "Church Partnership Agreement Review" | church partnership |
| "Kickoff Meeting - DNA Leaders" | kickoff, dna |
| "Discipleship Framework Discussion" | discipleship |

### ❌ Skipped (No Keywords)

| Title | Reason |
|-------|--------|
| "Weekly Team Standup" | No DNA keywords |
| "Budget Review 2026" | No DNA keywords |
| "Personal Call with John" | No DNA keywords |
| "Marketing Planning Session" | No DNA keywords |

---

## What Happens When Skipped

### Webhook Response
```json
{
  "success": true,
  "skipped": true,
  "reason": "Not a DNA-related meeting",
  "title": "Weekly Team Standup"
}
```

### Database Log
- `fireflies_webhook_log.processed = true`
- `fireflies_webhook_log.error_message = "Skipped: Not a DNA-related meeting"`
- `fireflies_webhook_log.processed_at = [timestamp]`

### Result
- **No AI notes stored** in DNA Hub
- **Full transcript still available** on Fireflies.ai
- Webhook marked as successfully processed (no errors)

---

## Best Practices

### For Admins

**Always include DNA keywords in meeting titles:**

✅ **Good:**
- "DNA Discovery Call - First Church"
- "Strategy Session: DNA Implementation"
- "Church Partnership Review"
- "Discipleship Leader Kickoff"

❌ **Bad:**
- "Call with First Church" (too generic)
- "Meeting with Pastor John" (no keywords)
- "Weekly Check-in" (no DNA context)

### Naming Convention

Recommended format:
```
[DNA Keyword] - [Church Name] - [Optional Details]
```

Examples:
- "Discovery Call - First Church - Initial Assessment"
- "Strategy Session - Grace Community - Phase 2 Planning"
- "DNA Kickoff - New Life Church - Leader Training"

---

## Monitoring

### Check Skipped Meetings

Query the webhook log to see skipped meetings:

```sql
SELECT
  fireflies_meeting_id,
  payload->>'title' as title,
  error_message,
  received_at
FROM fireflies_webhook_log
WHERE error_message LIKE '%Skipped%'
ORDER BY received_at DESC;
```

### Stats

```sql
-- Total webhooks received
SELECT COUNT(*) FROM fireflies_webhook_log;

-- Processed (matched)
SELECT COUNT(*) FROM fireflies_webhook_log
WHERE processed = true AND error_message IS NULL;

-- Skipped (no keywords)
SELECT COUNT(*) FROM fireflies_webhook_log
WHERE error_message LIKE '%Skipped%';

-- Failed (errors)
SELECT COUNT(*) FROM fireflies_webhook_log
WHERE processed = false;
```

---

## Modifying the Filter

### Add New Keywords

Edit `/src/app/api/webhooks/fireflies/route.ts`:

```typescript
const dnaKeywords = [
  'dna',
  'discovery',
  // ... existing keywords ...
  'your-new-keyword', // Add here
];
```

### Disable Filtering (Not Recommended)

Comment out the filter check:

```typescript
// const isDNARelated = isDNAMeeting(transcript.title);
// if (!isDNARelated) { ... }
```

**Warning:** This will process ALL Fireflies meetings, including personal/unrelated calls.

---

## Edge Cases

### Case 1: Meeting Title Changed After Recording

**Scenario:** Meeting titled "Call with John" → Renamed to "DNA Discovery Call" after Fireflies processed

**Result:** Already skipped (webhook fired with old title)

**Fix:** Manually update `scheduled_calls` with AI notes from Fireflies dashboard

### Case 2: DNA Meeting Without Keywords

**Scenario:** Important DNA meeting titled "Urgent Call" (no keywords)

**Result:** Skipped by filter

**Fix:**
- Always include keywords in titles
- Or manually fetch from Fireflies and add to `scheduled_calls`

### Case 3: False Positive

**Scenario:** Non-DNA meeting titled "Discovery Phase - Marketing Campaign"

**Result:** Processed (contains "discovery")

**Impact:** Minimal - will fail church/call matching and just log a warning

---

## Performance Impact

**Negligible:**
- Simple string comparison (case-insensitive)
- Runs before expensive database queries
- Saves resources by skipping unrelated meetings early

**Efficiency Gain:**
- Avoids unnecessary church/call matching
- Prevents polluting webhook logs with unrelated meetings
- Cleaner debugging (only DNA meetings in logs)

---

## Testing

### Test Cases

1. **DNA meeting with keyword** → Should process
2. **Non-DNA meeting** → Should skip
3. **Mixed case keywords** ("dna", "DNA", "Dna") → Should process
4. **Partial keyword matches** ("discoveries" contains "discovery") → Should process
5. **Typos** ("dsicovery" instead of "discovery") → Should skip

### Test Script

```bash
# Test webhook with DNA meeting
curl -X POST http://localhost:3000/api/webhooks/fireflies \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "test-123",
    "eventType": "transcription_completed"
  }'

# Check webhook log
psql> SELECT * FROM fireflies_webhook_log WHERE fireflies_meeting_id = 'test-123';
```

---

## Summary

✅ **Benefits:**
- Only processes DNA-related meetings
- Prevents processing personal/unrelated calls
- Cleaner logs and debugging
- No performance overhead

✅ **Trade-offs:**
- Requires DNA keywords in meeting titles
- Edge case: Important meeting with no keywords gets skipped

✅ **Recommendation:**
- Keep filter enabled
- Enforce naming convention for DNA meetings
- Monitor skipped meetings regularly

---

**Last Updated:** January 14, 2026
