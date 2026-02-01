# DNA Training Platform - Implementation Plan

**Goal:** Build progressive SaaS platform for DNA Leader training

**Status:** Phase 1 (Flow Assessment) complete. Ready for content phases.

---

## ✅ Completed: Core Infrastructure

### Database (Migrations 022 + 026)
- [x] Original training tables: `dna_training_modules`
- [x] Unified auth tables: `users`, `user_roles`
- [x] Training-specific tables:
  - `user_training_progress` - Training journey milestones
  - `user_content_unlocks` - Progressive content unlocking
  - `user_flow_assessments` - Flow Assessment responses
- [x] `initialize_training_user(UUID)` function

### Authentication ✅ Complete
- [x] Unified auth system (`/src/lib/unified-auth.ts`)
- [x] Magic link login via `/api/auth/verify?destination=training`
- [x] Training signup via `/api/training/signup`
- [x] Training login via `/api/training/login`
- [x] Session cookie: `user_session` (unified for all user types)
- [x] Role: `training_participant`

### Flow Assessment ✅ Complete
- [x] Assessment flow with 7 roadblocks
- [x] Draft saving (auto-save)
- [x] Results page with action plan
- [x] Content data: `/src/data/flow-assessment-data.ts`

### API Routes ✅ Complete
- [x] `GET /api/training/dashboard` - Full training data
- [x] `GET/POST /api/training/assessment` - Start/save assessment
- [x] `POST /api/training/assessment/complete` - Finalize assessment
- [x] `GET /api/training/assessment/results` - Load results
- [x] `POST /api/training/signup` - Create account
- [x] `POST /api/training/login` - Request magic link

### UI ✅ Complete
- [x] TopNav with DNA Hub logo
- [x] UserMenu with role-based navigation
- [x] Training dashboard page (`/training`)
- [x] Assessment flow pages

---

## 🚧 Phase 2: DNA Manual (6 Sessions)

### Content Migration
- [ ] Extract session content from Ark app `dna-course-data.js`
- [ ] Compare with updated PDF (user to provide)
- [ ] Create `/src/data/dna-manual-data.ts` with 6 sessions

### Routes & Pages
- [ ] `/training/manual` - 6-session overview page
- [ ] `/training/manual/[sessionId]` - Individual session view

### Components
- [ ] `<SessionCard>` - Session overview with lock/unlock state
- [ ] `<SessionLesson>` - Expandable lesson accordion
- [ ] `<WarmUpQuestions>` - Discussion starters
- [ ] `<ScriptureBlock>` - Formatted Scripture with reference

### API Routes
- [ ] `GET /api/training/manual/sessions` - Get all sessions with progress
- [ ] `PUT /api/training/manual/sessions/[id]/complete` - Mark session complete

### Features
- [ ] Sequential unlocking (Session 2 unlocked after Session 1 complete)
- [ ] Session completion tracking
- [ ] Progress bar (X/6 sessions complete)
- [ ] Unlock Launch Guide upon completion

---

## 📋 Phase 3: Launch Guide (5 Phases)

### Content Migration
- [ ] Extract phase content from Ark app `dna-launch-guide-data.js`
- [ ] Update with refreshed language from `/resources/DNA Launch Guide.md`
- [ ] Create `/src/data/launch-guide-data.ts` with 5 phases

### Routes & Pages
- [ ] `/training/launch-guide` - 5-phase overview page
- [ ] `/training/launch-guide/[phaseId]` - Individual phase view

### Features
- [ ] Checklist completion tracking
- [ ] Progress per phase (X/Y items complete)
- [ ] Unlock 90-Day Toolkit upon completion
- [ ] Enable "Create Group" button after Phase 2

---

## 📋 Phase 4: 90-Day Toolkit

### Content
- [ ] Review `/resources/THE 90-DAY TOOLKIT_*.md` files
- [ ] Organize into 90-day structure (Month 1, 2, 3)
- [ ] Create `/src/data/toolkit-90day-data.ts`

### Routes & Pages
- [ ] `/training/toolkit` - 90-day overview page
- [ ] `/training/toolkit/[weekId]` - Individual week view

### Features
- [ ] Weekly completion tracking
- [ ] PDF downloads
- [ ] Progress visualization (90-day calendar view)

---

## 📋 Phase 5: Dashboard Enhancements

### Progressive Unlocking Logic
```
Flow Assessment Complete → Unlock DNA Manual
DNA Manual Complete → Unlock Launch Guide
Launch Guide Phase 2 Complete → Enable "Create Group" button
Launch Guide Complete → Unlock 90-Day Toolkit
First Group Created → Unlock Advanced Resources
```

### Components
- [ ] `<ModuleCard>` - Module overview with lock state
- [ ] `<MilestoneTimeline>` - Visual achievement tracker
- [ ] `<ProgressRing>` - Circular progress indicator
- [ ] `<NextStepsCTA>` - Contextual next action

### Stage Progression
```
onboarding → flow_assessment → dna_manual → launch_guide → toolkit → completed
```

---

## 📋 Phase 6: Integration with DNA Groups

### Connect Training to Groups
- [ ] "Create Group" button appears after Launch Guide Phase 2
- [ ] First group creation triggers milestone
- [ ] Group progress influences training stage
- [ ] Show active groups on training dashboard
- [ ] Link to `/groups` dashboard

---

## 📋 Phase 7: Admin View

### Admin Features
- [ ] View all user journeys (stage, progress, milestones)
- [ ] Filter by stage
- [ ] View individual Flow Assessment results
- [ ] Export training analytics (CSV)

### Routes
- [ ] `/admin/training` - Training analytics dashboard
- [ ] `/admin/training/users` - User journey list
- [ ] `/admin/training/users/[id]` - Individual user training view

---

## Technical Architecture

### Auth Helpers (in `/src/lib/unified-auth.ts`)
```typescript
// Check if user is training participant
isTrainingParticipant(session): boolean

// Get training data
getTrainingProgress(userId): Promise<TrainingProgress>
getContentUnlocks(userId): Promise<ContentUnlocks>
getFlowAssessment(userId): Promise<FlowAssessment>

// Update training data
initializeTrainingUser(userId): Promise<void>
updateTrainingMilestone(userId, milestone, completed): Promise<void>
unlockContent(userId, contentType, trigger): Promise<void>
```

### API Route Pattern
```typescript
import { getUnifiedSession, isTrainingParticipant, isAdmin } from '@/lib/unified-auth';

export async function GET() {
  const session = await getUnifiedSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isTrainingParticipant(session) && !isAdmin(session)) {
    return NextResponse.json({ error: 'Not a training participant' }, { status: 403 });
  }

  // ... route logic
}
```

---

## Content Updates Needed (From User)

- [ ] Updated DNA Manual PDF (for content comparison)
- [ ] Confirm `/resources/DNA Launch Guide.md` is current
- [ ] Confirm `/resources/THE 90-DAY TOOLKIT_*.md` are current

---

## Related Documentation

- [Training Auth Unification](./TRAINING-AUTH-UNIFICATION-PLAN.md) - Auth integration details
- [Next Steps](./NEXT-STEPS.md) - Overall project status
- [Data Models](../technical/DATA_MODELS.md) - Database table documentation
