# DNA Training Platform - Implementation Plan

**Goal:** Build progressive SaaS platform for DNA Leader training

**Status:** Phases 1-3 COMPLETE (Flow Assessment + DNA Manual + Launch Guide). Training↔Groups bridge is next.

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

## ✅ Phase 2: DNA Manual (6 Sessions) — COMPLETE

**Completed Feb 2026.** 6 sessions, 21 lessons, 1,137 lines of real content fully extracted and implemented.

- [x] Content extracted and organized in `/src/data/dna-manual-data.ts`
- [x] `/training/manual` overview page
- [x] `/training/manual/[sessionId]` individual session views
- [x] All components built (SessionCard, SessionLesson, WarmUpQuestions, ScriptureBlock)
- [x] API routes for progress tracking
- [x] Sequential unlocking, completion tracking, progress bar
- [x] Bookmarks and notes functionality
- [x] Completion certificates

---

## ✅ Phase 3: Launch Guide (4 Phases) — COMPLETE

**Completed Feb 2026.** 4 phases, 1,253 lines of content fully extracted and implemented.

- [x] Content extracted in `/src/data/launch-guide-data.ts`
- [x] `/training/launch-guide` overview page
- [x] `/training/launch-guide/[phaseId]` individual phase views
- [x] Checklist completion tracking
- [x] Progress per phase
- [x] All 20 API routes working

---

## ⏸️ Phase 4: 90-Day Toolkit — DEPRIORITIZED

> **Decision (Feb 8, 2026):** 90-Day Toolkit belongs in the DNA Groups experience, not Training.
> Leaders experience it first as disciples in a DNA group, then teach it. This content will
> be accessed through the Groups dashboard and Daily DNA Pathway, not the Training platform.
> Revisit only if leaders specifically request it in Training.

---

## ⏸️ Phase 5: Dashboard Enhancements — DEPRIORITIZED

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

## 🔜 Phase 6: Training ↔ Groups Bridge — NEXT PRIORITY

> **Decision (Feb 8, 2026):** Training and Groups should be more connected. DNA leaders need
> easy access to training content (especially Launch Guide) from within their group dashboard.
> The system should surface relevant training based on what stage/week the leader is in.

### Start Simple (Week 3)
- [ ] Add "Training Quick Access" sidebar/panel on Groups dashboard
- [ ] Show Launch Guide progress and direct link
- [ ] Surface relevant training content based on group phase/week
- [ ] "Create Group" button after Launch Guide Phase 2

### Iterate Later (Post-Launch)
- [ ] Context-aware "smart content" — auto-suggest training by week
- [ ] Group progress influences training stage
- [ ] First group creation triggers training milestone
- [ ] Show active groups on training dashboard

---

## ⏸️ Phase 7: Admin View — DEPRIORITIZED

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
