# Changelog

All notable changes to DNA Hub are documented here.

## [2026-02-12] Global Resources Admin UI

### Added

#### Global Resources — Full CRUD (Admin)
- **`GET /api/admin/resources`** — fetch all resources (admin only)
- **`POST /api/admin/resources`** — create resource with validation
- **`PUT /api/admin/resources/[id]`** — update resource properties
- **`DELETE /api/admin/resources/[id]`** — delete resource + Supabase Storage cleanup
- **`POST /api/admin/resources/upload`** — PDF upload to `global-resources` Storage bucket (10MB max, PDF only, timestamped filename, returns public URL)
- **`ResourcesTab`** (`/src/components/admin/ResourcesTab.tsx`) — full CRUD UI in `/admin` dashboard
  - Stats cards: total resources, active count, type breakdown
  - Add/edit modal with file upload, type selection (PDF/video/link), category, display order, active toggle
  - Delete confirmation with Storage cleanup
  - View, edit, delete, toggle visibility per resource

| File | Change |
|------|--------|
| `/src/app/api/admin/resources/route.ts` | New — GET + POST |
| `/src/app/api/admin/resources/[id]/route.ts` | New — PUT + DELETE |
| `/src/app/api/admin/resources/upload/route.ts` | New — PDF file upload |
| `/src/components/admin/ResourcesTab.tsx` | New — admin CRUD component |
| `/src/app/admin/page.tsx` | Updated — Resources tab integrated |

---

## [2026-02-12] Groups Calendar — Full Build + Bug Fixes

### Added

#### Calendar — Create / View / Edit / Delete (Migrations 046, 048, 049)
- **New table:** `dna_calendar_events` (Migration 046) — stores single + recurring group meetings, cohort events, church events. Full RLS policy set.
- **New RPC:** `get_my_calendar_events(start_date, end_date)` — SECURITY DEFINER, JWT-scoped visibility, instances-only filter (Migration 048).
- **Co-leader invitations** (Migration 049) — `co_leader_invitations` table + `pending_co_leader_id` / `co_leader_invited_at` on `dna_groups`.
- **`POST /api/calendar/events`** — create single or recurring event. End date timezone-safe.
- **`GET /api/calendar/events?group_id=X`** — group-scoped direct query (admin client).
- **`PATCH /api/calendar/events/[id]`** — edit with scope: `this` / `this_and_future` / `all`.
- **`DELETE /api/calendar/events/[id]?scope=X`** — delete with same three scopes.
- **`EventModal`** (`/src/components/groups/EventModal.tsx`) — create meetings, recurring support, double-submit guard.
- **`GroupMeetings`** (`/src/components/groups/GroupMeetings.tsx`) — meeting list + edit + delete modals on group detail page. 5-event collapse/expand, teal theme.
- **Daily DNA `UpcomingEvents`** — upcoming 5 events widget on groups page.
- **Daily DNA `/groups/calendar`** — full month grid calendar page.

#### Navigation
- **`UserMenu.tsx`** — Cohort added to "My Dashboards" dropdown for `dna_leader` + `church_leader`. Order: Church → Groups → Cohort → Training.

### Fixed
- `GET /api/groups/[id]` — DB errors now return 500 with real message (no longer masked as 404).
- Recurring event duplication — `end_date` timezone fix (`T23:59:59` appended to date-only strings).
- Double-submit guard on `EventModal` via `useRef`.

### Changed
- Group detail page layout: Phase Progress → Disciples → Scheduled Meetings.
- "Schedule Meeting" button moved into `GroupMeetings` card header.

| File | Change |
|------|--------|
| `database/046_dna_calendar_events.sql` | New — calendar table + RLS |
| `database/048_fix_get_my_calendar_events.sql` | New — fixed RPC |
| `database/049_co_leader_invitations.sql` | New — co-leader invitations |
| `/src/app/api/calendar/events/route.ts` | group_id filter + timezone fix |
| `/src/app/api/calendar/events/[id]/route.ts` | Scoped PATCH + DELETE |
| `/src/app/api/groups/[id]/route.ts` | Better error handling |
| `/src/app/groups/[id]/page.tsx` | Layout reorder + GroupMeetings |
| `/src/components/groups/EventModal.tsx` | Double-submit guard, teal color |
| `/src/components/groups/GroupMeetings.tsx` | New component |
| `/src/components/UserMenu.tsx` | Cohort in dropdown |

---

## [2026-02-10] Life Assessment Sync + Leader View

### Added
- Life Assessment Supabase sync (`/dna-app/daily-dna/lib/assessmentSync.ts`) — push-only, upsert on `(account_id, assessment_type)`
- Life Assessment PDF (`/dna-app/daily-dna/lib/assessmentPdf.tsx`) — W1/W12 scores + growth comparison + reflection answers
- Life Assessment inline card on disciple profile (7 scored categories, score bars, delta pills, reflection answers)
- `LifeAssessmentResult` type in `/src/lib/types.ts`

---

## [2026-02-09] Spiritual Gifts Assessment (Migration 044)

### Added
- 96-question assessment (3 tiers), 2-page PDF, cloud sync, auth gate at `/gifts`
- Pastor landing page at `/ministry-gift-test` with lead capture + Resend email
- Migration 044: `spiritual_gifts_leader_inquiries`

---

## [2026-02-09] DNA Groups Co-Leader Fix (Migration 043)

### Fixed
- Migration 043: `get_my_group_ids()` now includes leaders' own groups for chat access

---

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
