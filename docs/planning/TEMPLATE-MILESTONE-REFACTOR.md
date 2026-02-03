# Template-Based Milestone System Refactor

**Date:** February 3, 2026
**Status:** Implemented

## Goal
Create a template system where:
1. Milestones are COPIED to each church (not shared)
2. Each church can edit their milestone titles/descriptions independently
3. Phase 0 and 1 are pre-populated; Phases 2-5 are empty structures to customize per church

---

## Problem Statement

Currently, when an admin edits a template milestone's title or description, it affects ALL churches. This is because:
- Template milestones have `church_id IS NULL` and are shared
- Only custom milestones (`church_id = {uuid}`) are church-specific

We need each church to have their own editable copy of milestones.

---

## Database Changes (Migration 032)

### New Tables

**1. `journey_templates`**
```sql
CREATE TABLE journey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- Single template for now: "Standard DNA Journey"
- Supports multiple templates in future

**2. `template_milestones`**
```sql
CREATE TABLE template_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES journey_templates(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_url TEXT,
  resource_type VARCHAR(50),
  display_order INTEGER NOT NULL,
  is_key_milestone BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- Master milestone definitions (not tied to any church)
- Only Phase 0 and 1 populated initially
- Phases 2-5 exist but are empty (admin adds custom milestones per church)

**3. `church_milestones`**
```sql
CREATE TABLE church_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_url TEXT,
  resource_type VARCHAR(50),
  display_order INTEGER NOT NULL,
  is_key_milestone BOOLEAN DEFAULT FALSE,
  source_template_id UUID REFERENCES journey_templates(id),
  source_milestone_id UUID REFERENCES template_milestones(id),
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- Church-specific copies of milestones
- Fully editable per church
- Tracks `source_template_id` for reference

**4. Update `churches` table**
```sql
ALTER TABLE churches
ADD COLUMN journey_template_id UUID REFERENCES journey_templates(id),
ADD COLUMN template_applied_at TIMESTAMPTZ;
```

### Data Migration
1. Create "Standard DNA Journey" template
2. Move existing template milestones (church_id IS NULL) → `template_milestones`
3. For existing active churches (BLVD, Cross Culture):
   - Copy their visible milestones → `church_milestones`
   - Preserve their `church_progress` data
   - Preserve `milestone_attachments`
4. Deprecate (don't delete) old `milestones` table
5. Drop `church_hidden_milestones` (no longer needed)

---

## API Changes

### Modified Routes
| Route | Change |
|-------|--------|
| `/api/admin/church/[id]` | Query `church_milestones` instead of `milestones` |
| `/api/admin/church/[id]/milestones` | CRUD on `church_milestones` directly |
| `/api/dashboard` | Query `church_milestones` for church view |
| `/api/progress` | Reference `church_milestones` |

### New Route
| Route | Purpose |
|-------|---------|
| `/api/admin/church/[id]/apply-template` | Copy template milestones to church when activated |

---

## UI Workflow

### When Church Status → Active
1. If no template applied yet, show "Apply Template" button
2. Admin clicks → copies Phase 0 & 1 milestones to that church
3. Phases 2-5 start empty, admin adds custom milestones as needed

### Milestone Editing
- Edit title/description → only affects that church
- Delete milestone → permanently removes from that church
- Add milestone → creates church-specific milestone
- No more "hide" concept needed

---

## Type Updates (`/src/lib/types.ts`)

```typescript
interface JourneyTemplate {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
}

interface ChurchMilestone {
  id: string;
  church_id: string;
  phase_id: string;
  title: string;
  description?: string;
  display_order: number;
  is_key_milestone: boolean;
  is_custom: boolean;  // true = manually added
  source_template_id?: string;
  source_milestone_id?: string;
}
```

---

## Files to Modify

| File | Action |
|------|--------|
| `database/032_template_milestones.sql` | **Create** - New tables + data migration |
| `database/README.md` | Update with migration 032 |
| `/src/lib/types.ts` | Add new interfaces |
| `/src/app/api/admin/church/[id]/route.ts` | Query church_milestones |
| `/src/app/api/admin/church/[id]/milestones/route.ts` | Simplify CRUD |
| `/src/app/api/dashboard/route.ts` | Query church_milestones |
| `/src/app/api/progress/route.ts` | Update milestone reference |
| `/src/app/api/admin/church/[id]/apply-template/route.ts` | **Create** - Template application |
| `/src/components/admin/AdminChurchJourneyTab.tsx` | Remove hide logic, add "Apply Template" |

---

## Template Content (Phase 0 & 1 Only)

### Phase 0: Onboarding
- Discovery Call Notes
- Proposal Call Notes
- Agreement Call Notes
- Kick-off Notes

### Phase 1: Church Partnership
- Vision Alignment Meeting
- Identify Church DNA Champion
- Leaders Complete Flow Assessment
- Review Pastor's Guide to Flow Assessment
- Flow Assessment Debrief Meetings

### Phases 2-5: Empty
- Structure exists (phases table unchanged)
- No template milestones
- Admin adds custom milestones per church as needed

---

## Verification

1. **Database**: Run migration, verify tables created
2. **Existing data**: Check BLVD and Cross Culture have their milestones in `church_milestones`
3. **Admin UI**: Edit a milestone title for one church, confirm other churches unaffected
4. **Church dashboard**: Verify milestones display correctly
5. **Progress**: Complete a milestone, verify it persists

---

## Rollback Plan

- Keep `milestones` table renamed as `milestones_deprecated` for 30 days
- Git revert for code changes
- SQL script to restore if needed

---

## Implementation Order

1. **Phase 1: Database & Types**
   - Write and test migration SQL
   - Update TypeScript types
   - Create backup of production data

2. **Phase 2: API Changes**
   - Update existing API routes
   - Create apply-template endpoint

3. **Phase 3: UI Updates**
   - Template application button in admin
   - Remove hidden milestone UI logic
   - Test admin journey tab

4. **Phase 4: Migration & Testing**
   - Run migration on staging
   - Test with existing churches
   - Fix any issues
   - Deploy to production
