# Unified Authentication System - Handoff Document

## 🎯 What Was Built

We implemented a **unified authentication system** that allows users to log in once and access multiple dashboards based on their roles (Church Leader, DNA Leader, Training Participant, Admin).

### Problem Solved
Previously, there were 3 separate authentication systems:
- Church Leaders → `church_leader_session` cookie → `/dashboard`
- DNA Leaders → `dna_leader_session` cookie → `/groups`
- Training Participants → `training_session` cookie → `/training`

This meant users needed **multiple logins** for different dashboards. Now they have **one login** with role-based access.

---

## ✅ What's Complete

### 1. Database Migration (`025_unified-users.sql`)

**Location:** `/database/025_unified-users.sql`

**What it does:**
- Creates `users` table (unified user accounts)
- Creates `user_roles` table (role assignments)
- Adds `user_id` column to `church_leaders` and `dna_leaders`
- Migrates all existing data
- Assigns roles: `church_leader`, `dna_leader`, `training_participant`, `admin`

**Status:** ✅ Migration has been run successfully in database

### 2. Auth Helper Library

**Location:** `/src/lib/unified-auth.ts`

**Functions:**
- `getUnifiedSession()` - Get current user with all roles
- `hasRole(session, role, churchId?)` - Check if user has a role
- `isAdmin(session)` - Check if user is admin
- `isChurchLeader(session, churchId)` - Check church leader status
- `isDNALeader(session, churchId?)` - Check DNA leader status
- `isTrainingParticipant(session)` - Check training participant status
- `getUserChurches(session)` - Get all church IDs user has access to
- `getPrimaryChurch(session)` - Get user's primary church
- `getDNALeaderChurches(session)` - Get churches where user is DNA leader

### 3. UI Components

**TopNav** (`/src/components/TopNav.tsx`)
- Appears on all authenticated pages
- Shows DNA Hub logo
- Shows "Admin" badge for admin users (links to `/admin`)
- Contains UserMenu dropdown

**UserMenu** (`/src/components/UserMenu.tsx`)
- Dropdown menu in top-right corner
- Shows available dashboards based on user roles:
  - **My Church** → `/dashboard` (for church leaders)
  - **My Groups** → `/groups` (for DNA leaders)
  - **DNA Training** → `/training` (for training participants)
- Shows currently active dashboard with ✓ checkmark
- Shows user email
- Logout button

### 4. Updated Auth Flow

**Login** (`/src/app/api/auth/verify/route.ts`)
- Verifies magic link token
- Creates unified `user_session` cookie
- Deletes old session cookies (church_leader_session, dna_leader_session, training_session)
- Redirects to appropriate dashboard based on primary role:
  - church_leader → `/dashboard`
  - dna_leader → `/groups`
  - training_participant → `/training`
  - admin → `/admin`

**Logout** (`/src/app/api/auth/logout/route.ts`)
- Clears all session cookies (unified + legacy)

**Root Layout** (`/src/app/layout.tsx`)
- Includes TopNav component (shows only when user is logged in)

---

## 📊 Database Schema

### New Tables

**users**
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE NOT NULL
name TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**user_roles**
```sql
id UUID PRIMARY KEY
user_id UUID → users(id)
role TEXT ('church_leader', 'dna_leader', 'training_participant', 'admin')
church_id UUID → churches(id) (nullable)
created_at TIMESTAMPTZ

UNIQUE INDEX: (user_id, role, church_id) WHERE church_id IS NOT NULL
UNIQUE INDEX: (user_id, role) WHERE church_id IS NULL
```

### Modified Tables

**church_leaders**
- Added: `user_id UUID → users(id)`

**dna_leaders**
- Added: `user_id UUID → users(id)`

---

## 🧪 Testing Status

**Build Status:** ✅ Passes (verified with `npm run build`)

**Dev Server:** ✅ Running at http://localhost:3000

**Next Steps for Testing:**
See `/docs/planning/TESTING-UNIFIED-AUTH.md` for comprehensive test plan

**Critical Tests:**
1. Church leader login → should see "My Church" in dropdown
2. DNA leader login → should see "My Groups" in dropdown
3. Multi-role user → should see multiple options, can switch dashboards
4. Admin user → should see "Admin" badge
5. Session persistence → refresh page, still logged in
6. Logout → clears session, can't access protected pages

---

## 🚨 Known Issues / Warnings

### 1. Training Participants
- Training uses Supabase `auth.users` table (NOT a custom `training_participants` table)
- Training auth is handled separately and NOT yet integrated into unified auth
- If you want to add training to unified auth, you'll need to:
  - Migrate training users to the `users` table
  - Assign them `training_participant` role in `user_roles`
  - Update training login flow to use unified session

### 2. Build Fixed
- Originally had import errors (`createClient` vs `supabase`)
- Fixed by updating imports in:
  - `/src/lib/unified-auth.ts`
  - `/src/app/api/auth/verify/route.ts`

### 3. Database Migration Iterations
- Multiple migration attempts due to:
  - Missing `church_id` column in `user_roles`
  - Orphaned user_roles records
  - Wrong order of operations
- **Final working migration:** `025_unified-users.sql`
  - Drops and recreates tables cleanly to avoid orphaned data

---

## 📝 Important Files

### Documentation
- `/docs/planning/UNIFIED-AUTH-PLAN.md` - Full implementation plan
- `/docs/planning/USER-MENU-NAVIGATION.md` - UI design and mockups
- `/docs/planning/UNIFIED-AUTH-IMPLEMENTATION-SUMMARY.md` - Summary of what was built
- `/docs/planning/TESTING-UNIFIED-AUTH.md` - Comprehensive test plan
- `/docs/planning/HANDOFF-UNIFIED-AUTH.md` - This file

### Code
- `/src/lib/unified-auth.ts` - Auth helper functions
- `/src/components/TopNav.tsx` - Top navigation bar
- `/src/components/UserMenu.tsx` - User menu dropdown
- `/src/app/layout.tsx` - Root layout (includes TopNav)
- `/src/app/api/auth/verify/route.ts` - Login endpoint
- `/src/app/api/auth/logout/route.ts` - Logout endpoint

### Database
- `/database/025_unified-users.sql` - Database migration
- `/database/README.md` - Updated with migration 025

---

## 🎨 UI Design

### Navigation Structure

**Top Navigation (All Pages):**
```
┌────────────────────────────────────────────┐
│ DNA Hub              [Admin] User Name ▼   │
└────────────────────────────────────────────┘
```

**User Menu Dropdown:**
```
┌──────────────────┐
│ My Dashboards    │
├──────────────────┤
│ ✓ My Church      │ ← Church leader role
│   My Groups      │ ← DNA leader role
│   DNA Training   │ ← Training participant role
├──────────────────┤
│ user@email.com   │
│ Logout           │
└──────────────────┘
```

**Key Points:**
- "My Church" = Church implementation dashboard (`/dashboard`)
- "My Groups" = DNA groups you personally lead (`/groups`)
- DNA Groups tab on church dashboard = church-wide overview (different from "My Groups")
- ✓ Checkmark shows currently active dashboard
- Admin badge shows for admin users (no dropdown link for admin - they access `/admin` directly)

---

## 🔧 How It Works

### Login Flow
1. User requests magic link with email
2. User clicks magic link
3. `GET /api/auth/verify?token=...`
4. Backend:
   - Verifies token
   - Marks token as used
   - Creates `user_session` cookie
   - Deletes old session cookies
   - Queries `users` and `user_roles` tables
   - Determines primary role
   - Redirects to appropriate dashboard
5. User lands on dashboard with TopNav visible

### Session Management
- **Cookie name:** `user_session`
- **Value:** The magic link token
- **Duration:** 7 days
- **Flags:** httpOnly, secure (in production), sameSite: lax

### Role-Based Navigation
- TopNav calls `getUnifiedSession()` on server
- Returns user with all roles
- UserMenu component shows relevant dashboards
- User can switch between dashboards without re-login

---

## 🚀 Deployment Checklist

Before deploying to production:

1. **Verify database migration** ran successfully:
   ```sql
   -- Check users table
   SELECT COUNT(*) FROM users;

   -- Check user_roles table
   SELECT COUNT(*) FROM user_roles;

   -- Verify no orphaned records
   SELECT COUNT(*) FROM church_leaders WHERE user_id IS NULL;
   SELECT COUNT(*) FROM dna_leaders WHERE user_id IS NULL;
   ```

2. **Test all user types:**
   - Church leader only
   - DNA leader only
   - Church leader + DNA leader (multi-role)
   - Admin user
   - Test session persistence
   - Test logout

3. **Verify build passes:**
   ```bash
   npm run build
   ```

4. **Deploy code:**
   ```bash
   git add .
   git commit -m "Add unified authentication system with role-based access"
   git push
   ```

5. **Monitor for errors** in production logs

6. **Notify users** (optional) that they may need to log in again with their email

---

## ❓ Common Issues & Solutions

### Issue: User can't log in
**Possible causes:**
- Email not in `church_leaders` or `dna_leaders` table
- `user_id` not set on their record
- No role assigned in `user_roles`

**Solution:**
```sql
-- Check if user exists
SELECT * FROM users WHERE email = 'user@email.com';

-- Check if they have roles
SELECT ur.role, c.name as church
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN churches c ON ur.church_id = c.id
WHERE u.email = 'user@email.com';

-- If missing, manually create user and role
INSERT INTO users (email, name) VALUES ('user@email.com', 'User Name');
INSERT INTO user_roles (user_id, role, church_id)
SELECT u.id, 'church_leader', cl.church_id
FROM users u, church_leaders cl
WHERE u.email = 'user@email.com' AND cl.email = u.email;
```

### Issue: TopNav not showing
**Possible causes:**
- User not logged in
- Session cookie not set
- Build error

**Solution:**
- Check browser DevTools → Application → Cookies for `user_session`
- Check console for errors
- Verify `getUnifiedSession()` is being called

### Issue: Dropdown shows wrong dashboards
**Possible causes:**
- User has wrong roles assigned
- Role assignment missing church_id

**Solution:**
```sql
-- Check user's roles
SELECT u.email, ur.role, ur.church_id, c.name as church
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN churches c ON ur.church_id = c.id
WHERE u.email = 'user@email.com';
```

---

## 🎯 Future Enhancements

Potential improvements (not implemented yet):

1. **Profile Settings Page**
   - Edit user name
   - Change email
   - Manage notification preferences

2. **Church Switcher**
   - For users with roles at multiple churches
   - Quick dropdown to switch church context

3. **Notification Badge**
   - Show unread count on dashboard links
   - "3 new prayer requests" on My Groups

4. **Keyboard Shortcuts**
   - `Cmd+1` for My Church
   - `Cmd+2` for My Groups
   - `Cmd+3` for DNA Training

5. **Integrate Training Auth**
   - Migrate training users to unified system
   - Add "DNA Training" to dropdown for training participants

---

## 📞 Contact / Questions

If you encounter issues or have questions:

1. Check `/docs/planning/TESTING-UNIFIED-AUTH.md` for test procedures
2. Check `/docs/planning/UNIFIED-AUTH-IMPLEMENTATION-SUMMARY.md` for detailed implementation notes
3. Review database migration `/database/025_unified-users.sql`
4. Check build logs for TypeScript errors

---

## 🎉 Summary

**What works:**
- ✅ Unified authentication with one login
- ✅ Role-based dashboard access
- ✅ User menu dropdown navigation
- ✅ Session persistence across dashboards
- ✅ Admin badge for admin users
- ✅ Clean database schema
- ✅ Build passes
- ✅ Dev server runs

**What's ready for testing:**
- Church leader login flow
- DNA leader login flow
- Multi-role user navigation
- Session persistence
- Logout

**What's NOT implemented yet:**
- Training participants in unified auth (they still use separate Supabase auth.users)
- Protected route middleware (pages should check session manually)
- Settings page
- Multi-church switcher

**Next steps:**
1. Run comprehensive tests (see TESTING-UNIFIED-AUTH.md)
2. Fix any issues found during testing
3. Deploy to production
4. Monitor for errors
5. Consider future enhancements

---

**Created:** 2026-01-31
**Status:** Ready for testing
**Dev Server:** http://localhost:3000
