# Unified Authentication System - Implementation Plan

## Problem Statement

Currently, DNA Hub has **three separate authentication systems**:

1. **Church Leaders** - `church_leader_session` cookie → `/dashboard`
2. **DNA Leaders** - `dna_leader_session` cookie → `/groups`
3. **Training Participants** - `training_session` cookie → `/training`

**User Impact:**
- A DNA leader who completes training needs a different login for `/groups`
- A church leader who wants training needs another login
- A church leader who also leads a DNA group needs **three different logins**
- Massive friction and confusion for users

## Solution: Single User System with Role-Based Access

### New Architecture

```
One User Account → Multiple Roles → Access to Multiple Dashboards
```

**Example User Journeys:**
- **Sarah (Church Leader)** → Logs in once → Sees Dashboard + Training tabs
- **Mike (DNA Leader)** → Logs in once → Sees DNA Groups + Training tabs
- **Pastor Tom (Church Leader + DNA Leader)** → Logs in once → Sees all three: Dashboard + DNA Groups + Training

---

## Phase 1: Database Migration

### Step 1.1: Create Unified User Tables

**New Migration: `025_unified_users.sql`**

```sql
-- 1. Create unified users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create role assignments table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('church_leader', 'dna_leader', 'training_participant', 'admin')),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role, church_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_church_id ON user_roles(church_id);

-- 3. Add user_id to existing tables
ALTER TABLE church_leaders ADD COLUMN user_id UUID REFERENCES users(id);
ALTER TABLE dna_leaders ADD COLUMN user_id UUID REFERENCES users(id);
ALTER TABLE training_participants ADD COLUMN user_id UUID REFERENCES users(id);
```

### Step 1.2: Migrate Existing Data

```sql
-- Migrate church leaders
INSERT INTO users (email, name)
SELECT DISTINCT email, name FROM church_leaders
ON CONFLICT (email) DO NOTHING;

UPDATE church_leaders cl
SET user_id = u.id
FROM users u
WHERE cl.email = u.email;

INSERT INTO user_roles (user_id, role, church_id)
SELECT cl.user_id, 'church_leader', cl.church_id
FROM church_leaders cl
WHERE cl.user_id IS NOT NULL;

-- Migrate DNA leaders
INSERT INTO users (email, name)
SELECT DISTINCT email, name FROM dna_leaders
ON CONFLICT (email) DO NOTHING;

UPDATE dna_leaders dl
SET user_id = u.id
FROM users u
WHERE dl.email = u.email;

INSERT INTO user_roles (user_id, role, church_id)
SELECT dl.user_id, 'dna_leader', dl.church_id
FROM dna_leaders dl
WHERE dl.user_id IS NOT NULL;

-- Migrate training participants
INSERT INTO users (email, name)
SELECT DISTINCT email, name FROM training_participants
ON CONFLICT (email) DO NOTHING;

UPDATE training_participants tp
SET user_id = u.id
FROM users u
WHERE tp.email = u.email;

INSERT INTO user_roles (user_id, role, church_id)
SELECT tp.user_id, 'training_participant', NULL
FROM training_participants tp
WHERE tp.user_id IS NOT NULL;

-- Mark admins
INSERT INTO user_roles (user_id, role, church_id)
SELECT u.id, 'admin', NULL
FROM users u
WHERE u.email IN ('thearkidentity@gmail.com', 'travis@arkidentity.com')
ON CONFLICT DO NOTHING;
```

### Step 1.3: Add Constraints (After Migration)

```sql
-- Make user_id required after migration
ALTER TABLE church_leaders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE dna_leaders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE training_participants ALTER COLUMN user_id SET NOT NULL;
```

---

## Phase 2: Update Auth System

### Step 2.1: Create Unified Auth Helper

**File: `/src/lib/unified-auth.ts`**

```typescript
import { cookies } from 'next/headers'
import { createClient } from './supabase'

export interface UserSession {
  userId: string
  email: string
  name: string | null
  roles: Array<{
    role: 'church_leader' | 'dna_leader' | 'training_participant' | 'admin'
    churchId: string | null
  }>
}

export async function getUnifiedSession(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('user_session')?.value

  if (!sessionToken) return null

  const supabase = createClient()

  // Verify token and get user
  const { data: tokenData } = await supabase
    .from('magic_link_tokens')
    .select('email')
    .eq('token', sessionToken)
    .eq('used', true)
    .single()

  if (!tokenData) return null

  // Get user and roles
  const { data: user } = await supabase
    .from('users')
    .select(`
      id,
      email,
      name,
      user_roles (
        role,
        church_id
      )
    `)
    .eq('email', tokenData.email)
    .single()

  if (!user) return null

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    roles: user.user_roles
  }
}

export async function hasRole(
  session: UserSession | null,
  role: string,
  churchId?: string
): Promise<boolean> {
  if (!session) return false

  return session.roles.some(r => {
    if (r.role !== role) return false
    if (churchId && r.churchId !== churchId) return false
    return true
  })
}

export async function isAdmin(session: UserSession | null): Promise<boolean> {
  return hasRole(session, 'admin')
}

export async function getUserChurches(session: UserSession | null): Promise<string[]> {
  if (!session) return []

  return session.roles
    .filter(r => r.churchId !== null)
    .map(r => r.churchId as string)
}
```

### Step 2.2: Update Login API

**File: `/src/app/api/auth/verify/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { token } = await request.json()
  const supabase = createClient()

  // Verify token
  const { data: tokenData } = await supabase
    .from('magic_link_tokens')
    .select('email, expires_at, used')
    .eq('token', token)
    .single()

  if (!tokenData || tokenData.used || new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  // Mark token as used
  await supabase
    .from('magic_link_tokens')
    .update({ used: true })
    .eq('token', token)

  // Set unified session cookie
  const cookieStore = await cookies()
  cookieStore.set('user_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  return NextResponse.json({ success: true })
}
```

### Step 2.3: Delete Old Auth Cookies

**On successful login, clear old cookies:**

```typescript
cookieStore.delete('church_leader_session')
cookieStore.delete('dna_leader_session')
cookieStore.delete('training_session')
```

---

## Phase 3: Update UI - Unified Navigation

### Step 3.1: Create Unified Layout Component

**File: `/src/components/UnifiedNav.tsx`**

```typescript
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserSession } from '@/lib/unified-auth'

interface UnifiedNavProps {
  session: UserSession
}

export default function UnifiedNav({ session }: UnifiedNavProps) {
  const pathname = usePathname()

  const hasChurchLeaderRole = session.roles.some(r => r.role === 'church_leader')
  const hasDNALeaderRole = session.roles.some(r => r.role === 'dna_leader')
  const hasTrainingRole = session.roles.some(r => r.role === 'training_participant')
  const isAdmin = session.roles.some(r => r.role === 'admin')

  const tabs = []

  // Church Dashboard
  if (hasChurchLeaderRole || isAdmin) {
    tabs.push({
      name: 'Church Dashboard',
      href: '/dashboard',
      current: pathname.startsWith('/dashboard')
    })
  }

  // DNA Groups
  if (hasDNALeaderRole || isAdmin) {
    tabs.push({
      name: 'DNA Groups',
      href: '/groups',
      current: pathname.startsWith('/groups')
    })
  }

  // Training
  if (hasTrainingRole || isAdmin) {
    tabs.push({
      name: 'DNA Training',
      href: '/training',
      current: pathname.startsWith('/training')
    })
  }

  // Admin
  if (isAdmin) {
    tabs.push({
      name: 'Admin',
      href: '/admin',
      current: pathname.startsWith('/admin')
    })
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-[var(--navy)]">DNA Hub</span>
            </Link>

            {/* Tabs */}
            <div className="ml-10 flex space-x-8">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`
                    inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                    ${tab.current
                      ? 'border-[var(--gold)] text-[var(--navy)]'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }
                  `}
                >
                  {tab.name}
                </Link>
              ))}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-4">{session.email}</span>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
```

### Step 3.2: Update Root Layout

**File: `/src/app/layout.tsx`**

```typescript
import { getUnifiedSession } from '@/lib/unified-auth'
import UnifiedNav from '@/components/UnifiedNav'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getUnifiedSession()

  return (
    <html lang="en">
      <body>
        {session && <UnifiedNav session={session} />}
        {children}
      </body>
    </html>
  )
}
```

---

## Phase 4: Update All Protected Routes

### Pattern for Protected Pages

```typescript
// Example: /src/app/dashboard/page.tsx
import { getUnifiedSession, hasRole } from '@/lib/unified-auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getUnifiedSession()

  if (!session) redirect('/login')
  if (!await hasRole(session, 'church_leader') && !await hasRole(session, 'admin')) {
    redirect('/unauthorized')
  }

  // Page content...
}
```

### Update These Pages

- `/src/app/dashboard/page.tsx`
- `/src/app/groups/page.tsx`
- `/src/app/training/page.tsx`
- `/src/app/admin/page.tsx`

### Update These API Routes

- `/src/app/api/dashboard/route.ts`
- `/src/app/api/groups/*`
- `/src/app/api/training/*`
- `/src/app/api/admin/*`

---

## Phase 5: Handle Role Assignment

### When to Assign Roles

1. **Church Leader** - Assigned when church is created or when invited
2. **DNA Leader** - Assigned when invited by church leader
3. **Training Participant** - Assigned when they sign up for training
4. **Admin** - Manually assigned (hardcoded emails)

### Example: Invite DNA Leader

**File: `/src/app/api/dna-leaders/invite/route.ts`**

```typescript
export async function POST(request: NextRequest) {
  const session = await getUnifiedSession()
  const { email, name, churchId } = await request.json()

  const supabase = createClient()

  // Get or create user
  let { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (!user) {
    const { data: newUser } = await supabase
      .from('users')
      .insert({ email, name })
      .select('id')
      .single()
    user = newUser
  }

  // Assign DNA leader role
  await supabase
    .from('user_roles')
    .insert({
      user_id: user.id,
      role: 'dna_leader',
      church_id: churchId
    })

  // Create DNA leader record
  await supabase
    .from('dna_leaders')
    .insert({
      user_id: user.id,
      email,
      name,
      church_id: churchId,
      status: 'invited'
    })

  // Send magic link...
}
```

---

## Phase 6: Testing Plan

### Test Scenarios

1. **New User (Church Leader)**
   - Sign up → Should get `church_leader` role
   - Should see Church Dashboard tab only

2. **DNA Leader Invitation**
   - Existing church leader invited as DNA leader
   - Should now see both Church Dashboard + DNA Groups tabs

3. **Training Signup**
   - Existing DNA leader signs up for training
   - Should now see DNA Groups + DNA Training tabs

4. **Admin User**
   - Admin logs in
   - Should see all tabs: Church Dashboard, DNA Groups, DNA Training, Admin

5. **Multi-Church DNA Leader**
   - DNA leader at Church A and Church B
   - Should see groups from both churches in `/groups`

### Migration Validation Queries

```sql
-- Verify all church leaders have users
SELECT cl.id, cl.email
FROM church_leaders cl
LEFT JOIN users u ON cl.user_id = u.id
WHERE u.id IS NULL;

-- Verify all users have at least one role
SELECT u.id, u.email, COUNT(ur.id) as role_count
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
GROUP BY u.id, u.email
HAVING COUNT(ur.id) = 0;

-- Count users with multiple roles
SELECT u.email, COUNT(ur.id) as role_count
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.email
HAVING COUNT(ur.id) > 1;
```

---

## Rollout Strategy

### Option A: Big Bang (Recommended for Small User Base)

1. Schedule maintenance window (30 minutes)
2. Run database migration
3. Deploy new code
4. Test all user types
5. Monitor for issues

### Option B: Gradual Migration (If Many Users)

1. Deploy new `users` table alongside old system
2. New logins use new system
3. Old cookies still work (dual system)
4. Migrate users in batches
5. Eventually deprecate old cookies

---

## Breaking Changes & Communication

### User Impact

- **All users must log in again** (one-time)
- Old magic link tokens still work for 24 hours
- Sessions persist for 7 days (same as before)

### Email Communication Template

```
Subject: DNA Hub Login Update - Action Required

Hi [Name],

We've upgraded DNA Hub to give you seamless access across all your dashboards.

What's New:
✅ One login for everything (Church Dashboard, DNA Groups, Training)
✅ No more juggling multiple accounts
✅ Faster navigation between sections

What You Need to Do:
→ Log in again at dnahub.com/login
→ Use the same email address you've always used
→ You'll receive a magic link as usual

Your data is safe and unchanged. Just one quick re-login!

Questions? Reply to this email.

- The DNA Hub Team
```

---

## Files to Create/Modify

### New Files
- `/database/025_unified_users.sql` - Migration
- `/src/lib/unified-auth.ts` - New auth helpers
- `/src/components/UnifiedNav.tsx` - Unified navigation
- `/docs/planning/UNIFIED-AUTH-PLAN.md` - This file

### Files to Modify
- `/src/lib/auth.ts` - Deprecate old helpers, add compatibility layer
- `/src/app/api/auth/verify/route.ts` - Use unified session
- `/src/app/api/auth/logout/route.ts` - Clear unified cookie
- `/src/app/layout.tsx` - Add unified nav
- `/src/app/dashboard/page.tsx` - Use new auth
- `/src/app/groups/page.tsx` - Use new auth
- `/src/app/training/page.tsx` - Use new auth
- `/src/app/admin/page.tsx` - Use new auth
- All API routes - Use `getUnifiedSession()`

---

## Estimated Timeline

- **Phase 1 (Database)**: 2 hours
- **Phase 2 (Auth System)**: 3 hours
- **Phase 3 (Navigation UI)**: 2 hours
- **Phase 4 (Route Updates)**: 4 hours
- **Phase 5 (Role Assignment)**: 2 hours
- **Phase 6 (Testing)**: 3 hours

**Total: ~16 hours** (2 work days)

---

## Success Criteria

✅ All existing users can log in with one email
✅ Users with multiple roles see all relevant tabs
✅ No duplicate user records
✅ All existing data accessible
✅ No broken auth on any page
✅ Session persists across dashboard switches
✅ Admin panel works for admins only

---

## Rollback Plan

If issues arise:

1. Revert code deployment
2. Old cookies still work (if kept as fallback)
3. Users can still access via old URLs
4. Database changes are additive (safe to keep)

**Migration is reversible** because we're adding `user_id` columns, not removing old columns immediately.
