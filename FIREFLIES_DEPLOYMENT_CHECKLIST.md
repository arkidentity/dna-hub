# Fireflies Deployment Checklist

Use this checklist to track deployment progress.

---

## Phase 1: Code Completion ✅ DONE

- [x] Database migration created
- [x] Keyword filtering implemented
- [x] Date-primary matching implemented
- [x] Milestone auto-assignment implemented
- [x] AI notes UI component built
- [x] Church notes UI component built
- [x] TypeScript types updated
- [x] Documentation written

---

## Phase 2: API Wiring ⏳ IN PROGRESS

### Church Notes State Management
- [ ] Open `/src/components/dashboard/JourneyTab.tsx`
- [ ] Add state: `const [editingChurchNotesId, setEditingChurchNotesId] = useState<string | null>(null)`
- [ ] Add state: `const [editChurchNotesValue, setEditChurchNotesValue] = useState('')`
- [ ] Add handler: `onStartEditingChurchNotes(milestoneId, currentNotes)`
- [ ] Add handler: `onSaveChurchNotes(milestoneId)`
- [ ] Add handler: `onCancelEditChurchNotes()`
- [ ] Add handler: `onEditChurchNotesChange(value)`
- [ ] Pass all props to `<MilestoneItem />`

### Church Notes API Endpoint
- [ ] Create `/src/app/api/church/progress/notes/route.ts`
- [ ] Implement POST handler
- [ ] Get session and verify church user
- [ ] Update `church_progress.church_notes` field
- [ ] Test with Postman/curl

### RLS Policy Verification
- [ ] Check church can UPDATE their own `church_progress` records
- [ ] Test with church user login
- [ ] Verify admin can see church notes

---

## Phase 3: Database Migration ⏳ PENDING

- [ ] Backup current database (optional)
- [ ] Copy contents of `supabase-migration-fireflies-simplify.sql`
- [ ] Open Supabase SQL Editor
- [ ] Execute migration
- [ ] Verify `meeting_transcripts` table dropped
- [ ] Verify `unmatched_fireflies_meetings` table dropped
- [ ] Verify `scheduled_calls.milestone_id` column exists
- [ ] Verify `church_progress.church_notes` column exists
- [ ] Verify `fireflies_webhook_log.matched_milestone_id` column exists
- [ ] Check RLS policies are active

---

## Phase 4: Code Deployment ⏳ PENDING

- [ ] Review all code changes
- [ ] Run linter: `npm run lint`
- [ ] Fix any TypeScript errors
- [ ] Commit changes: `git add .`
- [ ] Commit message: `git commit -m "Add Fireflies meeting notes with keyword filtering"`
- [ ] Push to main: `git push origin main`
- [ ] Verify Vercel deployment succeeds
- [ ] Check build logs for errors

---

## Phase 5: Fireflies Connection ⏳ PENDING

- [ ] Log in to Fireflies.ai
- [ ] Navigate to Settings → Integrations → Custom Integrations
- [ ] Copy API key
- [ ] Go to DNA Hub `/admin/settings`
- [ ] Click "Connect Fireflies.ai"
- [ ] Paste API key
- [ ] Click "Connect"
- [ ] Verify "Fireflies connected successfully!" message

---

## Phase 6: Testing ⏳ PENDING

### Test 1: DNA Meeting (Should Process)
- [ ] Schedule Google Meet: "DNA Discovery Call - Test Church"
- [ ] Invite `fred@fireflies.ai`
- [ ] Invite test church leader email
- [ ] Have 2-3 minute test call
- [ ] Wait 10 minutes for processing
- [ ] Check `fireflies_webhook_log` table
- [ ] Verify `processed = true`, no error
- [ ] Check `scheduled_calls` table
- [ ] Verify `ai_summary` saved
- [ ] Verify `milestone_id` assigned
- [ ] Mark `visible_to_church = true`
- [ ] Login as church user
- [ ] Go to DNA Journey
- [ ] Find milestone
- [ ] Click "Meeting Notes" to expand
- [ ] Verify summary, action items, keywords display

### Test 2: Non-DNA Meeting (Should Skip)
- [ ] Schedule Google Meet: "Team Standup"
- [ ] Invite `fred@fireflies.ai`
- [ ] Have short test call
- [ ] Wait 10 minutes
- [ ] Check `fireflies_webhook_log` table
- [ ] Verify `error_message = "Skipped: Not a DNA-related meeting"`
- [ ] Verify no notes saved to `scheduled_calls`

### Test 3: Date Matching
- [ ] Create `scheduled_calls` entry for tomorrow
- [ ] Set `call_type = 'discovery'`
- [ ] Schedule meeting for tomorrow (within ±24h)
- [ ] Title: "DNA Meeting - Test"
- [ ] Invite `fred@fireflies.ai` + church leader
- [ ] Have call
- [ ] Wait 10 minutes
- [ ] Verify webhook matched by date
- [ ] Verify correct `call_id` assigned

### Test 4: Keyword Matching (Backup)
- [ ] Create `scheduled_calls` entry for last week (outside ±24h)
- [ ] Schedule meeting today with title: "DNA Discovery Call"
- [ ] Invite `fred@fireflies.ai`
- [ ] Have call
- [ ] Wait 10 minutes
- [ ] Verify webhook matched by keyword "discovery"
- [ ] Verify correct `call_id` assigned

### Test 5: Church Notes
- [ ] Login as church user
- [ ] Go to DNA Journey → any milestone
- [ ] Click "Add your notes"
- [ ] Type: "Test note from church"
- [ ] Click "Save"
- [ ] Verify note saved
- [ ] Refresh page
- [ ] Verify note persists
- [ ] Click edit button
- [ ] Modify note
- [ ] Save again
- [ ] Verify updated

### Test 6: Security (RLS)
- [ ] Login as Church A user
- [ ] Try to access Church B's notes (should fail)
- [ ] Verify only own notes visible
- [ ] Login as admin
- [ ] Verify can see all churches' notes

---

## Phase 7: Monitoring ⏳ PENDING

### First Week Checks
- [ ] Day 1: Check webhook logs for errors
- [ ] Day 1: Verify first real meeting processed
- [ ] Day 3: Check skipped meetings count
- [ ] Day 3: Review keyword filter accuracy
- [ ] Day 7: Check date matching success rate
- [ ] Day 7: Review milestone assignment accuracy

### Ongoing Monitoring
- [ ] Set up weekly review of webhook logs
- [ ] Monitor `fireflies_webhook_log` table
- [ ] Track admin approval time
- [ ] Measure church engagement (notes added)

### SQL Monitoring Queries
```sql
-- Total webhooks received
SELECT COUNT(*) FROM fireflies_webhook_log;

-- Processed successfully
SELECT COUNT(*) FROM fireflies_webhook_log WHERE processed = true AND error_message IS NULL;

-- Skipped (no keywords)
SELECT COUNT(*) FROM fireflies_webhook_log WHERE error_message LIKE '%Skipped%';

-- Failed (errors)
SELECT COUNT(*) FROM fireflies_webhook_log WHERE processed = false;

-- Most recent webhooks
SELECT * FROM fireflies_webhook_log ORDER BY received_at DESC LIMIT 10;
```

---

## Phase 8: Documentation ✅ DONE

- [x] Main implementation doc
- [x] Keyword filter guide
- [x] Implementation summary
- [x] Deployment checklist (this file)
- [x] Updated README references

---

## Known Issues / Edge Cases

### To Watch For:
- [ ] Multiple calls same day (first match wins)
- [ ] Church phase incorrect (milestone matching fails)
- [ ] Church leader email mismatch (no auto-match)
- [ ] Meeting title typos (keyword filter misses)
- [ ] Fireflies API rate limits (if any)

### Fallback Procedures:
- [ ] Document manual matching process
- [ ] Document admin note editing
- [ ] Document church support process

---

## Success Criteria

### Must Have (Before Launch)
- [ ] Webhook processes DNA meetings
- [ ] Keyword filter skips non-DNA meetings
- [ ] Date matching works (primary)
- [ ] AI notes display in DNA Journey
- [ ] Church notes work (add/edit)
- [ ] Admin approval flow works
- [ ] RLS policies enforced

### Nice to Have (Post-Launch)
- [ ] Admin dashboard for approving notes
- [ ] Email notifications for new notes
- [ ] Bulk approve multiple meetings
- [ ] Search/filter meeting notes

---

## Rollback Plan

If issues arise:

1. **Disable webhook processing:**
   - Set `fireflies_settings.auto_process_enabled = false`

2. **Revert code:**
   - `git revert HEAD`
   - `git push origin main`

3. **Restore database (if needed):**
   - Use backup from Phase 3

4. **Communicate:**
   - Notify team of rollback
   - Document issue for future fix

---

## Support Contacts

**Technical Issues:**
- Check webhook logs first
- Review `FIREFLIES_IMPLEMENTATION_SUMMARY.md`
- Review `FIREFLIES_KEYWORD_FILTER.md`

**Fireflies Support:**
- https://app.fireflies.ai/
- support@fireflies.ai

**Database Access:**
- Supabase Dashboard
- SQL Editor for manual fixes

---

## Completion Sign-Off

- [ ] All phases complete
- [ ] All tests passing
- [ ] Monitoring in place
- [ ] Team trained on usage
- [ ] Documentation reviewed

**Deployed By:** _______________
**Date:** _______________
**Version:** 1.0

---

**Status:** ⏳ In Progress - API Wiring Phase

**Next Action:** Complete church notes state management in JourneyTab

**Estimated Completion:** 1-2 hours for API wiring, then ready for testing
