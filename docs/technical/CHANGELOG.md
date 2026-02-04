# Changelog

All notable changes to DNA Hub are documented here.

## [2026-02-04] Fix milestone_resources Foreign Key (Migration 033)

### Fixed

#### milestone_resources Table
- **Problem:** After migration 032, `milestone_resources` still had FK to `milestones` (now `milestones_deprecated`)
- **Solution:** Updated FK to reference `template_milestones` instead
- Global resources are now linked at the **template level**, not per-church
- Dashboard API updated to join via `church_milestones.source_milestone_id`

#### Dashboard API Fix
- Fixed 500 error on church dashboard caused by orphaned FK constraint
- Simplified progress query (removed `completed_by_leader` join that was causing issues)
- Changed from `supabaseAdmin` import to `getSupabaseAdmin()` function call (matches admin pattern)

### Files Modified
| File | Change |
|------|--------|
| `database/033_fix_milestone_resources.sql` | New migration to fix FK constraint |
| `/src/app/api/dashboard/route.ts` | Updated to use `getSupabaseAdmin()`, join resources via `source_milestone_id` |
| `/src/app/api/admin/church/[id]/route.ts` | Updated resource mapping for admin view |
| `docs/technical/DATA_MODELS.md` | Updated `milestone_resources` documentation |

### Migration Notes

Run `database/033_fix_milestone_resources.sql` to:
1. Drop old FK constraint referencing `milestones_deprecated`
2. Truncate stale data from `milestone_resources`
3. Add new FK constraint referencing `template_milestones`

---

## [2026-02-03] Template-Based Milestone System (Migration 032)

### Added

#### Template Milestone System
- **New tables:** `journey_templates`, `template_milestones`, `church_milestones`
- Each church now gets their own COPY of milestones (fully editable)
- Editing a milestone only affects that specific church
- New columns on `churches` table: `journey_template_id`, `template_applied_at`
- New API endpoint: `/api/admin/church/[id]/apply-template` - copies template to church
- "Apply Template" button in admin UI for new churches

#### Template Content
- **Phase 0 (Onboarding):** Discovery Call Notes, Proposal Call Notes, Agreement Call Notes, Kick-off Notes
- **Phase 1 (Church Partnership):** Vision Alignment Meeting, Identify Church DNA Champion, Leaders Complete Flow Assessment, Review Pastor's Guide to Flow Assessment, Flow Assessment Debrief Meetings
- **Phases 2-5:** Empty structures - admin adds custom milestones per church as needed

### Changed

#### Milestone Architecture
- `church_progress.milestone_id` now references `church_milestones` (not `milestones`)
- Removed "hide milestone" functionality (no longer needed with per-church copies)
- API routes updated to query `church_milestones` instead of `milestones`

#### Files Modified
| File | Change |
|------|--------|
| `/src/lib/types.ts` | Added `JourneyTemplate`, `TemplateMilestone`, `ChurchMilestone` interfaces |
| `/src/app/api/admin/church/[id]/route.ts` | Query `church_milestones` |
| `/src/app/api/admin/church/[id]/milestones/route.ts` | Simplified CRUD for `church_milestones` |
| `/src/app/api/dashboard/route.ts` | Query `church_milestones` |
| `/src/app/api/progress/route.ts` | Reference `church_milestones` |
| `/src/components/admin/AdminChurchJourneyTab.tsx` | Removed hide logic, added "Apply Template" button |

### Deprecated

- `milestones` table renamed to `milestones_deprecated` (kept for rollback)
- `church_hidden_milestones` table dropped (no longer needed)

### Migration Notes

Run `database/032_template_milestones.sql` to:
1. Create new tables
2. Migrate existing church data to `church_milestones`
3. Preserve all progress and attachments
4. Update foreign key constraints

---

## [Unreleased]

### Added

#### Global Resources System
- **New tables:** `global_resources` and `milestone_resources`
- Template resources (PDFs, guides, worksheets) that are available to all churches
- Resources can be linked to specific milestones via junction table
- Resource types: `pdf`, `video`, `link`, `guide`, `worksheet`
- Categories for organization: `welcome_package`, `phase_1`, `training`, etc.
- Initial resources seeded:
  - Leader Identification Worksheet (Phase 2)
  - Pastor's Guide to Dam Assessment (Phase 1)
  - Vision Casting Guide (Phase 2)
  - DNA Launch Guide (Phase 4)

#### Custom Church Milestones
- Added `church_id` column to `milestones` table
- `church_id = NULL` means template milestone (shown to all churches)
- `church_id = [uuid]` means custom milestone for that specific church only
- Enables per-church customization of the implementation curriculum

#### Admin Notes
- Added `admin_notes` field to `church_progress` table
- Private notes visible only to admins, not shown to church leaders
- Allows admins to track internal context about milestone progress

#### Kick-Off Call Milestone
- Added "Kick-Off Notes" milestone to Phase 0 (Onboarding)
- Captures notes and action items from kick-off meetings

### Changed

#### Milestone Naming
- Renamed milestone titles to remove "Notes" suffix for cleaner UI:
  - "Discovery Call Notes" → "Discovery Call"
  - "Agreement Call Notes" → "Agreement Call"
  - "Strategy Call Notes" → "Strategy Call"
  - "Kick-Off Notes" → "Kick-Off Call"

#### Documentation
- Updated `DATA_MODELS.md` with new tables and fields
- Updated `CODEBASE_MAP.md` with new migration files
- Added `docs/resources/` for static resource PDFs
- Added `docs/BLVD/` for BLVD church-specific documents

### Database Migrations

| Migration File | Purpose |
|----------------|---------|
| `supabase-migration-resources.sql` | Global resources system |
| `supabase-migration-custom-milestones.sql` | Church-specific milestones |
| `supabase-migration-admin-notes.sql` | Admin notes on progress |
| `supabase-migration-kickoff-notes.sql` | Kick-off milestone |
| `supabase-migration-rename-milestones.sql` | Milestone title cleanup |

---

## Earlier Changes

See git history for changes prior to this changelog.
