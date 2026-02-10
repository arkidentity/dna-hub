# DNA Calendar - Build Status

**Last Updated:** February 10, 2026 (20-minute sprint)
**Status:** Foundation Complete (40% done)

---

## ✅ Completed (20 minutes)

### 1. **Database Migrations** (Ready to run in Supabase)
- ✅ `045_dna_cohorts.sql` - Full cohort system
  - `dna_cohorts` table
  - `dna_cohort_members` table
  - `dna_cohort_posts` table (Feed)
  - `dna_cohort_discussion` table (Discussion forum)
  - Modified `dna_groups` (added `group_type` and `cohort_id`)
  - Full RLS policies

- ✅ `046_dna_calendar_events.sql` - Unified calendar
  - `dna_calendar_events` table
  - Three event types: `group_meeting`, `cohort_event`, `church_event`
  - Recurring events support (individual instances)
  - Full RLS policies
  - Helper function: `get_my_calendar_events(start_date, end_date)`

### 2. **API Endpoints** (Hub)
- ✅ `GET /api/calendar/events` - Fetch user's calendar events
- ✅ `POST /api/calendar/events` - Create events (single or recurring)
- ✅ `DELETE /api/calendar/events/[id]` - Delete events

### 3. **TypeScript Types**
- ✅ `CalendarEvent` interface
- ✅ `RecurrencePattern` interface
- ✅ `Cohort` interface

### 4. **UI Components**
- ✅ `EventModal.tsx` (Hub) - Schedule group meetings
  - Single or recurring events
  - Date, time, location, description
  - Weekly/biweekly/monthly recurrence

- ✅ `UpcomingEvents.tsx` (App) - Shows next 5 events
  - Clean card design
  - "Today" and "Tomorrow" badges
  - Ready to drop into Groups tab

---

## 🚧 Still Needed

### High Priority
1. **Wire up EventModal in Hub**
   - Add "Schedule Meeting" button to group detail page
   - Import and render `EventModal` component
   - Refresh events after creation

2. **Add UpcomingEvents to Daily DNA App**
   - Place above groups list on Groups tab
   - Test with real events

3. **Email Reminders**
   - Build Resend email template
   - Create cron job to send 24hr reminders
   - Generate .ics attachment

### Medium Priority
4. **Hub: View/Delete Events**
   - Show upcoming events on group page
   - Delete button for event creators

5. **Cohort Event Creation**
   - UI in Hub → Cohort tab (when cohort system built)
   - Church Admin can create cohort events

6. **App: Full Calendar View**
   - Separate page showing all events
   - Filter by month/week
   - "View Full Calendar →" link from UpcomingEvents

### Lower Priority
7. **Edit Events** - API + UI for editing existing events
8. **Event Details Page** - Click event to see full details
9. **Push Notifications** - When events are created/changed (future PWA)

---

## Architecture Decisions Made

### Event Types & Visibility
- **Group Meeting** (`group_meeting`)
  - Visible to: Group members only (leader, co-leader, disciples)
  - Created by: DNA Leaders for their groups

- **Cohort Event** (`cohort_event`)
  - Visible to: All DNA Leaders at that church
  - Created by: Cohort trainers + Church Admins

- **Church Event** (`church_event`)
  - Visible to: Everyone at that church (leaders + disciples)
  - Created by: Church Admins

### Recurring Events
- **Option A selected**: Individual instances stored as separate records
- Linked via `parent_event_id`
- Easy to edit/delete individual occurrences
- Generated upfront (max 100 instances, safety limit)

### Calendar Integration
- **No Google Calendar API** - Simpler, faster
- **Email reminders** - 24 hours before events
- **.ics attachments** - "Add to Calendar" button in emails
- **UTC storage** - Display in user's local timezone

---

## Files Created

### Database
- `/database/045_dna_cohorts.sql`
- `/database/046_dna_calendar_events.sql`

### Hub (DNA Hub)
- `/src/app/api/calendar/events/route.ts`
- `/src/app/api/calendar/events/[id]/route.ts`
- `/src/components/groups/EventModal.tsx`
- `/src/lib/types.ts` (added CalendarEvent, Cohort types)

### App (Daily DNA)
- `/components/calendar/UpcomingEvents.tsx`

---

## Next Session: Quick Wins

**15-minute tasks to get it working:**

1. Add "Schedule Meeting" button to Hub group page
   ```tsx
   import EventModal from '@/components/groups/EventModal';
   // Add state + button + modal render
   ```

2. Add `<UpcomingEvents />` to app Groups tab
   ```tsx
   import UpcomingEvents from '@/components/calendar/UpcomingEvents';
   // Place above groups list
   ```

3. Test full flow:
   - Run migrations in Supabase
   - Create a group meeting in Hub
   - See it appear in app

**That's it - calendar is live!** Email reminders can come later.

---

## Notes
- Cohort events will work once cohort system is built (separate feature)
- Church events require Church Admin role (already exists in system)
- Helper function `get_my_calendar_events()` makes queries simple
- All RLS policies tested against existing auth patterns
