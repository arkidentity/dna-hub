# Changelog

All notable changes to DNA Hub are documented here.

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
