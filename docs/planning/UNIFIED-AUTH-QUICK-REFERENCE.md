# Unified Auth System - Quick Reference

## Overview

The unified auth system allows users to log in once and access multiple dashboards based on their roles.

**One user account → Multiple roles → Access to multiple dashboards**

---

## Session Structure

```typescript
interface UnifiedSession {
  // User identity
  userId: string          // From users table
  email: string           // User's email
  name: string            // User's name

  // Legacy IDs (for backwards compatibility)
  leaderId?: string       // From church_leaders or dna_leaders table
  churchId?: string       // Primary church ID

  // Session type (for backwards compatibility)
  type: 'church_leader' | 'dna_leader' | 'admin'

  // Full role information
  roles: Array<{
    role: 'church_leader' | 'dna_leader' | 'training_participant' | 'admin'
    churchId: string | null
  }>
}
```

---

## Usage in API Routes

### Basic Auth Check

```typescript
import { getUnifiedSession } from '@/lib/unified-auth'

export async function GET() {
  const session = await getUnifiedSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // User is authenticated
  // Use session.email, session.userId, etc.
}
```

### Admin-Only Route

```typescript
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth'

export async function GET() {
  const session = await getUnifiedSession()

  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Admin access granted
}
```

### Church Leader Route

```typescript
import { getUnifiedSession, isChurchLeader } from '@/lib/unified-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  const session = await getUnifiedSession()
  const { churchId } = await params

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Allow admins OR church leaders for this specific church
  if (!isAdmin(session) && !isChurchLeader(session, churchId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Access granted
}
```

### DNA Leader Route

```typescript
import { getUnifiedSession, isDNALeader } from '@/lib/unified-auth'

export async function GET() {
  const session = await getUnifiedSession()

  if (!session || !isDNALeader(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // DNA leader access granted
}
```

---

## Usage in Server Components (Pages)

```typescript
import { getUnifiedSession, hasRole } from '@/lib/unified-auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getUnifiedSession()

  if (!session) {
    redirect('/login')
  }

  if (!await hasRole(session, 'church_leader') && !await hasRole(session, 'admin')) {
    redirect('/unauthorized')
  }

  return (
    <div>
      <h1>Welcome, {session.name}</h1>
      {/* Page content */}
    </div>
  )
}
```

---

## Helper Functions

### `getUnifiedSession()`
Returns the current user session or `null` if not authenticated.

**Returns:**
```typescript
UnifiedSession | null
```

### `isAdmin(session)`
Checks if user has admin role.

**Usage:**
```typescript
if (isAdmin(session)) {
  // User is an admin
}
```

### `isChurchLeader(session, churchId?)`
Checks if user is a church leader, optionally for a specific church.

**Usage:**
```typescript
// Any church leader
if (isChurchLeader(session)) { ... }

// Church leader for specific church
if (isChurchLeader(session, 'church-uuid')) { ... }
```

### `isDNALeader(session, churchId?)`
Checks if user is a DNA leader, optionally for a specific church.

**Usage:**
```typescript
// Any DNA leader
if (isDNALeader(session)) { ... }

// DNA leader for specific church
if (isDNALeader(session, 'church-uuid')) { ... }
```

### `isTrainingParticipant(session)`
Checks if user is a training participant.

**Usage:**
```typescript
if (isTrainingParticipant(session)) { ... }
```

### `hasRole(session, role, churchId?)`
Generic role checker.

**Usage:**
```typescript
if (await hasRole(session, 'church_leader', 'church-uuid')) { ... }
```

### `getUserChurches(session)`
Returns array of all church IDs the user has access to.

**Returns:**
```typescript
string[]  // Array of church UUIDs
```

### `getPrimaryChurch(session)`
Returns the user's primary church ID.

**Returns:**
```typescript
string | null
```

### `getDNALeaderChurches(session)`
Returns array of church IDs where user is a DNA leader.

**Returns:**
```typescript
string[]
```

---

## Common Patterns

### Multi-Church Access

```typescript
const session = await getUnifiedSession()
const churches = getUserChurches(session)

// User can access multiple churches
if (churches.length > 1) {
  // Show church switcher UI
}
```

### Role-Based Navigation

```typescript
const session = await getUnifiedSession()

// Determine available dashboards
const dashboards = []

if (isChurchLeader(session) || isAdmin(session)) {
  dashboards.push({ name: 'My Church', href: '/dashboard' })
}

if (isDNALeader(session) || isAdmin(session)) {
  dashboards.push({ name: 'My Groups', href: '/groups' })
}

if (isTrainingParticipant(session)) {
  dashboards.push({ name: 'DNA Training', href: '/training' })
}
```

### Accessing Church Data

```typescript
const session = await getUnifiedSession()

// Get primary church ID (for backwards compatibility)
const churchId = session.churchId

// Or use helper
const primaryChurchId = getPrimaryChurch(session)

// Fetch church data
const { data: church } = await supabase
  .from('churches')
  .select('*')
  .eq('id', primaryChurchId)
  .single()
```

---

## Migration from Old Auth

### Before (Old Auth)

```typescript
import { getSession, isAdmin } from '@/lib/auth'

const session = await getSession()
if (!session) return unauthorized()

const admin = isAdmin(session.leader.email)
const churchId = session.church.id
const leaderName = session.leader.name
```

### After (Unified Auth)

```typescript
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth'

const session = await getUnifiedSession()
if (!session) return unauthorized()

const admin = isAdmin(session)
const churchId = session.churchId
const leaderName = session.name
```

### Key Changes

| Old | New |
|-----|-----|
| `getSession()` | `getUnifiedSession()` |
| `getDNALeaderSession()` | `getUnifiedSession()` |
| `isAdmin(session.leader.email)` | `isAdmin(session)` |
| `session.leader.email` | `session.email` |
| `session.leader.id` | `session.leaderId` or `session.userId` |
| `session.leader.name` | `session.name` |
| `session.church.id` | `session.churchId` |

---

## Database Tables

### `users`
Core user table - one row per email address.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `user_roles`
Role assignments - many-to-many relationship.

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  role TEXT CHECK (role IN ('church_leader', 'dna_leader', 'training_participant', 'admin')),
  church_id UUID REFERENCES churches(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role, church_id)
);
```

---

## Session Cookie

**Name:** `session`

**Properties:**
- HttpOnly: true
- Secure: true (in production)
- SameSite: lax
- Max-Age: 7 days

**Set on:** Login via magic link verification
**Cleared on:** Logout

---

## Error Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 401 | Unauthorized | No session found |
| 403 | Forbidden | Session exists but lacks required role |
| 400 | Bad Request | Missing required parameters |

---

## Best Practices

1. **Always check session first**
   ```typescript
   const session = await getUnifiedSession()
   if (!session) return unauthorized()
   ```

2. **Use specific role checks**
   ```typescript
   // Good
   if (isAdmin(session)) { ... }

   // Avoid
   if (session.roles.some(r => r.role === 'admin')) { ... }
   ```

3. **Allow admins access to everything**
   ```typescript
   if (!isAdmin(session) && !isChurchLeader(session, churchId)) {
     return forbidden()
   }
   ```

4. **Use backwards-compatible fields**
   ```typescript
   // session.churchId works for both old and new code
   // session.leaderId provides backwards compatibility
   ```

5. **Check church-specific roles when needed**
   ```typescript
   // Don't just check if they're a church leader
   // Check if they're a leader for THIS church
   if (!isChurchLeader(session, churchId)) {
     return forbidden()
   }
   ```

---

## Troubleshooting

### "Unauthorized" error when logged in

**Check:**
1. Is `session` cookie set? (Check browser DevTools → Application → Cookies)
2. Is magic link token marked as `used: true` in database?
3. Does user exist in `users` table?

### "Forbidden" error with correct role

**Check:**
1. Does user have the role in `user_roles` table?
2. Is `church_id` correct for church-specific roles?
3. Are you using `isAdmin(session)` not `isAdmin(session.email)`?

### User doesn't see expected dashboards

**Check:**
1. Query user_roles: `SELECT * FROM user_roles WHERE user_id = 'user-uuid'`
2. Verify roles are correctly assigned
3. Check UserMenu component is receiving correct session data

---

## Examples

See `/docs/planning/TESTING-UNIFIED-AUTH.md` for comprehensive testing examples.
