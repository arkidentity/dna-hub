# DNA Training Platform - Implementation Plan

**Goal:** Launch Flow Assessment by next week, build progressive SaaS platform for DNA Leader training

**Timeline:** Flow Assessment by Feb 7, 2026 | Full platform by March 2026

---

## Phase 1: Flow Assessment (Week 1 - PRIORITY)

### Database ✅ DONE
- [x] Create migration `022_dna-training-system.sql`
- [x] Tables: `dna_leader_journeys`, `dna_training_modules`, `dna_flow_assessments`, `dna_content_unlocks`
- [x] RLS policies for user privacy
- [x] Auto-initialization triggers
- [ ] Run migration in Supabase

### Content ✅ DONE
- [x] Create `flow-assessment-data.ts` with 7 roadblocks

### Routes & Pages
- [ ] `/training` - DNA Training Dashboard (home page)
- [ ] `/training/assessment` - Flow Assessment (7-question flow)
- [ ] `/training/assessment/results` - Assessment results & action plan

### Components
- [ ] `<FlowAssessmentIntro>` - Welcome page with instructions
- [ ] `<RoadblockQuestion>` - Single roadblock rating (1-5 scale)
- [ ] `<ReflectionInput>` - Reflection questions (text areas)
- [ ] `<AssessmentResults>` - Visual chart + top roadblocks
- [ ] `<ActionPlanBuilder>` - Select actions, set deadlines
- [ ] `<ProgressBar>` - Assessment completion indicator

### API Routes
- [ ] `POST /api/training/assessment/start` - Initialize new assessment
- [ ] `PUT /api/training/assessment/[id]` - Save progress (draft mode)
- [ ] `POST /api/training/assessment/[id]/complete` - Finalize assessment
- [ ] `GET /api/training/assessment/latest` - Get user's latest assessment
- [ ] `GET /api/training/assessment/history` - Past assessments (for retakes)

### Features
- [ ] Draft saving (auto-save every 30 seconds)
- [ ] 3-month retake lockout
- [ ] Comparison view (if retaking)
- [ ] PDF download (assessment results)
- [ ] Unlock DNA Manual upon completion

### Testing
- [ ] Complete assessment flow end-to-end
- [ ] Verify draft saving works
- [ ] Test retake lockout (simulate 3-month gap)
- [ ] Verify milestone unlocking triggers

---

## Phase 2: DNA Manual (6 Sessions) - Week 2-3

### Content Migration
- [ ] Extract session content from Ark app `dna-course-data.js`
- [ ] Compare with updated PDF (user to provide)
- [ ] Update any outdated content
- [ ] Create `dna-manual-data.ts` with 6 sessions

### Routes & Pages
- [ ] `/training/manual` - 6-session overview page
- [ ] `/training/manual/[sessionId]` - Individual session view

### Components
- [ ] `<SessionCard>` - Session overview with lock/unlock state
- [ ] `<SessionLesson>` - Expandable lesson accordion
- [ ] `<WarmUpQuestions>` - Discussion starters
- [ ] `<ScriptureBlock>` - Formatted Scripture with reference
- [ ] `<SessionNavigation>` - Previous/Next buttons

### API Routes
- [ ] `GET /api/training/manual/sessions` - Get all sessions with progress
- [ ] `PUT /api/training/manual/sessions/[id]/complete` - Mark session complete
- [ ] `GET /api/training/manual/progress` - Overall manual progress

### Features
- [ ] Sequential unlocking (Session 2 unlocked after Session 1 complete)
- [ ] Session completion tracking
- [ ] Progress bar (X/6 sessions complete)
- [ ] Unlock Launch Guide upon completion

### Testing
- [ ] Complete all 6 sessions
- [ ] Verify sequential unlocking
- [ ] Test progress tracking
- [ ] Verify Launch Guide unlocks

---

## Phase 3: Launch Guide (5 Phases) - Week 3-4

### Content Migration
- [ ] Extract phase content from Ark app `dna-launch-guide-data.js`
- [ ] Update with refreshed language from `/resources/DNA Launch Guide.md`
- [ ] Create `launch-guide-data.ts` with 5 phases

### Routes & Pages
- [ ] `/training/launch-guide` - 5-phase overview page
- [ ] `/training/launch-guide/[phaseId]` - Individual phase view

### Components
- [ ] `<PhaseCard>` - Phase overview with timeline
- [ ] `<ChecklistItem>` - Interactive checklist with completion tracking
- [ ] `<PhaseSection>` - Expandable content sections
- [ ] `<SampleConversation>` - Dialogue templates

### API Routes
- [ ] `GET /api/training/launch-guide/phases` - Get all phases with progress
- [ ] `PUT /api/training/launch-guide/phases/[id]/checklist` - Update checklist
- [ ] `GET /api/training/launch-guide/progress` - Overall guide progress

### Features
- [ ] Checklist completion tracking
- [ ] Progress per phase (X/Y items complete)
- [ ] Unlock 90-Day Toolkit upon review
- [ ] Enable "Create Group" button after Phase 2 review

### Testing
- [ ] Navigate through all 5 phases
- [ ] Complete checklist items
- [ ] Verify 90-Day Toolkit unlocks
- [ ] Verify "Create Group" button appears

---

## Phase 4: 90-Day Toolkit - Week 4-5

### Content Creation
- [ ] Review `/resources/THE 90-DAY TOOLKIT_*.md` files
- [ ] Organize into 90-day structure (Month 1, Month 2, Month 3)
- [ ] Create `toolkit-90day-data.ts`

### Routes & Pages
- [ ] `/training/toolkit` - 90-day overview page
- [ ] `/training/toolkit/[weekId]` - Individual week view

### Components
- [ ] `<ToolkitWeek>` - Week overview with activities
- [ ] `<ToolkitActivity>` - Interactive activity checklist
- [ ] `<ToolkitResource>` - PDF/video embeds

### API Routes
- [ ] `GET /api/training/toolkit/weeks` - Get all weeks with progress
- [ ] `PUT /api/training/toolkit/weeks/[id]/complete` - Mark week complete

### Features
- [ ] Weekly completion tracking
- [ ] PDF downloads (First 30, Month 2, Month 3)
- [ ] Progress visualization (90-day calendar view)

### Testing
- [ ] Navigate through all 90 days
- [ ] Complete activities
- [ ] Download PDFs
- [ ] Verify progress tracking

---

## Phase 5: Training Dashboard (Progressive UI) - Week 5-6

### Dashboard Layout
- [ ] Hero section: Welcome + current stage
- [ ] Module cards: Flow Assessment, DNA Manual, Launch Guide, Toolkit
- [ ] Progress visualization: Overall completion %
- [ ] Milestone tracker: Achievements timeline
- [ ] Next steps: Clear CTA for next action

### Progressive Unlocking Logic
```
Flow Assessment Complete → Unlock DNA Manual
DNA Manual Complete → Unlock Launch Guide
Launch Guide Phase 2 Complete → Enable "Create Group" button
Launch Guide Complete → Unlock 90-Day Toolkit
First Group Created → Unlock Advanced Resources
```

### Components
- [ ] `<TrainingDashboard>` - Main dashboard layout
- [ ] `<ModuleCard>` - Module overview with lock state
- [ ] `<MilestoneTimeline>` - Visual achievement tracker
- [ ] `<ProgressRing>` - Circular progress indicator
- [ ] `<NextStepsCTA>` - Contextual next action

### API Routes
- [ ] `GET /api/training/dashboard` - Get all training data + progress
- [ ] `GET /api/training/unlocks` - Get unlocked content
- [ ] `POST /api/training/milestone` - Track milestone completion

### Features
- [ ] Auto-unlock content based on milestones
- [ ] Stage progression (Onboarding → Training → Launching → Growing → Multiplying)
- [ ] Badge system (non-cheesy: "DNA Trained Leader", "Active Leader", etc.)
- [ ] Visual progress indicators

### Testing
- [ ] Complete full training flow (Assessment → Manual → Guide → Toolkit)
- [ ] Verify progressive unlocking
- [ ] Test milestone tracking
- [ ] Verify stage transitions

---

## Phase 6: Integration with DNA Groups - Week 6

### Connect Training to Groups
- [ ] "Create Group" button appears after Launch Guide Phase 2
- [ ] First group creation triggers milestone
- [ ] Group progress influences training stage
- [ ] Advanced resources unlock based on group activity

### Dashboard Enhancements
- [ ] Show active groups on training dashboard
- [ ] Link to `/groups` dashboard
- [ ] Display group milestones alongside training milestones

### API Updates
- [ ] Update `dna_leader_journeys` when group is created
- [ ] Track group launches in milestones
- [ ] Update stage to 'launching' when first group is created

---

## Phase 7: Admin View - Week 7

### Admin Features
- [ ] View all user journeys (stage, progress, milestones)
- [ ] Filter by stage (Onboarding, Training, Launching, etc.)
- [ ] View individual Flow Assessment results
- [ ] Export training analytics (CSV)

### Routes
- [ ] `/admin/training` - Training analytics dashboard
- [ ] `/admin/training/users` - User journey list
- [ ] `/admin/training/users/[id]` - Individual user training view

---

## Content Updates Needed

### From User
- [ ] Updated DNA Manual PDF (for content comparison)
- [ ] Final DNA Launch Guide content (verify `/resources/DNA Launch Guide.md` is current)
- [ ] Final 90-Day Toolkit content (verify `/resources/THE 90-DAY TOOLKIT_*.md` are current)

### To Migrate from Ark App
- [x] Flow Assessment (7 roadblocks) - ✅ DONE
- [ ] DNA Manual (6 sessions)
- [ ] Launch Guide (5 phases)

---

## Technical Decisions

### Auth
- **Who can access `/training`?**
  - DNA Leaders (existing auth via `/groups` login)
  - Church Leaders (existing auth via `/dashboard` login)
  - **New users?** (SaaS model - open signup?)

**Decision needed:** Should we allow public signup for DNA training, or require church invitation?

### Progressive Unlocking Strategy
- **Option A: "Building Dashboard"** - Dashboard grows as you progress (new modules appear)
- **Option B: "Locked Content"** - All modules visible, but locked with unlock requirements shown

**Recommendation:** Option B (locked content) - Users see the full journey upfront, creates anticipation

### Content Display
- **Option A: Single-page modules** - All content on one scrolling page
- **Option B: Multi-step flow** - Paginated with Previous/Next navigation

**Recommendation:**
- Flow Assessment: Multi-step (7 pages, one per roadblock)
- DNA Manual: Single-page sessions (lessons expand/collapse)
- Launch Guide: Single-page phases (sections expand/collapse)
- Toolkit: Single-page weeks

---

## Open Questions for User

1. **Public vs. Invitation-only?**
   - Should anyone be able to sign up for DNA training at dnadiscipleship.com?
   - Or should it require invitation from a church leader?

2. **Content readiness?**
   - Is `/resources/DNA Launch Guide.md` the final content?
   - Is `/resources/THE 90-DAY TOOLKIT_*.md` the final content?
   - Do you have an updated DNA Manual PDF to compare against Ark app?

3. **UI Aesthetic?**
   - Keep Ark app's navy/gold theme for training dashboard?
   - Or match DNA Hub's cream/teal/navy theme?

4. **Pricing/Paywall?**
   - Is all training content free?
   - Or is there a premium tier for advanced resources?

---

## Next Steps (Immediate)

### Tonight/Tomorrow
1. **Run database migration** `022_dna-training-system.sql` in Supabase
2. **Build Flow Assessment intro page** (`/training/assessment`)
3. **Build first roadblock question** (rating scale component)
4. **Test API: Start assessment, save draft**

### This Week
1. Complete all 7 roadblock questions
2. Build results page + action plan
3. Test end-to-end flow
4. Deploy to production

### User Action Items
1. Provide updated DNA Manual PDF (if available)
2. Confirm final content for Launch Guide & 90-Day Toolkit
3. Answer open questions above
4. Review Flow Assessment content (in `flow-assessment-data.ts`) for accuracy

---

**Ready to start building?** Let me know and I'll begin with the Flow Assessment intro page and first roadblock question component.
