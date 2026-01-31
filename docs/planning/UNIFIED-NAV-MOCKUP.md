# Unified Navigation - Visual Mockup

## Navigation Bar Design

The navigation adapts based on user roles, showing only relevant tabs.

---

## Example 1: Church Leader Only

**User:** pastor@mychurch.com
**Roles:** Church Leader at "First Baptist Church"

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DNA Hub                Church Dashboard                                │
│                         ───────────────                                 │
│                                                    pastor@mychurch.com  │
│                                                    Logout              │
└─────────────────────────────────────────────────────────────────────────┘
```

**Tabs Shown:**
- ✅ Church Dashboard (active)

---

## Example 2: DNA Leader Only

**User:** john@email.com
**Roles:** DNA Leader at "First Baptist Church"

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DNA Hub     DNA Groups         DNA Training                            │
│              ──────────                                                  │
│                                                       john@email.com    │
│                                                       Logout            │
└─────────────────────────────────────────────────────────────────────────┘
```

**Tabs Shown:**
- ✅ DNA Groups (active)
- ✅ DNA Training

---

## Example 3: Church Leader + DNA Leader

**User:** pastor@mychurch.com
**Roles:**
- Church Leader at "First Baptist Church"
- DNA Leader at "First Baptist Church"

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DNA Hub     Church Dashboard    DNA Groups      DNA Training           │
│              ───────────────                                             │
│                                                    pastor@mychurch.com  │
│                                                    Logout               │
└─────────────────────────────────────────────────────────────────────────┘
```

**Tabs Shown:**
- ✅ Church Dashboard (active)
- ✅ DNA Groups
- ✅ DNA Training

**User Journey:**
1. Logs in once at `/login`
2. Lands on `/dashboard` (Church Dashboard)
3. Clicks "DNA Groups" → Goes to `/groups` (sees their groups)
4. Clicks "DNA Training" → Goes to `/training` (their training progress)
5. Session persists across all tabs ✨

---

## Example 4: DNA Leader in Training (Not Yet Church Leader)

**User:** sarah@email.com
**Roles:**
- Training Participant
- DNA Leader (recently invited by a church)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DNA Hub     DNA Groups         DNA Training                            │
│                                 ────────────                             │
│                                                       sarah@email.com   │
│                                                       Logout            │
└─────────────────────────────────────────────────────────────────────────┘
```

**Tabs Shown:**
- ✅ DNA Groups
- ✅ DNA Training (active)

**User Journey:**
1. Started training at `/training/signup`
2. Got invited as DNA Leader by a church
3. Now has access to both dashboards
4. Can manage groups AND continue training

---

## Example 5: Admin User

**User:** travis@arkidentity.com
**Roles:** Admin

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DNA Hub   Church Dashboard  DNA Groups  DNA Training  Admin            │
│                                                         ─────            │
│                                                travis@arkidentity.com   │
│                                                Logout                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Tabs Shown:**
- ✅ Church Dashboard (can view any church)
- ✅ DNA Groups (can view any group)
- ✅ DNA Training (can view any participant)
- ✅ Admin (active - full system access)

**User Journey:**
1. Sees all dashboards
2. Can switch between church view, groups view, training view
3. Admin tab gives full system control

---

## Example 6: Multi-Church DNA Leader

**User:** john@email.com
**Roles:**
- DNA Leader at "First Baptist Church"
- DNA Leader at "Grace Community Church"

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DNA Hub     DNA Groups         DNA Training                            │
│              ──────────                                                  │
│                                                       john@email.com    │
│                                                       Logout            │
└─────────────────────────────────────────────────────────────────────────┘
```

**DNA Groups Dashboard Shows:**

```
My DNA Groups
─────────────

📍 First Baptist Church
  → Men's Discipleship Group (5 disciples)
  → Young Adults Group (3 disciples)

📍 Grace Community Church
  → Leadership Training Group (4 disciples)
```

**User Journey:**
1. Leads groups at two different churches
2. Sees all groups from both churches in one view
3. Can filter by church if needed

---

## Mobile Navigation (Responsive)

On mobile devices, tabs collapse into a hamburger menu:

```
┌─────────────────────────────┐
│  ☰  DNA Hub    john@email.com│
└─────────────────────────────┘
```

When hamburger clicked:

```
┌─────────────────────────────┐
│  DNA Hub                    │
├─────────────────────────────┤
│  Church Dashboard           │
│  DNA Groups              ✓  │
│  DNA Training               │
│  ─────────────────────      │
│  john@email.com             │
│  Logout                     │
└─────────────────────────────┘
```

---

## Navigation Logic

```typescript
function determineVisibleTabs(userRoles: UserRole[]) {
  const tabs = []

  // Church Dashboard
  if (hasRole(userRoles, 'church_leader') || hasRole(userRoles, 'admin')) {
    tabs.push('Church Dashboard')
  }

  // DNA Groups
  if (hasRole(userRoles, 'dna_leader') || hasRole(userRoles, 'admin')) {
    tabs.push('DNA Groups')
  }

  // DNA Training
  if (hasRole(userRoles, 'training_participant') || hasRole(userRoles, 'admin')) {
    tabs.push('DNA Training')
  }

  // Admin
  if (hasRole(userRoles, 'admin')) {
    tabs.push('Admin')
  }

  return tabs
}
```

---

## Default Landing Page After Login

```typescript
function getDefaultLandingPage(userRoles: UserRole[]): string {
  // Priority order:
  if (hasRole(userRoles, 'church_leader')) return '/dashboard'
  if (hasRole(userRoles, 'dna_leader')) return '/groups'
  if (hasRole(userRoles, 'training_participant')) return '/training'
  if (hasRole(userRoles, 'admin')) return '/admin'

  return '/' // Fallback
}
```

---

## Visual Design Details

### Active Tab Style
- Gold underline (3px): `border-bottom: 3px solid var(--gold)`
- Navy text: `color: var(--navy)`
- Font weight: `font-semibold`

### Inactive Tab Style
- Transparent border
- Gray text: `color: #6B7280`
- Hover: Gray underline + darker text

### Spacing
- Tab padding: `px-6 py-4`
- Tab gap: `gap-8`
- Max width: `max-w-7xl`

### User Menu
- Right-aligned
- Shows email + logout button
- Dropdown could show:
  - Name
  - Email
  - Roles (Church Leader, DNA Leader, etc.)
  - Settings (future)
  - Logout

---

## Benefits of This Approach

✅ **One Login** - Users never juggle multiple accounts
✅ **Role-Based** - Only see tabs relevant to you
✅ **Seamless Switching** - Click tab → instant navigation
✅ **Scalable** - Easy to add new roles/dashboards
✅ **Clear Context** - Always know where you are (active tab)
✅ **Mobile-Friendly** - Collapses to hamburger menu
✅ **Admin Flexibility** - Admins see everything

---

## Comparison: Before vs After

### BEFORE (Current State)

**User:** Sarah (Church Leader + DNA Leader + Training)

```
Login 1: church-leader@email.com → /dashboard
Login 2: dna-leader@email.com    → /groups
Login 3: training@email.com      → /training

Result: Sarah has 3 different accounts! 😵
```

### AFTER (Unified Auth)

**User:** Sarah (Church Leader + DNA Leader + Training)

```
Login: sarah@email.com → Sees all three tabs

┌───────────────────────────────────────────────────────┐
│  Church Dashboard    DNA Groups    DNA Training       │
└───────────────────────────────────────────────────────┘

Result: Sarah has ONE account, seamless access! ✨
```

---

## Edge Cases Handled

1. **User with no roles** → Show error + contact admin
2. **User loses a role** → Tab disappears on next page load
3. **User gains a role** → New tab appears immediately
4. **Admin viewing as user** → Could add "View as" feature later
5. **User at multiple churches** → Show all relevant data

---

## Future Enhancements

- **Profile dropdown** - Click email → see roles, settings
- **Church switcher** - If user has multiple churches
- **Notifications badge** - "3 new prayer requests" on DNA Groups tab
- **Quick actions** - Dropdown under tabs for common tasks
- **Keyboard shortcuts** - `Cmd+1` for Dashboard, `Cmd+2` for Groups, etc.
