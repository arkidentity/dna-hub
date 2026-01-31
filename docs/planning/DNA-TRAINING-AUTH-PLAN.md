# DNA Training - Authentication & User Flow Plan

**Model:** Public SaaS Platform (Anyone can sign up)

---

## User Journey

### **1. Discovery (Public)**
- User visits `dnadiscipleship.com`
- Landing page explains DNA training
- CTA: "Start Your DNA Journey" → `/training/signup`

### **2. Sign Up (Public)**
- `/training/signup` - Email-based signup (no password)
- Magic link sent to email
- Creates account in `auth.users`
- Redirects to `/training` (dashboard)

### **3. Training Stage (Auto-enrolled)**
- User starts in "onboarding" stage
- Flow Assessment unlocked by default
- Complete assessment → Unlocks DNA Manual
- Complete manual → Unlocks Launch Guide
- Review Launch Guide → Can create DNA groups

### **4. Launching Stage (Group Management)**
- User creates first DNA group at `/groups/new`
- Now has access to both:
  - `/training` (ongoing training resources)
  - `/groups` (group management dashboard)
- Additional toolkit resources unlock

### **5. Church Affiliation (Optional/Later)**
- Admins can invite DNA leaders to join a church's program
- Church leaders can view their church's DNA leaders (read-only)
- DNA leaders can operate independently OR under a church

---

## User Types & Access

| User Type | Access | Auth Method |
|-----------|--------|-------------|
| **Public User** | Landing page, Assessment form | None |
| **DNA Trainee** | `/training` dashboard | Magic link email (creates account) |
| **DNA Leader** | `/training` + `/groups` | Same magic link auth (after creating group) |
| **Church Leader** | `/dashboard` + view church's DNA leaders | Separate magic link auth |
| **Admin** | All dashboards + override controls | Admin role check |

---

## Database Schema Updates

### **Unified Auth Table**
Use existing `auth.users` from Supabase for all users.

### **User Roles Table** (NEW)
Track user roles and permissions:

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'dna_trainee', 'dna_leader', 'church_leader', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);
```

**Role Progression:**
1. User signs up → `dna_trainee` role auto-assigned
2. User creates first group → `dna_leader` role added (keeps `dna_trainee`)
3. Admin invites user to church → `church_leader` role added (if applicable)

### **DNA Leader Journey** (EXISTING)
Use `dna_leader_journeys` table (already created in migration 022).

When user signs up for training, auto-create journey record.

---

## Authentication Flow

### **Sign Up Flow**
```
POST /api/training/signup
  ↓
1. Validate email
2. Create auth.users record (Supabase Auth)
3. Create user_roles record (role: 'dna_trainee')
4. Create dna_leader_journeys record (stage: 'onboarding')
5. Unlock Flow Assessment (dna_content_unlocks)
6. Send magic link email
7. Return success message
```

### **Login Flow**
```
POST /api/training/login
  ↓
1. Send magic link to email
2. User clicks link → /api/auth/verify
3. Set session cookie
4. Redirect to /training
```

### **Session Management**
Use existing DNA Hub auth pattern:
- Cookie: `dna_session` (consolidate with DNA leader auth)
- Check role in middleware
- Allow access to `/training` and `/groups` based on roles

---

## Admin Override Controls

**Admin Dashboard:** `/admin/training/users`

### **Features:**
1. **View all users** with training progress
2. **Manually advance users** (skip modules, unlock content)
3. **Mark training complete** (bypass requirements)
4. **Assign users to churches**
5. **Reset progress** (if needed)

### **Override Actions:**
- "Mark Flow Assessment Complete"
- "Unlock DNA Manual" (without completing assessment)
- "Mark Training Complete" (unlock all content)
- "Set Stage" (manually set to Training, Launching, Growing, etc.)
- "Add Milestone" (grant specific achievements)

### **API Endpoints:**
```
POST /api/admin/training/users/[userId]/override
  Body: { action: 'unlock_module', module: 'manual_session_1' }

POST /api/admin/training/users/[userId]/milestone
  Body: { milestone: 'flow_assessment_complete', completed: true }

PUT /api/admin/training/users/[userId]/stage
  Body: { stage: 'launching' }
```

---

## Routes Structure

### **Public Routes**
- `/` - Landing page
- `/training/signup` - Public signup form
- `/training/login` - Magic link login

### **Authenticated Routes** (require login)
- `/training` - Training dashboard (all users)
- `/training/assessment` - Flow Assessment
- `/training/manual` - DNA Manual (6 sessions)
- `/training/manual/[sessionId]` - Individual session
- `/training/launch-guide` - Launch Guide (5 phases)
- `/training/toolkit` - 90-Day Toolkit
- `/training/progress` - Personal progress view

### **DNA Leader Routes** (require `dna_leader` role)
- `/groups` - DNA Groups dashboard
- `/groups/new` - Create new group
- `/groups/[id]` - Group detail

### **Church Leader Routes** (require `church_leader` role)
- `/dashboard` - Church implementation dashboard

### **Admin Routes** (require admin role)
- `/admin/training` - Training analytics
- `/admin/training/users` - User list with progress
- `/admin/training/users/[id]` - Individual user override controls

---

## Content Unlock Logic

### **Default Unlocks (On Signup)**
- Flow Assessment

### **Progressive Unlocks**
```
Flow Assessment Complete
  ↓ Unlocks
DNA Manual Session 1

DNA Manual Session 1 Complete
  ↓ Unlocks
DNA Manual Session 2
  ... (sequential through Session 6)

DNA Manual Complete (all 6 sessions)
  ↓ Unlocks
Launch Guide

Launch Guide Phase 2 Reviewed
  ↓ Unlocks
"Create Group" button (at /groups/new)

First Group Created
  ↓ Unlocks
90-Day Toolkit

90-Day Toolkit Complete
  ↓ Unlocks
Advanced Resources (future)
```

### **Admin Overrides**
Admins can bypass any unlock requirement and manually grant access.

---

## Migration Updates Needed

### **Add to Migration 022:**
```sql
-- User Roles Table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- RLS Policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "System can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (true); -- Service role only

-- Function: Initialize training user on signup
CREATE OR REPLACE FUNCTION initialize_training_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign dna_trainee role
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'dna_trainee')
  ON CONFLICT DO NOTHING;

  -- Create journey record
  INSERT INTO dna_leader_journeys (user_id, current_stage, milestones)
  VALUES (
    NEW.id,
    'onboarding',
    '{
      "flow_assessment_complete": {"completed": false},
      "manual_complete": {"completed": false},
      "launch_guide_reviewed": {"completed": false},
      "first_group_created": {"completed": false}
    }'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Unlock Flow Assessment
  INSERT INTO dna_content_unlocks (user_id, content_type, unlocked, unlocked_at, unlock_trigger)
  VALUES (
    NEW.id,
    'flow_assessment',
    TRUE,
    NOW(),
    'initial_signup'
  )
  ON CONFLICT (user_id, content_type) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users signup
CREATE TRIGGER init_training_user_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_training_user();
```

---

## Email Templates Needed

### **1. Welcome Email** (after signup)
```
Subject: Welcome to DNA Discipleship Training!

Hi [Name],

Welcome to DNA Discipleship! Your training journey begins with the Flow Assessment.

→ Start Flow Assessment: [link]

The Flow Assessment helps you identify internal roadblocks to discipleship multiplication.
It takes 30-45 minutes and unlocks your next training modules.

Ready to begin?

Making disciples who make disciples,
The DNA Team
```

### **2. Magic Link Email** (login)
```
Subject: Your DNA Training Login Link

Hi [Name],

Click below to access your DNA training dashboard:

→ Access Training: [magic link]

This link expires in 15 minutes.

Making disciples who make disciples,
The DNA Team
```

### **3. Module Unlocked Email** (after completion)
```
Subject: 🎉 New Training Module Unlocked

Hi [Name],

Congrats on completing [Module Name]!

You've unlocked: [Next Module Name]

→ Continue Training: [link]

Keep up the great work!

Making disciples who make disciples,
The DNA Team
```

---

## UI/UX Considerations

### **Signup Page** (`/training/signup`)
- Clean, simple form (just email + name)
- Explain what they'll get (Flow Assessment → Manual → Launch Guide → Groups)
- No password required (magic link only)
- "Sign up is free" messaging

### **Training Dashboard** (`/training`)
- Progress ring showing overall completion
- Module cards (locked/unlocked states)
- Clear next steps CTA
- Milestones timeline (non-cheesy)

### **Module Lock States**
- **Locked:** Grayed out, shows unlock requirement
- **Unlocked:** Full color, "Start" button
- **In Progress:** Progress indicator (50% complete)
- **Completed:** Green checkmark, "Review" button

---

## Next Steps

1. **Update migration 022** with user_roles table
2. **Build signup/login pages**
3. **Create auth API routes** (`/api/training/signup`, `/api/training/login`)
4. **Build Flow Assessment UI**
5. **Add admin override controls**

---

**Ready to implement?**
