# DNA Training Platform - Development Handoff

**Status:** Database setup complete ✅ | Ready to build UI components
**Date:** January 30, 2026
**Next Phase:** Build Flow Assessment UI & API routes

---

## 🎯 Project Overview

Building a **progressive SaaS training platform** for DNA Leaders at `dnadiscipleship.com`.

### **User Journey:**
1. **Anyone** can sign up (public signup via magic link email)
2. Complete **Flow Assessment** (7 roadblocks - internal obstacles to discipleship)
3. Flow Assessment unlocks → **DNA Manual** (6 sessions)
4. DNA Manual complete → **Launch Guide** (5 phases)
5. After Launch Guide Phase 2 → Can **create DNA groups** (`/groups`)
6. First group created → **90-Day Toolkit** unlocks

### **Key Concept: Progressive Unlocking**
- Content unlocks based on milestones (no cheesy gamification)
- Dashboard builds over time as user progresses
- Training → Launching → Growing → Multiplying stages

---

## ✅ What's Complete

### **1. Database (Migration 022 - DONE)**
All tables created and verified in Supabase:

**Core Tables:**
- `dna_leader_journeys` - Tracks overall training progression
- `dna_training_modules` - Module completion (sessions, phases, weeks)
- `dna_flow_assessments` - Flow Assessment responses (7 roadblocks)
- `dna_content_unlocks` - Controls progressive content reveal
- `user_roles` - Role-based access (dna_trainee, dna_leader, church_leader, admin)

**Triggers:**
- Auto-initialize journey on user signup
- Auto-promote to `dna_leader` when first group created
- Auto-update stage when milestones change

**RLS Policies:**
- Users can only see/edit their own data
- Admins can view all data (via `user_roles.role = 'admin'`)

### **2. Content Data**
- **Flow Assessment:** `/src/lib/flow-assessment-data.ts` (7 roadblocks with reflection questions, action steps, Scripture)
- **DNA Manual:** `/docs/resources/DNA Discipleship.md` (6 sessions - needs to be converted to TypeScript)
- **Launch Guide:** `/docs/resources/DNA Launch Guide.md` (5 phases - needs to be converted)
- **90-Day Toolkit:** `/docs/resources/90-day-toolkit/` (4 files - needs to be converted)

### **3. Planning Documents**
- `/docs/planning/DNA-TRAINING-IMPLEMENTATION-PLAN.md` - 7-phase implementation plan
- `/docs/planning/DNA-TRAINING-AUTH-PLAN.md` - Auth flow & user journey
- `/docs/QUICK-START-DNA-TRAINING.md` - Database setup guide
- `/docs/DNA-TRAINING-MIGRATION-CHECKLIST.md` - Verification checklist

---

## 🚀 What to Build Next (Priority Order)

### **Phase 1: Flow Assessment (This Week)**

#### **1. Auth Pages (Signup/Login)**
Create these routes:

**`/src/app/signup/page.tsx`** - Public signup page
```tsx
'use client'
- Email input + Name input
- "Send Magic Link" button
- Calls POST /api/training/signup
- Shows success message with instructions
- Clean, simple UI (DNA Hub light theme)
```

**`/src/app/login/page.tsx`** - Magic link login
```tsx
'use client'
- Email input only
- "Send Login Link" button
- Calls POST /api/training/login
- Shows success message
```

**API Routes:**
- `POST /api/training/signup` - Create user in auth.users, send magic link
- `POST /api/training/login` - Generate magic link, send email
- `GET /api/auth/verify` - Verify magic link token, set session cookie (may already exist - check!)

#### **2. Training Dashboard**

**`/src/app/training/page.tsx`** - Main dashboard
```tsx
'use client'
- Fetch user's journey, unlocks, progress
- Display module cards:
  - Flow Assessment (unlocked by default)
  - DNA Manual (locked until assessment complete)
  - Launch Guide (locked until manual complete)
  - 90-Day Toolkit (locked until first group created)
- Progress indicator (overall %)
- Current stage badge (Onboarding, Training, Launching, etc.)
- Next steps CTA
```

**API Route:**
- `GET /api/training/dashboard` - Returns user journey, unlocks, module progress

#### **3. Flow Assessment Pages**

**`/src/app/training/assessment/page.tsx`** - Assessment intro
```tsx
'use client'
- Welcome message
- Instructions (30-45 min, 7 questions, etc.)
- "Start Assessment" button → Creates draft assessment, redirects to first question
```

**`/src/app/training/assessment/[questionId]/page.tsx`** - Individual question
```tsx
'use client'
- Dynamic route: question-1, question-2, ..., question-7
- Shows roadblock description, manifestations, root causes
- 1-5 rating scale (buttons)
- 4 reflection questions (text areas)
- Auto-save draft every 30 seconds
- Previous/Next navigation
- Progress bar (Question X of 7)
```

**`/src/app/training/assessment/results/page.tsx`** - Results & action plan
```tsx
'use client'
- Visual chart of ratings (simple bar chart or radar)
- Top 2-3 roadblocks highlighted
- Action plan builder:
  - Select action steps for each top roadblock
  - Set deadlines
  - Assign accountability partner
- "Complete Assessment" button → Finalizes, unlocks DNA Manual
- PDF download option
```

**API Routes:**
- `POST /api/training/assessment/start` - Create draft assessment, return ID
- `PUT /api/training/assessment/[id]` - Save progress (draft mode)
- `POST /api/training/assessment/[id]/complete` - Finalize assessment, unlock DNA Manual
- `GET /api/training/assessment/latest` - Get user's latest assessment
- `GET /api/training/assessment/[id]/pdf` - Generate PDF download (optional for later)

#### **4. Components to Create**

**`/src/components/training/ModuleCard.tsx`**
```tsx
// Props: title, description, locked, progress, onClick
// Shows lock icon if locked, progress bar if in progress, checkmark if complete
```

**`/src/components/training/ProgressRing.tsx`**
```tsx
// Circular progress indicator (0-100%)
```

**`/src/components/training/RoadblockQuestion.tsx`**
```tsx
// Rating scale (1-5 buttons)
// Reflection questions (text inputs)
```

**`/src/components/training/ActionPlanBuilder.tsx`**
```tsx
// Select action steps
// Set deadlines (date picker)
// Accountability partner input
```

---

## 📂 File Structure (Current State)

```
/src/
  /lib/
    flow-assessment-data.ts ✅ (DONE - 7 roadblocks)
    auth.ts (existing - may need updates for training auth)
    email.ts (existing - add new email templates)
    supabase.ts (existing - should work as-is)

  /app/
    /signup/ (NEW - to create)
      page.tsx
    /login/ (NEW - to create)
      page.tsx
    /training/ (NEW - to create)
      page.tsx (dashboard)
      /assessment/
        page.tsx (intro)
        /[questionId]/
          page.tsx (question flow)
        /results/
          page.tsx (results & action plan)
    /api/
      /training/ (NEW - to create)
        /signup/
          route.ts
        /login/
          route.ts
        /dashboard/
          route.ts
        /assessment/
          /start/
            route.ts
          /[id]/
            route.ts (PUT for save)
            /complete/
              route.ts
          /latest/
            route.ts

/database/
  022_dna-training-system.sql ✅ (DONE - run in Supabase)
  023_assign-admin-roles.sql ✅ (DONE - run in Supabase)

/docs/
  /planning/
    DNA-TRAINING-IMPLEMENTATION-PLAN.md ✅
    DNA-TRAINING-AUTH-PLAN.md ✅
  QUICK-START-DNA-TRAINING.md ✅
  DNA-TRAINING-MIGRATION-CHECKLIST.md ✅
  DNA-TRAINING-HANDOFF.md ← (this file)

/docs/resources/ (content to migrate later)
  DNA Discipleship.md (DNA Manual source)
  DNA Launch Guide.md (Launch Guide source)
  /90-day-toolkit/
    THE 90-DAY TOOLKIT_ Overview.md
    THE 90-DAY TOOLKIT_ First 30.md
    THE 90-DAY TOOLKIT_ Month 2.md
    The 90-Day TOOLKIT_ Month 3.md
```

---

## 🎨 Design System (Use Existing DNA Hub Theme)

**Colors:**
- Cream background: `#FFFBF5` (--cream)
- Navy text: `#1A2332` (--navy)
- Gold accents: `#D4A853` (--gold)
- Teal links: `#2D6A6A` (--teal)

**Typography:**
- Use existing DNA Hub styles
- Headings: Navy, bold
- Body: Navy, regular
- CTAs: Gold background, white text

**Components:**
- Use existing `btn-primary`, `btn-secondary`, `card` classes
- Match `/dashboard` and `/groups` aesthetic

---

## 🔑 Key Implementation Details

### **Auth System**
- **Public signup** at `/signup` (magic link email, no password)
- Cookie: `dna_session` (consider consolidating with existing auth)
- Check `user_roles` table for permissions
- All users start as `dna_trainee` role
- Promote to `dna_leader` when first group created

### **Progressive Unlocking Logic**
```typescript
// Check if module is unlocked
const isUnlocked = await checkUnlock(userId, contentType);

// Unlock next module after completion
await unlockContent(userId, 'manual_session_1', 'flow_assessment_complete');

// Update milestone
await updateMilestone(userId, 'flow_assessment_complete', true);
```

### **Draft Saving (Flow Assessment)**
- Auto-save every 30 seconds while user is on question page
- Save to `dna_flow_assessments` with `is_draft = true`
- User can leave and resume later
- Only one draft at a time per user

### **3-Month Retake Lockout**
- After completing assessment, user can't retake for 3 months
- Show "Next available: [date]" if locked
- When retaking, show comparison to previous assessment

### **Email Templates to Create**
1. **Welcome Email** (after signup)
2. **Magic Link Email** (login)
3. **Assessment Complete Email** (DNA Manual unlocked)
4. **Manual Complete Email** (Launch Guide unlocked)
5. **First Group Created Email** (90-Day Toolkit unlocked)

---

## 🧪 Testing Checklist

### **Signup Flow**
- [ ] User enters email → Receives magic link
- [ ] Click link → Lands on `/training`
- [ ] Journey created with `current_stage = 'onboarding'`
- [ ] Role assigned: `dna_trainee`
- [ ] Flow Assessment unlocked by default

### **Flow Assessment**
- [ ] Start assessment → Creates draft
- [ ] Answer questions → Auto-saves
- [ ] Navigate back/forth → Preserves answers
- [ ] Complete → Unlocks DNA Manual
- [ ] Retake locked for 3 months

### **Progressive Unlocking**
- [ ] DNA Manual locked until assessment complete
- [ ] Launch Guide locked until manual complete
- [ ] Toolkit locked until first group created

### **Admin Override** (for later)
- [ ] Admin can manually unlock modules
- [ ] Admin can mark training complete
- [ ] Admin can view all user journeys

---

## 📊 Success Metrics (Week 1)

**By End of Week:**
- [ ] User can sign up at `/signup`
- [ ] User can login at `/login`
- [ ] User lands on `/training` dashboard
- [ ] User can start Flow Assessment
- [ ] User can complete all 7 questions
- [ ] User can see results and create action plan
- [ ] Assessment completion unlocks DNA Manual (shows unlocked in dashboard)

**Stretch Goals:**
- [ ] PDF download of assessment results
- [ ] Email notifications for unlocks
- [ ] 3-month retake lockout enforced

---

## 🚨 Known Issues / Things to Watch

1. **Auth Cookie Consolidation**
   - Currently: Church leaders use one cookie, DNA leaders use `dna_leader_session`
   - Training auth should consolidate into one system
   - May need to update `/src/lib/auth.ts`

2. **Email Sending**
   - Use existing `/src/lib/email.ts`
   - Add new templates for training emails
   - Update `FROM_EMAIL` to use `@dnadiscipleship.com` (or keep `@mail.arkidentity.com`)

3. **Migration Dependencies**
   - Migration 022 creates trigger on `auth.users`
   - If Supabase Auth creates users differently, trigger may not fire
   - Test with actual signup flow to verify auto-initialization works

4. **RLS Policy Recursion**
   - Admin check in `user_roles` policies references itself (recursive)
   - This is intentional and works, but watch for performance issues with large datasets

---

## 💬 Questions for Next Session

1. **Auth Strategy:**
   - Should we consolidate all auth into one session cookie?
   - Or keep separate cookies for training vs. groups?

2. **Email Domain:**
   - Use `@dnadiscipleship.com` or keep `@mail.arkidentity.com`?
   - If switching, need to verify domain in Resend first

3. **Admin Access:**
   - How should admins access training dashboard?
   - Add link to `/admin` page? Or separate route?

4. **Content Migration:**
   - Should DNA Manual content be in database or TypeScript files?
   - Same question for Launch Guide and Toolkit

---

## 🎯 Quick Start Command for Next Session

```
Hi! I'm continuing the DNA Training Platform build.

Database is set up ✅
Ready to build Flow Assessment UI.

Please read: /docs/DNA-TRAINING-HANDOFF.md

Start with:
1. /src/app/signup/page.tsx
2. /src/app/training/page.tsx (dashboard)
3. /src/app/training/assessment/page.tsx

Let's build!
```

---

## 📚 Reference Documents

**Planning:**
- `/docs/planning/DNA-TRAINING-IMPLEMENTATION-PLAN.md` - Full 7-phase plan
- `/docs/planning/DNA-TRAINING-AUTH-PLAN.md` - Auth flow details

**Database:**
- `/database/022_dna-training-system.sql` - Main migration (run ✅)
- `/database/023_assign-admin-roles.sql` - Admin roles (run ✅)
- `/docs/DNA-TRAINING-MIGRATION-CHECKLIST.md` - Verification guide

**Content:**
- `/src/lib/flow-assessment-data.ts` - 7 roadblocks (ready to use)
- `/docs/resources/DNA Discipleship.md` - DNA Manual source (to migrate)
- `/docs/resources/DNA Launch Guide.md` - Launch Guide source (to migrate)

**Project Info:**
- `/.claude/CLAUDE.md` - DNA Hub project overview
- `/README.md` - Main project README

---

## 🏁 Final Notes

**Goal:** Flow Assessment functional by end of week (Feb 7, 2026)

**Approach:**
- Build fast, iterate later
- Focus on core flow first (signup → assessment → completion)
- Polish and PDF downloads can come in Phase 2

**Design:**
- Match existing DNA Hub aesthetic (light theme)
- Clean, simple, non-cheesy
- Mobile-friendly (but desktop-first is fine for MVP)

**Testing:**
- Test as you build (manual testing is fine for now)
- Verify auto-initialization triggers fire
- Check progressive unlocking works

---

**Status:** Ready for UI development 🚀

**Next Developer:** Start with `/signup` page and work through the flow sequentially.

**Questions?** Reference the planning docs above or check the database schema in migration 022.

Good luck! 🎉
