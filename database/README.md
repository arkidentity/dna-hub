# Database Migrations

SQL migrations for DNA Hub (Supabase/PostgreSQL).

## Structure

Files are numbered in the order they should be run:

| # | File | Description |
|---|------|-------------|
| 000 | `schema.sql` | Base database schema (tables, RLS, indexes) |
| 001 | `admin-users.sql` | Database-driven admin management |
| 002 | `onboarding.sql` | Phase 0 (Onboarding) milestones |
| 003 | `phase-updates.sql` | Phase 1 & 2 milestone updates, target dates |
| 004 | `admin-notes.sql` | Admin notes field on church_progress |
| 005 | `attachments.sql` | Milestone file attachments |
| 006 | `custom-milestones.sql` | Church-specific custom milestones |
| 007 | `resources.sql` | Global resources system |
| 008 | `funnel.sql` | Email subscribers, funnel documents |
| 009 | `document-versions.sql` | Document version history tracking |
| 010 | `tier.sql` | Partnership tier selection |
| 011 | `follow-ups.sql` | Follow-up email tracking |
| 012 | `audit-log.sql` | Admin activity audit trail |
| 013 | `notification-log-subject.sql` | Email subject in notification log |
| 014 | `google-calendar.sql` | Google Calendar integration |
| 015 | `fireflies.sql` | Fireflies.ai meeting transcription |
| 016 | `fireflies-simplify.sql` | Simplified Fireflies (AI summaries only) |
| 017 | `rename-milestones.sql` | Milestone title cleanup |
| 018 | `kickoff-notes.sql` | Kick-off notes milestone |
| 019 | `dna-groups.sql` | DNA Groups (Roadmap 2) tables |
| 020 | `calendar-sync-improvements.sql` | Calendar sync: aliases, call types, duplicate prevention |
| 021 | `spiritual-gifts-assessment.sql` | Spiritual Gifts Assessment system |
| 022 | `dna-training-system.sql` | DNA Training platform (Flow Assessment, Manual, progressive unlocking) |
| 023 | `assign-admin-roles.sql` | Assign admin roles to existing admin users |
| 024 | `training-magic-links.sql` | Magic link authentication for training participants |
| 025 | `unified-users.sql` | Unified user authentication system with role-based access |
| 026 | `training-auth-unification.sql` | Migrate training data to unified auth system |
| 027 | `training-manual-features.sql` | Session notes, bookmarks, and certificates for DNA Manual |
| 028 | `launch-guide-support.sql` | Launch Guide metadata support (checklist progress, phase completion) |
| 029 | `flow-assessment-strategy-calls.sql` | Rename Dam Assessment to Flow Assessment + Add strategy call milestones per phase |

## Running Migrations

### New Installation

Run all migrations in order (000 → 020) in the Supabase SQL Editor.

### Existing Installation

Only run migrations you haven't run yet. Check your database to see which tables/columns exist.

## How to Run

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy the contents of the migration file
5. Click **Run**
6. Verify no errors

## Adding New Migrations

1. Create a new file with the next number: `019_your-feature.sql`
2. Add a header comment describing the migration
3. Update this README with the new migration
4. Test in a development environment first

## Notes

- Migrations are **idempotent** where possible (use `IF NOT EXISTS`)
- Some migrations may need to be run in order due to dependencies
- Always backup before running migrations in production
- RLS policies are included in the migrations

## Storage Buckets

Some migrations create Supabase Storage buckets:
- `milestone-attachments` - Milestone file uploads
- `funnel-documents` - Funnel stage documents

These are created automatically by the SQL migrations.
