# Training Auth Unification Plan

## Status: ✅ Implementation Complete

The training auth system has been unified with the main auth system. Run migration `026_training-auth-unification.sql` in Supabase to complete the migration.

---

## Current State: Two Separate Auth Systems (Before Migration)

### 1. Unified Auth (`/src/lib/unified-auth.ts`)
Used by: Church dashboard, DNA groups, Admin

| Component | Implementation |
|-----------|---------------|
| Session Cookie | `user_session` |
| Token Table | `magic_link_tokens` |
| User Table | `users` |
| Roles Table | `user_roles` |
| Roles | `church_leader`, `dna_leader`, `training_participant`, `admin` |

### 2. Training Auth (`/src/lib/training-auth.ts`)
Used by: Training dashboard, Flow Assessment

| Component | Implementation |
|-----------|---------------|
| Session Cookie | `dna_training_session` |
| Token Table | `training_magic_links` |
| User Storage | Supabase Auth (`auth.users`) |
| Roles | Via `user_roles` table |
| Journey | `dna_leader_journeys` table |
| Content | `dna_content_unlocks` table |

## Problem

Training users are stored in **Supabase Auth** while church/DNA leaders are in the custom **`users` table**. This creates:

1. **Duplicate accounts** - A training participant who becomes a DNA leader needs two accounts
2. **No seamless transition** - Completing training doesn't automatically grant DNA leader access
3. **Two login flows** - `/login` vs `/training/login`
4. **Confusion** - Which system am I logged into?

---

## Solution: Migrate Training to Unified Auth

### Phase 1: Database Updates

#### 1.1 Add training-specific columns to `users` table

```sql
-- Training journey data (currently in dna_leader_journeys)
ALTER TABLE users ADD COLUMN training_journey JSONB DEFAULT '{}';

-- Or create a separate table linked to users.id
CREATE TABLE user_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_stage TEXT DEFAULT 'onboarding',
  milestones JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Content unlocks (move from dna_content_unlocks)
CREATE TABLE user_content_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  unlock_trigger TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_type)
);
```

#### 1.2 Migrate existing training users

```sql
-- For each user in Supabase Auth that has training data:
-- 1. Create entry in users table
-- 2. Copy roles to user_roles
-- 3. Copy journey to user_training_progress
-- 4. Copy unlocks to user_content_unlocks
```

### Phase 2: Update Training Auth to Use Unified System

#### 2.1 Update `/api/training/signup/route.ts`

**Before:**
```typescript
// Creates user in Supabase Auth
const result = await createTrainingUser(email, name)
```

**After:**
```typescript
// Create user in unified users table
const { data: user } = await supabase
  .from('users')
  .insert({ email, name })
  .select()
  .single()

// Assign training_participant role
await supabase
  .from('user_roles')
  .insert({ user_id: user.id, role: 'training_participant' })

// Initialize training progress
await supabase
  .from('user_training_progress')
  .insert({ user_id: user.id, current_stage: 'onboarding' })

// Send magic link using unified system
await sendMagicLink(email)
```

#### 2.2 Update `/api/training/login/route.ts`

**Before:**
```typescript
// Uses training-specific magic link
const result = await createMagicLink(email)
```

**After:**
```typescript
// Uses unified magic link system
import { sendMagicLink } from '@/lib/email'
await sendMagicLink(email, 'training') // Pass context for redirect
```

#### 2.3 Update `/api/training/verify/route.ts`

**Before:**
```typescript
// Verifies training-specific token
const result = await verifyMagicLink(token)
// Creates dna_training_session cookie
```

**After:**
```typescript
// Redirect to unified verify endpoint
// Which creates user_session cookie
return NextResponse.redirect('/api/auth/verify?token=' + token)
```

#### 2.4 Update training dashboard API

**Before:**
```typescript
import { getTrainingSession } from '@/lib/training-auth'
const session = await getTrainingSession()
```

**After:**
```typescript
import { getUnifiedSession, hasRole } from '@/lib/unified-auth'
const session = await getUnifiedSession()
if (!hasRole(session, 'training_participant')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Phase 3: Update Unified Auth to Support Training

#### 3.1 Add training helper functions to `unified-auth.ts`

```typescript
/**
 * Get training progress for a user
 */
export async function getTrainingProgress(userId: string) {
  const { data } = await supabase
    .from('user_training_progress')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

/**
 * Get content unlocks for a user
 */
export async function getContentUnlocks(userId: string) {
  const { data } = await supabase
    .from('user_content_unlocks')
    .select('content_type, unlocked')
    .eq('user_id', userId)

  return data?.reduce((acc, item) => {
    acc[item.content_type] = item.unlocked
    return acc
  }, {} as Record<string, boolean>) || {}
}

/**
 * Check if user is training participant
 */
export function isTrainingParticipant(session: UserSession | null): boolean {
  return hasRole(session, 'training_participant') || isAdmin(session)
}
```

#### 3.2 Update login redirect logic

In `/api/auth/verify/route.ts`:

```typescript
// Determine redirect based on roles
function getRedirectUrl(session: UserSession): string {
  // Check URL parameter for intended destination
  const destination = searchParams.get('destination')
  if (destination === 'training') return '/training'
  if (destination === 'groups') return '/groups'

  // Default priority: church_leader > dna_leader > training_participant
  if (hasRole(session, 'church_leader')) return '/dashboard'
  if (hasRole(session, 'dna_leader')) return '/groups'
  if (hasRole(session, 'training_participant')) return '/training'
  if (hasRole(session, 'admin')) return '/admin'

  return '/'
}
```

### Phase 4: Remove Old Training Auth

#### 4.1 Delete deprecated files
- `/src/lib/training-auth.ts` (after full migration)
- `/src/app/training/login/page.tsx` (redirect to `/login`)
- `/src/app/api/training/login/route.ts`
- `/src/app/api/training/verify/route.ts`
- `/src/app/api/training/logout/route.ts`

#### 4.2 Update redirects
- `/training/login` → redirect to `/login`
- `/api/training/verify` → redirect to `/api/auth/verify`

### Phase 5: Flow Assessment Migration

The Flow Assessment data is currently tied to Supabase Auth user IDs. Need to:

1. Create new table linked to `users.id`:
```sql
CREATE TABLE flow_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  roadblock_ratings JSONB,
  reflections JSONB,
  top_roadblocks TEXT[],
  action_plan JSONB,
  accountability_partner TEXT,
  accountability_date DATE,
  status TEXT DEFAULT 'draft',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  previous_assessment_id UUID REFERENCES flow_assessments(id)
);
```

2. Migrate existing assessment data

---

## Migration Steps

### Step 1: Create New Tables
Run migration to add:
- `user_training_progress`
- `user_content_unlocks`
- `flow_assessments` (if needed)

### Step 2: Migrate Existing Training Users
Script to:
1. For each user in Supabase Auth with training data
2. Check if email exists in `users` table
3. If not, create user in `users` table
4. Add `training_participant` role in `user_roles`
5. Copy journey data to `user_training_progress`
6. Copy content unlocks to `user_content_unlocks`

### Step 3: Update API Routes
One by one, update training API routes to use unified auth:
- [ ] `/api/training/dashboard`
- [ ] `/api/training/assessment`
- [ ] `/api/training/assessment/complete`
- [ ] `/api/training/assessment/results`
- [ ] `/api/training/signup`
- [ ] `/api/training/login` → redirect to unified
- [ ] `/api/training/verify` → redirect to unified
- [ ] `/api/training/logout` → redirect to unified

### Step 4: Update Frontend Pages
- [ ] `/training/page.tsx` - use unified session
- [ ] `/training/assessment/page.tsx` - use unified session
- [ ] `/training/assessment/results/page.tsx` - use unified session
- [ ] `/training/login/page.tsx` → redirect to `/login`
- [ ] `/signup/page.tsx` - update to use unified signup

### Step 5: Clean Up
- Remove `/src/lib/training-auth.ts`
- Remove old training auth routes
- Drop old tables (after verifying migration)

---

## Benefits After Migration

1. **One login for everything** - Church leaders who do training don't need separate account
2. **Seamless role progression** - Training → DNA Leader → Church Leader
3. **Unified UserMenu** - Training shows up in dropdown
4. **Simpler codebase** - One auth system to maintain
5. **Consistent experience** - Same login flow everywhere

---

## Rollback Plan

Keep Supabase Auth data intact during migration. If issues arise:
1. Revert code to use training-auth.ts
2. Supabase Auth users still work
3. New unified users work with old system too

---

## Estimated Effort

| Task | Time |
|------|------|
| Database migration | 1 hour |
| Data migration script | 2 hours |
| API route updates | 3 hours |
| Frontend updates | 2 hours |
| Testing | 2 hours |
| **Total** | ~10 hours |

---

## Files Affected

### To Modify
- `/src/lib/unified-auth.ts` - Add training helpers
- `/src/app/api/auth/verify/route.ts` - Add training redirect logic
- `/src/app/api/training/dashboard/route.ts` - Use unified auth
- `/src/app/api/training/assessment/*` - Use unified auth
- `/src/app/training/page.tsx` - Already updated
- `/src/app/signup/page.tsx` - Use unified signup

### To Delete (after migration)
- `/src/lib/training-auth.ts`
- `/src/app/api/training/login/route.ts`
- `/src/app/api/training/verify/route.ts`
- `/src/app/api/training/logout/route.ts`
- `/src/app/training/login/page.tsx`

### To Create
- `/database/026_training-unification.sql`
