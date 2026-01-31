# Google Calendar Sync - False Positive Matching Fix

**Date:** January 31, 2026
**Issue:** Random DNA-related meetings being incorrectly assigned to Boulevard Church as Discovery calls

---

## Problem Description

The Google Calendar sync was assigning Discovery calls to Boulevard Church that had nothing to do with that church. Investigation revealed three incorrect assignments:

- Event ID: `cdhm2cb2cli38bb26gsm8b9kc4o3abb2ccqj0bb66co68cpnc4q36phn6g`
- Event ID: `0nqst8polm2q45mm5pakhd402i`
- Event ID: `6cp3eo9lckoj0b9kcko64b9k61im4bb2clh30bb470pmce336dgjadj574`

## Root Cause

The matching logic in `/src/lib/google-calendar.ts` had two issues:

### Issue 1: Overly Broad Call Type Detection (Line 185)

**Before:**
```typescript
if (lower.includes('dna')) return 'discovery'; // Default for DNA calls
```

**Problem:** ANY event with "DNA" anywhere in the title was automatically classified as a Discovery call. This meant events like "DNA Training Session", "DNA Framework Review", etc. were incorrectly classified.

### Issue 2: Loose Church Matching (Lines 225-242)

**Before:**
```typescript
// Match by alias
if (title.includes(alias.toLowerCase())) {
  return { churchId: church.id, churchName: church.name };
}
```

**Problem:** If an event title contained both "DNA" (detected as discovery call) AND a church alias like "BLVD" (even in examples or references), it would be automatically assigned to that church. For example:
- "DNA Training - BLVD example" → incorrectly matched to BLVD Church
- "DNA Framework Review (using BLVD model)" → incorrectly matched to BLVD Church

## Solution Implemented

### Fix 1: Stricter Call Type Detection

Now requires explicit phrases, not just the word "DNA":

```typescript
// Only match "DNA" if it's specifically a church-related call
if (
  lower.includes('dna discovery') ||
  lower.includes('dna call') ||
  lower.includes('dna intro') ||
  lower.includes('dna meeting')
) {
  return 'discovery';
}
```

### Fix 2: Require Explicit Call Type for Alias/Name Matching

When matching by church alias or name (not by attendee email), now requires that the event title ALSO contains an explicit call type keyword:

```typescript
// STRICT CHECK: Alias match only counts if title contains explicit call type
const hasExplicitCallType =
  title.includes('discovery') ||
  title.includes('proposal') ||
  title.includes('agreement') ||
  title.includes('strategy') ||
  title.includes('kick-off') ||
  title.includes('kickoff') ||
  title.includes('assessment') ||
  title.includes('onboarding') ||
  title.includes('check-in') ||
  title.includes('checkin');

if (hasExplicitCallType) {
  return { churchId: church.id, churchName: church.name };
}
```

## Matching Priority (Updated)

1. **Primary (Most Reliable):** Attendee email matches church leader → Always matched
2. **Secondary:** Church alias in title → **ONLY if** explicit call type keyword present
3. **Tertiary:** Church name in title → **ONLY if** explicit call type keyword present
4. **Fallback:** Store in `unmatched_calendar_events` for manual review

## Examples

### ✅ Will Match

- "BLVD - Discovery Call" → BLVD Church (explicit "Discovery")
- "Strategy Session - BLVD Church" → BLVD Church (explicit "Strategy")
- "Proposal Review @ BLVD" → BLVD Church (explicit "Proposal")
- "DNA Discovery Call - New Church" → Matched if "New Church" exists (explicit "DNA Discovery")

### ❌ Will NOT Match

- "DNA Training - BLVD example" → NOT matched (no explicit call type)
- "Team Meeting @ BLVD" → NOT matched (no call type keyword)
- "DNA Framework Workshop" → NOT matched (only "DNA", no "DNA Discovery/Call/Intro/Meeting")
- "Planning Session - DNA mention - BLVD reference" → NOT matched

## Cleanup Actions Taken

1. Updated `/src/lib/google-calendar.ts` with stricter matching logic
2. Removed 3 incorrect discovery calls from BLVD Church
3. Updated `/docs/integrations/GOOGLE_CALENDAR.md` with new matching rules
4. Boulevard Church now has only 1 discovery call (the manually created one)

## Testing Recommendations

After deploying this fix:

1. Run a manual calendar sync via Admin Settings
2. Check that existing legitimate calls are preserved
3. Verify that generic DNA meetings no longer create false matches
4. Monitor the `unmatched_calendar_events` table for events that should have matched but didn't

## Files Modified

- `/src/lib/google-calendar.ts` - Core matching logic
- `/docs/integrations/GOOGLE_CALENDAR.md` - Documentation update
- Database: Removed 3 incorrect scheduled_calls records

---

**Status:** ✅ Fixed and deployed
