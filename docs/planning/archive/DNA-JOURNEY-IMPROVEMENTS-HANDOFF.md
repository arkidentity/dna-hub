# DNA Journey Improvements - Handoff Document

**Date:** February 3, 2026
**Status:** Superseded by Migration 032

> **NOTE:** The "hidden milestones" approach described in this document (migration 030) has been replaced by the Template-Based Milestone System (migration 032). With migration 032:
> - Each church gets their own COPY of milestones
> - Milestones can be edited/deleted directly per church
> - No need for the `church_hidden_milestones` table (it was dropped)
>
> See `/docs/planning/TEMPLATE-MILESTONE-REFACTOR.md` for the current architecture.

---

## Summary

This document outlines the DNA Journey improvements implemented in this session. These changes address several usability issues reported with the church implementation dashboard.

---

## Changes Implemented

### 1. Completed Calls Hidden from Overview

**Problem:** The Overview tab in the church detail page was showing all calls, including completed ones, making it hard to see upcoming calls.

**Solution:**
- Modified `AdminChurchOverviewTab.tsx` to filter out completed calls
- Changed header from "Scheduled Calls" to "Upcoming Calls"
- Only shows calls where `completed === false`

**Files Changed:**
- `src/components/admin/AdminChurchOverviewTab.tsx`

---

### 2. Reorder Arrows Now Always Visible

**Problem:** The up/down reorder arrows for milestones were only visible on hover, making them hard to discover.

**Solution:**
- Removed `opacity-0 group-hover:opacity-100` classes
- Arrows are now always visible
- Increased icon size from `w-3 h-3` to `w-4 h-4`
- Delete button also now always visible

**Files Changed:**
- `src/components/admin/AdminChurchJourneyTab.tsx`

---

### 3. Milestone Title/Description Editing

**Problem:** Milestone titles and descriptions could not be edited after creation, limiting flexibility.

**Solution:**
- Added pencil icon next to each milestone title
- Clicking opens inline edit mode with:
  - Title field (required)
  - Description field (optional)
  - "Key Milestone" toggle
  - Save/Cancel buttons
- Works for both template and custom milestones

**Files Changed:**
- `src/components/admin/AdminChurchJourneyTab.tsx` (frontend)
- `src/app/api/admin/church/[id]/milestones/route.ts` (API)

---

### 4. Delete/Hide Any Milestone

**Problem:** Only custom milestones could be deleted. Template milestones were permanent.

**Solution:**
- **Custom milestones:** Permanently deleted
- **Template milestones:** Hidden for the specific church (soft delete using new table)
- Delete button now visible for all milestones
- Confirmation message differs based on milestone type

**Files Changed:**
- `src/components/admin/AdminChurchJourneyTab.tsx` (frontend)
- `src/app/api/admin/church/[id]/milestones/route.ts` (delete/hide logic)
- `src/app/api/admin/church/[id]/route.ts` (filter hidden milestones)

**New Database Migration Required:**
- `database/030_hidden-milestones.sql`

---

## Database Migration

**IMPORTANT:** Before testing, you must run the new migration in Supabase SQL Editor:

```sql
-- Migration 030: Hidden Milestones
-- Allows churches to hide template milestones from their DNA Journey

-- Create table to track hidden milestones per church
CREATE TABLE IF NOT EXISTS church_hidden_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    hidden_at TIMESTAMPTZ DEFAULT NOW(),
    hidden_by TEXT, -- Admin email who hid it
    UNIQUE(church_id, milestone_id)
);

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_church_hidden_milestones_church
ON church_hidden_milestones(church_id);

CREATE INDEX IF NOT EXISTS idx_church_hidden_milestones_milestone
ON church_hidden_milestones(milestone_id);

COMMENT ON TABLE church_hidden_milestones IS 'Tracks which template milestones are hidden for specific churches';
```

---

## Testing Checklist

### Completed Calls Filter
- [ ] Go to Admin > Churches > Select a church > Overview tab
- [ ] Verify "Upcoming Calls" only shows non-completed calls
- [ ] Mark a call as complete and verify it disappears from the list
- [ ] Add a new call and verify it appears

### Reorder Arrows
- [ ] Go to DNA Journey tab
- [ ] Expand a phase with multiple milestones
- [ ] Verify up/down arrows are visible without hovering
- [ ] Click up arrow on a milestone - verify it moves up
- [ ] Click down arrow on a milestone - verify it moves down
- [ ] Verify first milestone can't move up (grayed out)
- [ ] Verify last milestone can't move down (grayed out)

### Milestone Editing
- [ ] Click pencil icon next to any milestone title
- [ ] Verify edit form appears with current values
- [ ] Edit title and save - verify change persists
- [ ] Edit description and save
- [ ] Toggle "Key Milestone" and save - verify badge updates
- [ ] Cancel edit and verify no changes saved

### Delete/Hide Milestones
- [ ] Add a custom milestone to a phase
- [ ] Delete the custom milestone - verify permanent deletion
- [ ] Click delete on a template milestone - verify "hide" message
- [ ] Confirm hide - verify milestone disappears
- [ ] Refresh page - verify hidden milestone stays hidden

---

## Known Issues / Future Work

### Google Calendar Sync
The discovery call mis-assignment for Boulevard Church is still an issue. The root cause:
- Google Calendar event titled "DNA meeting" doesn't match "discovery" keyword
- The matching algorithm needs "discovery" specifically in the title
- Manual reassignment of call types is available as workaround

**Recommendation:** Investigate and possibly improve keyword matching in `/src/lib/google-calendar.ts`

### Assessment to PDF
Church assessment data is visible in admin but not easily attachable to milestones.

**Recommendation:** Add a "Attach Assessment" button on the Church Assessment milestone that auto-generates or copies assessment data.

### Strategy Calls Confusion
Multiple "Strategy Call" milestones exist from the migration. May need cleanup.

**Recommendation:** Review and consolidate strategy call milestones per church.

---

## Deployment Steps

1. **Run Database Migration**
   - Go to Supabase SQL Editor
   - Run `database/030_hidden-milestones.sql`
   - Verify table was created: `SELECT * FROM church_hidden_milestones LIMIT 1;`

2. **Deploy Code**
   - Push changes to your deployment pipeline
   - Or run `npm run build` to verify build succeeds
   - Deploy to production

3. **Test**
   - Follow the testing checklist above
   - Use Boulevard Church as test case

---

## File Change Summary

| File | Change |
|------|--------|
| `src/components/admin/AdminChurchOverviewTab.tsx` | Filter completed calls |
| `src/components/admin/AdminChurchJourneyTab.tsx` | Reorder arrows, editing, delete all milestones |
| `src/app/api/admin/church/[id]/milestones/route.ts` | Title/desc editing, hide/delete logic |
| `src/app/api/admin/church/[id]/route.ts` | Filter hidden milestones |
| `database/030_hidden-milestones.sql` | New table for hidden milestones |
| `database/README.md` | Documentation update |

---

## Contact

If you have questions about these changes, the code is well-commented and follows existing patterns in the codebase.
