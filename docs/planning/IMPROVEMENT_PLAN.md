# DNA Hub Improvement Plan

> Comprehensive roadmap for addressing system gaps and reaching professional-grade quality.

## Overview

This plan addresses issues identified in the system assessment across:
- Sales funnel & onboarding
- Church dashboard
- Admin dashboard
- Authentication & security
- Data integrity
- Email communications

---

## Priority Levels

| Priority | Criteria | Action Timeline |
|----------|----------|-----------------|
| **P0 - Critical** | Data integrity issues, broken functionality | This week |
| **P1 - High** | Major UX gaps, scalability blockers | This month |
| **P2 - Medium** | Professional polish, efficiency gains | This quarter |
| **P3 - Low** | Nice-to-have, future enhancements | Backlog |

---

## P0 - Critical Issues ✅ COMPLETED

### 1. Fix Readiness Scoring Inconsistency ✅

**Problem:** Frontend scoring thresholds differ from backend.
- Frontend (`/src/app/assessment/page.tsx`): `>=12` = ready, `>=6` = building
- Backend (`/src/app/api/assessment/route.ts`): `>=10` = ready, `>=5` = building

**Impact:** Users see different readiness levels in UI vs email.

**Solution:**
```typescript
// Unify to these thresholds (in both files):
if (score >= 10) return 'ready';
if (score >= 5) return 'building';
return 'exploring';
```

**Files modified:**
- [x] `/src/app/assessment/page.tsx` - unified thresholds to >=10, >=5
- [x] `/src/app/api/assessment/route.ts` - fixed field name mapping to match frontend

**Status:** ✅ COMPLETED

---

### 2. Move Calendar URLs to Environment Variables ✅

**Problem:** Google Calendar URLs hardcoded in email templates. If availability changes, all emails break.

**Solution:**
```bash
# Add to .env.local
DISCOVERY_CALENDAR_URL=https://calendar.google.com/...
PROPOSAL_CALENDAR_URL=https://calendar.google.com/...
STRATEGY_CALENDAR_URL=https://calendar.google.com/...
```

**Files modified:**
- [x] `.env.example` - created with all required environment variables documented
- [x] `/src/lib/email.ts` - centralized calendar URLs at top of file, using env vars with fallbacks
- [x] `/src/app/assessment/thank-you/page.tsx` - now uses `NEXT_PUBLIC_DISCOVERY_CALENDAR_URL` env var

**Status:** ✅ COMPLETED

---

### 3. Fix Tier Selection Storage ✅

**Problem:** Admin selects tier in modal but it's never saved to database.

**Solution:**
```sql
-- Migration: supabase-migration-tier.sql
ALTER TABLE churches ADD COLUMN IF NOT EXISTS selected_tier TEXT;
```

**Files modified:**
- [x] Created `supabase-migration-tier.sql` - adds selected_tier column to churches
- [x] `/src/app/api/admin/churches/route.ts` - saves tier when status changes to `awaiting_strategy`
- [x] `/src/lib/types.ts` - added `selected_tier?: string` to Church interface

**Note:** Run the migration SQL in Supabase dashboard to add the column.

**Status:** ✅ COMPLETED

---

### 4. Populate notification_log Table ✅

**Problem:** Table exists but is never written to. No email audit trail.

**Solution:** Integrated logging directly into the `sendEmail()` function in email.ts.

**Files modified:**
- [x] Created `supabase-migration-notification-log-subject.sql` - adds subject column to notification_log
- [x] `/src/lib/email.ts` - updated `sendEmail()` to log all emails with churchId, notificationType, sent_to, subject
- [x] Updated all email functions to accept optional `churchId` parameter:
  - `sendAssessmentNotification` - logs 'assessment_notification'
  - `sendProposalReadyEmail` - logs 'proposal_ready'
  - `sendAgreementConfirmedEmail` - logs 'agreement_confirmed'
  - `sendDashboardAccessEmail` - logs 'dashboard_access'
  - `sendMilestoneNotification` - logs 'milestone_completed'
  - `sendPhaseCompletionNotification` - logs 'phase_completed'
  - `send3StepsEmail` - logs '3_steps_email'
- [x] `/src/app/api/assessment/route.ts` - passes churchId to email functions
- [x] `/src/app/api/admin/churches/route.ts` - passes churchId to email functions
- [x] `/src/app/api/progress/route.ts` - passes churchId to email functions (removed duplicate manual logging)

**Note:** Run the migration SQL in Supabase dashboard to add the subject column.

**Status:** ✅ COMPLETED

---

## P1 - High Priority

### 5. Add Admin Activity Log / Audit Trail ✅

**Problem:** No record of who changed what, when, or why.

**Solution:** Created `admin_activity_log` table and helper functions.

**Files modified:**
- [x] Created `supabase-migration-audit-log.sql`
- [x] Created `/src/lib/audit.ts` with helper functions
- [x] `/src/app/api/admin/churches/route.ts` - logs status changes
- [x] `/src/app/api/admin/church/[id]/milestones/route.ts` - logs milestone changes
- [x] `/src/app/api/admin/church/[id]/documents/route.ts` - logs document uploads

**Status:** ✅ COMPLETED

---

### 6. Database-Driven Admin Management ✅

**Problem:** Admin emails hardcoded in `/src/lib/auth.ts`.

**Solution:** Created `admin_users` table with caching and fallback to hardcoded list.

**Files modified:**
- [x] Created `supabase-migration-admin-users.sql`
- [x] `/src/lib/auth.ts` - queries database with cache, falls back to hardcoded list
- [x] `/src/lib/types.ts` - added AdminUser interface and AdminRole type
- [ ] (Future) Create admin management UI

**Note:** Run the migration SQL in Supabase dashboard to create the table.

**Status:** ✅ COMPLETED

---

### 7. Add Loading States to Milestone Checkboxes ✅

**Problem:** No visual feedback when toggling milestones.

**Status:** Already implemented! Dashboard uses `updatingMilestone` state with `Loader2` spinner.

**Files reviewed:**
- [x] `/src/app/dashboard/page.tsx` - already has loading state per milestone

**Status:** ✅ ALREADY COMPLETE

---

### 8. Add Retry Button on Dashboard Load Failure ✅

**Problem:** Generic "Failed to load dashboard" with no recovery option.

**Solution:** Added error state UI with AlertCircle icon and "Try Again" button.

**Files modified:**
- [x] `/src/app/dashboard/page.tsx` - added retry button in error state
- [x] `/src/app/admin/page.tsx` - added error state and retry button
- [x] `/src/app/portal/page.tsx` - added retry button in error state

**Status:** ✅ COMPLETED

---

### 9. Fix Phase 0 Status Display ✅

**Problem:** Phase 0 (Onboarding) always shows as "completed" even when it's current.

**Solution:** Fixed phase status logic to show Phase 0 as 'current' when `church.current_phase === 0`.

**Files modified:**
- [x] `/src/app/api/dashboard/route.ts` - fixed Phase 0 status logic

**Status:** ✅ COMPLETED

---

### 10. Persist Compact View Preference ✅

**Problem:** Compact view toggle resets on page reload.

**Solution:** Implemented localStorage persistence with useEffect.

**Files modified:**
- [x] `/src/app/dashboard/page.tsx` - persists compact view to localStorage

**Status:** ✅ COMPLETED

---

**Files to modify (reference only):**
- [ ] `/src/app/dashboard/page.tsx` - persist compact view to localStorage

**Estimated effort:** 15 minutes

---

## P2 - Medium Priority

### 11. Break Up Dashboard Component ✅

**Problem:** `/src/app/dashboard/page.tsx` is 900+ lines.

**Solution:** Extracted into reusable components.

**Files created:**
- [x] `/src/components/dashboard/types.ts` - shared types
- [x] `/src/components/dashboard/utils.ts` - helper functions
- [x] `/src/components/dashboard/DashboardHeader.tsx`
- [x] `/src/components/dashboard/ProgressBar.tsx`
- [x] `/src/components/dashboard/NextStepsCard.tsx`
- [x] `/src/components/dashboard/ScheduleCallCard.tsx`
- [x] `/src/components/dashboard/DocumentsCard.tsx`
- [x] `/src/components/dashboard/ResourcesCard.tsx`
- [x] `/src/components/dashboard/QuickStats.tsx`
- [x] `/src/components/dashboard/MilestoneItem.tsx`
- [x] `/src/components/dashboard/PhaseCard.tsx`
- [x] `/src/components/dashboard/OverviewTab.tsx`
- [x] `/src/components/dashboard/JourneyTab.tsx`
- [x] `/src/components/dashboard/index.ts` - barrel export
- [x] Updated `/src/app/dashboard/page.tsx` to use components (reduced from 1221 to ~400 lines)

**Status:** ✅ COMPLETED

---

### 12. Add Admin Bulk Operations ✅

**Problem:** Can only manage one church at a time.

**Solution:** Added multi-select with batch actions.

**Features implemented:**
- [x] Checkbox on each church card with visual selection highlight
- [x] "Select All" / "Deselect All" toggle
- [x] Bulk status change with email notification option
- [x] Bulk send login links
- [x] Export selected to CSV

**Files modified:**
- [x] `/src/app/admin/page.tsx` - added selection state, bulk action bar, and modals
- [x] `/src/app/api/admin/churches/route.ts` - added `handleBulkUpdate()` function
- [x] `/src/app/api/admin/export/route.ts` - added `ids` query param for selective export

**Status:** ✅ COMPLETED

---

### 13. Add Admin Sorting & Filtering ✅

**Problem:** Only basic search and single status filter.

**Solution:** Added sorting and phase filtering (completed in previous session).

**Features:**
- [x] Status filter dropdown
- [x] Phase filter dropdown
- [x] Sorting: name, created, updated, phase (asc/desc)

**Status:** ✅ COMPLETED (previous session)

---

### 14. Add CSV Export ✅

**Problem:** No way to export church data for reporting.

**Solution:** Added export endpoint and button (completed in previous session).

**Files:**
- [x] `/src/app/api/admin/export/route.ts` - full CSV export with all church data
- [x] Export button in admin header
- [x] Export selected churches support

**Status:** ✅ COMPLETED (previous session)

---

### 15. Add Funnel Analytics Dashboard ✅

**Problem:** No visibility into conversion rates or bottlenecks.

**Solution:** Added collapsible analytics section to admin dashboard.

**Features implemented:**
- [x] Pipeline visualization with bar chart
- [x] Conversion rates between stages
- [x] Churches at risk (14+ days inactive) with direct links
- [x] Quick stats: new this month, active last 7 days, completed
- [x] Toggle to show/hide analytics

**Files created/modified:**
- [x] `/src/app/api/admin/analytics/route.ts` - calculates all metrics
- [x] `/src/app/admin/page.tsx` - analytics UI section

**Status:** ✅ COMPLETED

---

### 16. Implement Follow-Up Email Automation ✅

**Problem:** No automated reminders after assessment or call booking.

**Solution:** Created Vercel cron job that runs daily at 9 AM.

**Emails implemented:**
- [x] "Book your discovery call" - 3 days after assessment if no call booked
- [x] "Call reminder" - 24 hours before scheduled call
- [x] "We missed you" - if call was missed (1-2 days after scheduled time)
- [x] "Proposal expires soon" - 7 days after proposal sent
- [x] "Inactive reminder" - 14 days with no progress (for active churches)

**Files created/modified:**
- [x] `/src/app/api/cron/follow-ups/route.ts` - cron job handler with all follow-up logic
- [x] `/src/lib/email.ts` - added 5 new email templates:
  - `sendBookDiscoveryReminder()`
  - `sendCallReminder24h()`
  - `sendCallMissedEmail()`
  - `sendProposalExpiringEmail()`
  - `sendInactiveReminderEmail()`
- [x] `/vercel.json` - configured cron schedule (daily at 9 AM)
- [x] `supabase-migration-follow-ups.sql` - tracking table for sent follow-ups
- [x] `.env.example` - added CRON_SECRET documentation

**Note:** Run the migration SQL in Supabase dashboard. Set CRON_SECRET env var in Vercel.

**Status:** ✅ COMPLETED

---

### 17. Add Document Versioning ✅

**Problem:** Re-uploading a document overwrites the previous version.

**Solution:** Created document_versions table with automatic archiving via database trigger.

**Features:**
- [x] Automatic version archiving on document re-upload
- [x] Version history stored in `document_versions` table
- [x] GET endpoint to retrieve version history
- [x] Tracks uploaded_by for each version
- [x] Current version number displayed

**Files created/modified:**
- [x] `supabase-migration-document-versions.sql` - creates versions table and archive trigger
- [x] `/src/app/api/admin/church/[id]/documents/route.ts` - added GET handler for version history
- [x] `/src/lib/types.ts` - added DocumentVersion and FunnelDocumentWithVersions interfaces

**Note:** Run the migration SQL in Supabase dashboard.

**Status:** ✅ COMPLETED

---

### 18. Add Call Reminders ✅

**Problem:** No reminder emails before scheduled calls.

**Solution:** Integrated into follow-up email automation (#16).

**Features:**
- [x] 24-hour reminder before scheduled calls
- [x] Missed call follow-up (1-2 days after scheduled time)
- [x] `reminder_sent` flag on scheduled_calls to prevent duplicates
- [x] Support for all call types (discovery, proposal, strategy)

**Files modified:**
- [x] `/src/lib/email.ts` - `sendCallReminder24h()` and `sendCallMissedEmail()`
- [x] `/src/app/api/cron/follow-ups/route.ts` - handles reminder logic
- [x] `supabase-migration-follow-ups.sql` - adds reminder_sent column

**Status:** ✅ COMPLETED (merged with #16)

---

## P3 - Low Priority / Future

### 19. Role-Based Access Control (RBAC)

**Features:**
- [ ] Super admin (full access)
- [ ] Admin (manage churches, can't manage other admins)
- [ ] Read-only (view only, no modifications)
- [ ] Regional (only see assigned churches)

---

### 20. Calendar Integration

**Features:**
- [ ] Calendly or Cal.com integration
- [ ] Auto-create meeting links
- [ ] Sync to Google/Outlook calendars
- [ ] Automatic call recordings storage

---

### 21. Contract/E-Signature Integration

**Features:**
- [ ] DocuSign or PandaDoc integration
- [ ] Auto-advance status when signed
- [ ] Store signed documents

---

### 22. Payment Processing

**Features:**
- [ ] Stripe integration
- [ ] Subscription management
- [ ] Invoice generation
- [ ] Payment status tracking

---

### 23. CRM Integration

**Features:**
- [ ] HubSpot or Pipedrive sync
- [ ] Automatic deal creation from assessment
- [ ] Activity logging
- [ ] Pipeline visualization

---

### 24. Mobile Optimization

**Features:**
- [ ] Responsive admin dashboard
- [ ] Touch-friendly milestone toggles
- [ ] Mobile-optimized modals

---

### 25. Accessibility Improvements

**Features:**
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus indicators

---

## Implementation Checklist

### Week 1 - Critical Fixes ✅ ALL COMPLETE
- [x] #1 Fix scoring inconsistency
- [x] #2 Move calendar URLs to env vars
- [x] #3 Fix tier selection storage
- [x] #4 Populate notification_log

### Week 2 - High Priority Foundation ✅ ALL COMPLETE
- [x] #5 Add audit log
- [x] #6 Database-driven admin management
- [x] #7 Loading states on milestones (already existed)
- [x] #8 Retry button on failures
- [x] #9 Fix Phase 0 status
- [x] #10 Persist compact view

### Week 3-4 - Polish & Efficiency ✅ ALL COMPLETE
- [x] #11 Break up dashboard component
- [x] #12 Bulk operations
- [x] #13 Sorting & filtering
- [x] #14 CSV export

### Month 2 - Automation & Analytics ✅ ALL COMPLETE
- [x] #15 Funnel analytics
- [x] #16 Follow-up automation
- [x] #17 Document versioning
- [x] #18 Call reminders

### Quarter 2 - Professional Grade
- [ ] #19 RBAC
- [ ] #20 Calendar integration
- [ ] #21 E-signature integration
- [ ] #22 Payment processing

---

## Migration Files Needed

| Migration | Purpose | Status |
|-----------|---------|--------|
| `supabase-migration-tier.sql` | Add selected_tier to churches | ✅ Created |
| `supabase-migration-notification-log-subject.sql` | Add subject to notification_log | ✅ Created |
| `supabase-migration-audit-log.sql` | Create admin_activity_log table | ✅ Created |
| `supabase-migration-admin-users.sql` | Create admin_users table | ✅ Created |
| `supabase-migration-follow-ups.sql` | Track follow-up emails sent | ✅ Created |
| `supabase-migration-document-versions.sql` | Add versioning to documents | ✅ Created |

---

## Environment Variables to Add

```bash
# Calendar URLs (move from hardcoded)
DISCOVERY_CALENDAR_URL=
PROPOSAL_CALENDAR_URL=
STRATEGY_CALENDAR_URL=

# Cron job authentication
CRON_SECRET=

# Future integrations
CALENDLY_API_KEY=
DOCUSIGN_API_KEY=
STRIPE_SECRET_KEY=
HUBSPOT_API_KEY=
```

---

## Success Metrics

After completing P0-P1:
- [x] Zero scoring inconsistencies
- [x] All admin actions logged
- [x] No hardcoded configuration
- [x] Email audit trail complete
- [x] Loading states on all async actions

After completing P2:
- [x] Funnel conversion rates visible
- [x] Automated follow-up emails active
- [x] Admin efficiency improved (bulk ops)
- [x] Clean, maintainable components

---

*Last updated: January 14, 2025*

---

## Completed Migrations

The following SQL migrations need to be run in Supabase SQL Editor:

1. **`supabase-migration-tier.sql`** - Adds `selected_tier` column to churches table
2. **`supabase-migration-notification-log-subject.sql`** - Adds `subject` column to notification_log table
3. **`supabase-migration-audit-log.sql`** - Creates admin_activity_log table for audit trail
4. **`supabase-migration-admin-users.sql`** - Creates admin_users table for database-driven admin management
5. **`supabase-migration-follow-ups.sql`** - Creates follow_up_emails table and adds reminder_sent to scheduled_calls
6. **`supabase-migration-document-versions.sql`** - Creates document_versions table with auto-archive trigger
