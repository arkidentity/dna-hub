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

### 16. Implement Follow-Up Email Automation

**Problem:** No automated reminders after assessment or call booking.

**Solution:** Create scheduled job for follow-ups.

**Emails to add:**
- [ ] "Book your discovery call" - 3 days after assessment if no call
- [ ] "Call reminder" - 24 hours before scheduled call
- [ ] "We missed you" - if call was missed
- [ ] "Proposal expires soon" - 7 days after proposal sent
- [ ] "Inactive reminder" - 14 days with no progress

**Implementation options:**
1. Vercel Cron Jobs
2. Supabase Edge Functions with pg_cron
3. External service (e.g., Inngest)

**Files to create:**
- [ ] `/src/app/api/cron/follow-ups/route.ts`
- [ ] Add email templates to `/src/lib/email.ts`
- [ ] Configure Vercel cron in `vercel.json`

**Estimated effort:** 8 hours

---

### 17. Add Document Versioning

**Problem:** Re-uploading a document overwrites the previous version.

**Solution:** Keep version history.

```sql
-- Migration: supabase-migration-document-versions.sql
ALTER TABLE funnel_documents ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE funnel_documents ADD COLUMN replaced_at TIMESTAMPTZ;
ALTER TABLE funnel_documents ADD COLUMN replaced_by UUID REFERENCES funnel_documents(id);

-- Or create a separate versions table
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES funnel_documents(id),
  file_url TEXT NOT NULL,
  version INTEGER NOT NULL,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files to modify:**
- [ ] Create migration
- [ ] `/src/app/api/admin/church/[id]/documents/route.ts` - preserve old version on upload
- [ ] Admin UI to view version history

**Estimated effort:** 4 hours

---

### 18. Add Call Reminders

**Problem:** No reminder emails before scheduled calls.

**Solution:** Send reminder 24 hours before.

```typescript
// In cron job or scheduled function
const upcomingCalls = await supabaseAdmin
  .from('scheduled_calls')
  .select('*, churches(*), church_leaders(*)')
  .eq('completed', false)
  .gte('scheduled_at', new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString())
  .lte('scheduled_at', new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString());

for (const call of upcomingCalls) {
  await sendCallReminderEmail(call);
}
```

**Files to modify:**
- [ ] Add `sendCallReminderEmail()` to `/src/lib/email.ts`
- [ ] Create cron job for reminders

**Estimated effort:** 3 hours

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

### Week 3-4 - Polish & Efficiency
- [ ] #11 Break up dashboard component
- [ ] #12 Bulk operations
- [x] #13 Sorting & filtering
- [x] #14 CSV export

### Month 2 - Automation & Analytics
- [ ] #15 Funnel analytics
- [ ] #16 Follow-up automation
- [ ] #17 Document versioning
- [ ] #18 Call reminders

### Quarter 2 - Professional Grade
- [ ] #19 RBAC
- [ ] #20 Calendar integration
- [ ] #21 E-signature integration
- [ ] #22 Payment processing

---

## Migration Files Needed

| Migration | Purpose |
|-----------|---------|
| `supabase-migration-tier.sql` | Add selected_tier to churches |
| `supabase-migration-notification-log-fields.sql` | Add recipient_email, subject to notification_log |
| `supabase-migration-audit-log.sql` | Create admin_activity_log table |
| `supabase-migration-admin-users.sql` | Create admin_users table |
| `supabase-migration-document-versions.sql` | Add versioning to documents |

---

## Environment Variables to Add

```bash
# Calendar URLs (move from hardcoded)
DISCOVERY_CALENDAR_URL=
PROPOSAL_CALENDAR_URL=
STRATEGY_CALENDAR_URL=

# Future integrations
CALENDLY_API_KEY=
DOCUSIGN_API_KEY=
STRIPE_SECRET_KEY=
HUBSPOT_API_KEY=
```

---

## Success Metrics

After completing P0-P1:
- [ ] Zero scoring inconsistencies
- [ ] All admin actions logged
- [ ] No hardcoded configuration
- [ ] Email audit trail complete
- [ ] Loading states on all async actions

After completing P2:
- [ ] Funnel conversion rates visible
- [ ] Automated follow-up emails active
- [ ] Admin efficiency improved (bulk ops)
- [ ] Clean, maintainable components

---

*Last updated: January 14, 2025*

---

## Completed Migrations

The following SQL migrations need to be run in Supabase SQL Editor:

1. **`supabase-migration-tier.sql`** - Adds `selected_tier` column to churches table
2. **`supabase-migration-notification-log-subject.sql`** - Adds `subject` column to notification_log table
