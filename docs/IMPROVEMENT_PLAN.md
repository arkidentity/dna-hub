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

### 5. Add Admin Activity Log / Audit Trail

**Problem:** No record of who changed what, when, or why.

**Solution:** Create `admin_activity_log` table.

```sql
-- Migration: supabase-migration-audit-log.sql
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,           -- 'status_change', 'milestone_update', 'document_upload', etc.
  entity_type TEXT NOT NULL,      -- 'church', 'milestone', 'document'
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON admin_activity_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_admin ON admin_activity_log(admin_email);
CREATE INDEX idx_audit_log_date ON admin_activity_log(created_at);
```

```typescript
// Helper function in /src/lib/audit.ts
export async function logAdminAction(
  adminEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValue?: object,
  newValue?: object,
  notes?: string
) {
  await supabaseAdmin.from('admin_activity_log').insert({
    admin_email: adminEmail,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue,
    new_value: newValue,
    notes
  });
}
```

**Files to modify:**
- [ ] Create `supabase-migration-audit-log.sql`
- [ ] Create `/src/lib/audit.ts`
- [ ] `/src/app/api/admin/churches/route.ts` - log status changes
- [ ] `/src/app/api/admin/church/[id]/route.ts` - log updates
- [ ] `/src/app/api/admin/church/[id]/milestones/route.ts` - log milestone changes
- [ ] `/src/app/api/admin/church/[id]/documents/route.ts` - log document uploads

**Estimated effort:** 3 hours

---

### 6. Database-Driven Admin Management

**Problem:** Admin emails hardcoded in `/src/lib/auth.ts` line 9.

**Solution:** Create `admin_users` table.

```sql
-- Migration: supabase-migration-admin-users.sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',      -- 'super_admin', 'admin', 'readonly'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Seed existing admins
INSERT INTO admin_users (email, name, role) VALUES
  ('thearkidentity@gmail.com', 'Admin', 'super_admin'),
  ('travis@arkidentity.com', 'Travis', 'super_admin');
```

```typescript
// Update /src/lib/auth.ts
export async function isAdmin(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  return !!data;
}
```

**Files to modify:**
- [ ] Create `supabase-migration-admin-users.sql`
- [ ] `/src/lib/auth.ts` - query database instead of hardcoded array
- [ ] `/src/lib/types.ts` - add AdminUser interface
- [ ] (Future) Create admin management UI

**Estimated effort:** 2 hours

---

### 7. Add Loading States to Milestone Checkboxes

**Problem:** No visual feedback when toggling milestones.

**Solution:** Add loading spinner per-milestone.

```typescript
// In /src/app/dashboard/page.tsx
const [loadingMilestones, setLoadingMilestones] = useState<Set<string>>(new Set());

const toggleMilestone = async (milestoneId: string) => {
  setLoadingMilestones(prev => new Set(prev).add(milestoneId));
  try {
    // ... existing logic
  } finally {
    setLoadingMilestones(prev => {
      const next = new Set(prev);
      next.delete(milestoneId);
      return next;
    });
  }
};

// In render:
{loadingMilestones.has(milestone.id) ? (
  <Loader2 className="w-5 h-5 animate-spin" />
) : (
  <input type="checkbox" ... />
)}
```

**Files to modify:**
- [ ] `/src/app/dashboard/page.tsx` - add loading state per milestone

**Estimated effort:** 30 minutes

---

### 8. Add Retry Button on Dashboard Load Failure

**Problem:** Generic "Failed to load dashboard" with no recovery option.

**Solution:**

```typescript
// In /src/app/dashboard/page.tsx
{error && (
  <div className="card p-6 text-center">
    <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
    <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
    <p className="text-gray-600 mb-4">{error}</p>
    <button
      onClick={() => fetchDashboard()}
      className="btn-primary"
    >
      Try Again
    </button>
  </div>
)}
```

**Files to modify:**
- [ ] `/src/app/dashboard/page.tsx` - add retry button in error state
- [ ] `/src/app/admin/page.tsx` - same pattern
- [ ] `/src/app/portal/page.tsx` - same pattern

**Estimated effort:** 30 minutes

---

### 9. Fix Phase 0 Status Display

**Problem:** Phase 0 (Onboarding) always shows as "completed" even when it's current.

**Current logic:** `/src/app/api/dashboard/route.ts` lines 84-86 hardcode Phase 0 to completed.

**Solution:**

```typescript
// Update phase status logic
if (phase.phase_number === 0) {
  // Phase 0 is current if church.current_phase === 0
  // Otherwise it's completed (churches start at phase 0)
  status = church.current_phase === 0 ? 'current' : 'completed';
}
```

**Files to modify:**
- [ ] `/src/app/api/dashboard/route.ts` - fix Phase 0 status logic

**Estimated effort:** 15 minutes

---

### 10. Persist Compact View Preference

**Problem:** Compact view toggle resets on page reload.

**Solution:** Store in localStorage (simple) or database (persistent across devices).

```typescript
// Simple localStorage approach
const [compactView, setCompactView] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('dashboard_compact_view') === 'true';
  }
  return false;
});

useEffect(() => {
  localStorage.setItem('dashboard_compact_view', String(compactView));
}, [compactView]);
```

**Files to modify:**
- [ ] `/src/app/dashboard/page.tsx` - persist compact view to localStorage

**Estimated effort:** 15 minutes

---

## P2 - Medium Priority

### 11. Break Up Dashboard Component

**Problem:** `/src/app/dashboard/page.tsx` is 900+ lines.

**Solution:** Extract into components:

```
/src/components/
  dashboard/
    DashboardHeader.tsx
    OverviewTab.tsx
    PhaseCard.tsx
    MilestoneItem.tsx
    NextStepsCard.tsx
    ProgressBar.tsx
```

**Files to create:**
- [ ] `/src/components/dashboard/DashboardHeader.tsx`
- [ ] `/src/components/dashboard/OverviewTab.tsx`
- [ ] `/src/components/dashboard/PhaseCard.tsx`
- [ ] `/src/components/dashboard/MilestoneItem.tsx`
- [ ] `/src/components/dashboard/NextStepsCard.tsx`
- [ ] `/src/components/dashboard/ProgressBar.tsx`
- [ ] Update `/src/app/dashboard/page.tsx` to use components

**Estimated effort:** 4 hours

---

### 12. Add Admin Bulk Operations

**Problem:** Can only manage one church at a time.

**Solution:** Add multi-select with batch actions.

**Features:**
- [ ] Checkbox on each church card
- [ ] "Select All" / "Deselect All"
- [ ] Bulk status change
- [ ] Bulk email send
- [ ] Bulk export to CSV

**Files to modify:**
- [ ] `/src/app/admin/page.tsx` - add selection state and bulk action bar
- [ ] `/src/app/api/admin/churches/route.ts` - add bulk update endpoint

**Estimated effort:** 6 hours

---

### 13. Add Admin Sorting & Filtering

**Problem:** Only basic search and single status filter.

**Solution:** Add advanced filtering options.

**Filters to add:**
- [ ] Date range (created, updated)
- [ ] Phase number
- [ ] Overdue milestones only
- [ ] No activity in X days
- [ ] Readiness level

**Sorting options:**
- [ ] Name (A-Z, Z-A)
- [ ] Status
- [ ] Phase
- [ ] Last activity
- [ ] Created date

**Files to modify:**
- [ ] `/src/app/admin/page.tsx` - add filter/sort UI
- [ ] `/src/app/api/admin/churches/route.ts` - accept filter/sort params

**Estimated effort:** 4 hours

---

### 14. Add CSV Export

**Problem:** No way to export church data for reporting.

**Solution:** Add export button to admin dashboard.

```typescript
// /src/app/api/admin/export/route.ts
export async function GET() {
  const { data: churches } = await supabaseAdmin
    .from('churches')
    .select(`
      *,
      church_leaders(*),
      church_assessments(*)
    `);

  const csv = convertToCSV(churches);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=churches-export.csv'
    }
  });
}
```

**Files to create:**
- [ ] `/src/app/api/admin/export/route.ts`
- [ ] Add export button to `/src/app/admin/page.tsx`

**Estimated effort:** 2 hours

---

### 15. Add Funnel Analytics Dashboard

**Problem:** No visibility into conversion rates or bottlenecks.

**Solution:** Add stats section to admin dashboard.

**Metrics to show:**
- [ ] Total by status (pipeline visualization)
- [ ] Conversion rate: assessment → discovery → proposal → active
- [ ] Average time in each status
- [ ] Churches at risk (no activity > 30 days)
- [ ] Completion rate by phase

**Files to modify:**
- [ ] `/src/app/admin/page.tsx` - add analytics section
- [ ] `/src/app/api/admin/analytics/route.ts` - calculate metrics

**Estimated effort:** 6 hours

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

### Week 2 - High Priority Foundation
- [ ] #5 Add audit log
- [ ] #6 Database-driven admin management
- [ ] #7 Loading states on milestones
- [ ] #8 Retry button on failures
- [ ] #9 Fix Phase 0 status
- [ ] #10 Persist compact view

### Week 3-4 - Polish & Efficiency
- [ ] #11 Break up dashboard component
- [ ] #12 Bulk operations
- [ ] #13 Sorting & filtering
- [ ] #14 CSV export

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
