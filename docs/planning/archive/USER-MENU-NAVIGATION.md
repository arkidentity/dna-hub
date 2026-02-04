# User Menu Navigation - Unified Dashboard Access

## Problem Solved

Users with multiple roles (Church Leader + DNA Leader + Training Participant) need to access different dashboards, but we can't add tabs at the page level because:

1. **Page tabs are contextual** (Overview, DNA Journey, DNA Groups on church dashboard)
2. **DNA Groups means different things** in different contexts:
   - Church Dashboard → "DNA Groups" tab = church-wide overview (all groups at the church)
   - Personal Dashboard → "My DNA Groups" = groups I personally lead

## Solution: User Menu Dropdown

Add a **dropdown menu** next to the user's name in the top-right corner that lets them switch between their available dashboards.

---

## Visual Design

### Top Navigation Bar (All Pages)

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  DNA Hub                              Admin | Travis Edwards ▼    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Components:**
- **Left:** DNA Hub logo (links to `/`)
- **Right:**
  - Role badges (if admin): "Admin"
  - User name with dropdown arrow
  - Dropdown menu on click

---

### Dropdown Menu (Expanded)

When user clicks their name:

```
┌────────────────────────────────────────────────────────────────────┐
│  DNA Hub                              Admin | Travis Edwards ▼    │
└────────────────────────────────────────────────────────────────────┘
                                                      │
                                                      ▼
                                    ┌──────────────────────────────┐
                                    │ My Dashboards                │
                                    ├──────────────────────────────┤
                                    │ ✓ My Church                  │
                                    │   My Groups                  │
                                    │   DNA Training               │
                                    ├──────────────────────────────┤
                                    │ travis@arkidentity.com       │
                                    │ Settings (future)            │
                                    │ Logout                       │
                                    └──────────────────────────────┘
```

**Dropdown Items (based on user roles):**

| Role | Menu Item | Goes To | Description |
|------|-----------|---------|-------------|
| `church_leader` | My Church | `/dashboard` | Implementation roadmap, church overview |
| `dna_leader` | My Groups | `/groups` | Personal groups they lead |
| `training_participant` | DNA Training | `/training` | Their training progress |

**Visual Indicators:**
- ✓ **Checkmark** = Currently viewing this dashboard
- **Bold text** = Currently active
- **Hover** = Light gray background

---

## Example Scenarios

### Scenario 1: Church Leader Only

**User:** pastor@mychurch.com
**Roles:** Church Leader at "First Baptist"

**Dropdown Menu:**
```
┌──────────────────────────────┐
│ My Dashboards                │
├──────────────────────────────┤
│ ✓ My Church                  │
├──────────────────────────────┤
│ pastor@mychurch.com          │
│ Logout                       │
└──────────────────────────────┘
```

**Notes:**
- Only one dashboard available
- Sees church-wide DNA Groups in the "DNA Groups" tab on `/dashboard`
- Cannot access `/groups` (not a DNA leader)

---

### Scenario 2: DNA Leader Only

**User:** john@email.com
**Roles:** DNA Leader at "First Baptist"

**Dropdown Menu:**
```
┌──────────────────────────────┐
│ My Dashboards                │
├──────────────────────────────┤
│ ✓ My Groups                  │
│   DNA Training               │
├──────────────────────────────┤
│ john@email.com               │
│ Logout                       │
└──────────────────────────────┘
```

**Notes:**
- Can access `/groups` (personal groups)
- Can access `/training` (enrolled in training)
- Cannot access `/dashboard` (not a church leader)

---

### Scenario 3: Church Leader + DNA Leader

**User:** pastor@mychurch.com
**Roles:**
- Church Leader at "First Baptist"
- DNA Leader at "First Baptist"

**When viewing `/dashboard`:**

Top bar:
```
┌────────────────────────────────────────────────────────────────────┐
│  DNA Hub                                        Pastor Tom ▼       │
└────────────────────────────────────────────────────────────────────┘
```

Page tabs:
```
┌────────────────────────────────────────────────────────────────────┐
│  Overview    DNA Journey    DNA Groups                             │
│  ────────                                                           │
└────────────────────────────────────────────────────────────────────┘
```

**DNA Groups tab content (church-wide view):**
```
DNA Groups at First Baptist Church
───────────────────────────────────

Total Groups: 8
Total DNA Leaders: 5
Total Disciples: 42

[Invite DNA Leader]

┌─────────────────────────────────────────────────────────────┐
│ Men's Discipleship Group                                    │
│ Leader: Pastor Tom                      5 disciples  Phase 2│
│ Started: Jan 15, 2026                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Young Adults Group                                          │
│ Leader: Sarah Johnson                   3 disciples  Phase 1│
│ Started: Feb 1, 2026                                        │
└─────────────────────────────────────────────────────────────┘

[All 8 groups listed here - read-only for church leader]
```

**User clicks dropdown:**
```
┌──────────────────────────────┐
│ My Dashboards                │
├──────────────────────────────┤
│ ✓ My Church                  │ ← Currently here
│   My Groups                  │ ← Click to switch
│   DNA Training               │
├──────────────────────────────┤
│ pastor@mychurch.com          │
│ Logout                       │
└──────────────────────────────┘
```

**User clicks "My Groups" → Goes to `/groups`:**

Top bar (same):
```
┌────────────────────────────────────────────────────────────────────┐
│  DNA Hub                                        Pastor Tom ▼       │
└────────────────────────────────────────────────────────────────────┘
```

Page content (personal DNA leader view):
```
My DNA Groups
─────────────

You are leading 2 groups at First Baptist Church

┌─────────────────────────────────────────────────────────────┐
│ Men's Discipleship Group                    5 disciples     │
│ Phase 2: Leader Preparation                 60% complete    │
│                                                             │
│ [View Details] [Add Disciple] [Leader Notes]               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Young Adults Group                          3 disciples     │
│ Phase 1: Church Partnership                 30% complete    │
│                                                             │
│ [View Details] [Add Disciple] [Leader Notes]               │
└─────────────────────────────────────────────────────────────┘

[+ Create New Group]
```

**User clicks dropdown again:**
```
┌──────────────────────────────┐
│ My Dashboards                │
├──────────────────────────────┤
│   My Church                  │ ← Go back to church view
│ ✓ My Groups                  │ ← Currently here
│   DNA Training               │
├──────────────────────────────┤
│ pastor@mychurch.com          │
│ Logout                       │
└──────────────────────────────┘
```

---

### Scenario 4: Admin User

**User:** travis@arkidentity.com
**Roles:** Admin

**Top bar:**
```
┌────────────────────────────────────────────────────────────────────┐
│  DNA Hub                              Admin | Travis Edwards ▼    │
└────────────────────────────────────────────────────────────────────┘
```

**Dropdown:**
```
┌──────────────────────────────┐
│ My Dashboards                │
├──────────────────────────────┤
│   My Church                  │
│   My Groups                  │
│   DNA Training               │
├──────────────────────────────┤
│ travis@arkidentity.com       │
│ Logout                       │
└──────────────────────────────┘
```

**Notes:**
- Admin users access `/admin` directly (no dropdown link needed)
- Dropdown only shows user-level dashboards
- Admin can still use all dashboards like a normal user

---

## Key Differences: Church vs Personal DNA Groups

### Church Dashboard → DNA Groups Tab (Read-Only Overview)

**URL:** `/dashboard` (DNA Groups tab)

**Purpose:** Church leader sees ALL groups at their church

**What they see:**
- Total groups: 8
- Total DNA leaders: 5
- Total disciples: 42
- [Invite DNA Leader] button
- List of all groups (read-only cards)

**Actions:**
- ✅ View group summaries
- ✅ Invite new DNA leaders
- ✅ See overall church DNA health
- ❌ Cannot manage groups directly
- ❌ Cannot add disciples
- ❌ Cannot write leader notes

---

### User Menu → My DNA Groups (Active Management)

**URL:** `/groups`

**Purpose:** DNA leader manages THEIR OWN groups

**What they see:**
- Only groups they lead: 2
- Full group details
- Disciple lists with assessment scores
- Leader notes interface
- Prayer requests

**Actions:**
- ✅ Create new groups
- ✅ Add/remove disciples
- ✅ Write private leader notes
- ✅ Track assessments
- ✅ Manage prayer requests
- ✅ Advance group phases

---

## Technical Implementation

### 1. Create User Menu Component

**File:** `/src/components/UserMenu.tsx`

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserSession } from '@/lib/unified-auth'

interface UserMenuProps {
  session: UserSession
}

export default function UserMenu({ session }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const dashboards = []

  // Build dashboard list based on roles
  if (session.roles.some(r => r.role === 'church_leader')) {
    dashboards.push({
      name: 'My Church',
      href: '/dashboard',
      active: pathname.startsWith('/dashboard')
    })
  }

  if (session.roles.some(r => r.role === 'dna_leader')) {
    dashboards.push({
      name: 'My Groups',
      href: '/groups',
      active: pathname.startsWith('/groups')
    })
  }

  if (session.roles.some(r => r.role === 'training_participant')) {
    dashboards.push({
      name: 'DNA Training',
      href: '/training',
      active: pathname.startsWith('/training')
    })
  }

  // Note: Admin users access /admin directly (no dropdown link needed)

  return (
    <div className="relative">
      {/* User button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[var(--navy)] hover:text-[var(--teal)]"
      >
        <span className="font-medium">{session.name || session.email}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Dashboards section */}
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            My Dashboards
          </div>

          {dashboards.map((dashboard) => (
            <Link
              key={dashboard.href}
              href={dashboard.href}
              onClick={() => setIsOpen(false)}
              className={`
                block px-4 py-2 text-sm hover:bg-gray-50
                ${dashboard.active ? 'font-semibold text-[var(--navy)]' : 'text-gray-700'}
              `}
            >
              {dashboard.active && '✓ '}
              {dashboard.name}
            </Link>
          ))}

          <div className="border-t border-gray-200 mt-2 pt-2">
            {/* User info */}
            <div className="px-4 py-2 text-sm text-gray-500">
              {session.email}
            </div>

            {/* Logout */}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 2. Update Top Navigation Bar

**File:** `/src/components/TopNav.tsx`

```typescript
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth'
import Link from 'next/link'
import UserMenu from './UserMenu'

export default async function TopNav() {
  const session = await getUnifiedSession()

  if (!session) return null

  const admin = await isAdmin(session)

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-[var(--navy)]">
              DNA Hub
            </Link>
          </div>

          {/* Right: Admin badge + User menu */}
          <div className="flex items-center gap-4">
            {admin && (
              <span className="px-3 py-1 bg-[var(--gold)] text-white text-xs font-semibold rounded-full">
                Admin
              </span>
            )}
            <UserMenu session={session} />
          </div>
        </div>
      </div>
    </nav>
  )
}
```

### 3. Add to Root Layout

**File:** `/src/app/layout.tsx`

```typescript
import TopNav from '@/components/TopNav'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  )
}
```

---

## Page-Level Navigation (Unchanged)

The existing page tabs remain exactly as they are:

### Church Dashboard (`/dashboard`)
```typescript
<div className="border-b border-gray-200">
  <nav className="flex gap-8">
    <Tab href="/dashboard" active={tab === 'overview'}>Overview</Tab>
    <Tab href="/dashboard/journey" active={tab === 'journey'}>DNA Journey</Tab>
    <Tab href="/dashboard/groups" active={tab === 'groups'}>DNA Groups</Tab>
  </nav>
</div>
```

### Admin Church View (`/admin/church/[id]`)
```typescript
<div className="border-b border-gray-200">
  <nav className="flex gap-8">
    <Tab href={`/admin/church/${id}`} active={tab === 'overview'}>Overview</Tab>
    <Tab href={`/admin/church/${id}/journey`} active={tab === 'journey'}>DNA Journey</Tab>
    <Tab href={`/admin/church/${id}/groups`} active={tab === 'groups'}>DNA Groups</Tab>
  </nav>
</div>
```

**These stay the same!** No changes needed.

---

## Benefits

✅ **Two-level navigation** - User-level (dropdown) + Page-level (tabs)
✅ **Clear separation** - Church overview vs personal management
✅ **No confusion** - "DNA Groups" means different things in different contexts
✅ **Scalable** - Easy to add new dashboards (just add to dropdown)
✅ **Familiar pattern** - Common in SaaS apps (Notion, Linear, etc.)
✅ **Mobile-friendly** - Dropdown works great on mobile

---

## Summary

| Navigation Level | What It Does | Location |
|------------------|--------------|----------|
| **User Menu Dropdown** | Switch between dashboards (My Church, My Groups, DNA Training) | Top-right corner (all pages) |
| **Page Tabs** | Navigate within current dashboard (Overview, DNA Journey, DNA Groups) | Below header (context-specific) |

**Dropdown Titles:**
- **My Church** - Church implementation dashboard
- **My Groups** - DNA groups you personally lead
- **DNA Training** - Your training progress

**Key Point:** "DNA Groups" appears in TWO places with TWO different meanings:
1. **Church Dashboard tab** → Church-wide overview (all groups at church)
2. **User menu → "My Groups"** → Personal groups you lead (management view)
