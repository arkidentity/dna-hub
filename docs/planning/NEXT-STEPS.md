# DNA Hub - Next Steps

## ✅ Recently Completed: Unified Auth API Migration

All API routes have been successfully migrated to use the unified authentication system.

**What was done:**
- Migrated 20+ API routes from old auth (`getSession()`, `getDNALeaderSession()`) to unified auth (`getUnifiedSession()`)
- Updated all admin routes to use unified `isAdmin()` helper
- Fixed session structure references throughout the codebase
- Verified zero old auth imports remain in `/src/app/api`

---

## 🎯 Current Status

### Authentication System: ✅ Complete

1. **Database Migration** ✅
   - `users` and `user_roles` tables created
   - All existing data migrated
   - Role-based access implemented

2. **Auth Library** ✅
   - `/src/lib/unified-auth.ts` fully functional
   - All helper functions working

3. **UI Components** ✅
   - TopNav with DNA Hub logo and admin badge
   - UserMenu dropdown with role-based navigation
   - Active dashboard indicator

4. **Auth Flow** ✅
   - Unified login/logout
   - Magic link verification
   - Session cookie management

5. **API Routes** ✅ **[NEWLY COMPLETED]**
   - All routes migrated to unified auth
   - Consistent auth checking across the app
   - No legacy auth code remaining

---

## 📋 Next Priorities

### 1. Testing & Deployment

**Priority: HIGH**

Before deploying to production, thorough testing is needed:

#### Database Migration Testing
Run in Supabase SQL Editor:

```sql
-- Verify all users have roles
SELECT u.id, u.email, COUNT(ur.id) as role_count
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email
HAVING COUNT(ur.id) = 0;
-- Expected: 0 rows

-- Verify all church leaders have user_id
SELECT id, email FROM church_leaders WHERE user_id IS NULL;
-- Expected: 0 rows

-- Verify all DNA leaders have user_id
SELECT id, email FROM dna_leaders WHERE user_id IS NULL;
-- Expected: 0 rows

-- View multi-role users
SELECT u.email, array_agg(ur.role) as roles
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.email
HAVING COUNT(ur.id) > 1;
-- Expected: Users who are both church leaders and DNA leaders
```

#### User Flow Testing

Test these scenarios:

1. **Church Leader Only**
   - Login → Should redirect to `/dashboard`
   - UserMenu → Should show "My Church" only

2. **DNA Leader Only**
   - Login → Should redirect to `/groups`
   - UserMenu → Should show "My Groups" and "DNA Training"

3. **Church Leader + DNA Leader**
   - Login → Should redirect to `/dashboard`
   - UserMenu → Should show all three dashboards
   - Verify can switch between dashboards without re-login

4. **Admin User**
   - Login → Should see Admin badge
   - UserMenu → Should show all dashboards
   - Verify can access admin routes

5. **API Route Testing**
   - Test admin routes (`/api/admin/churches`, `/api/admin/analytics`, etc.)
   - Test dashboard routes (`/api/dashboard`, `/api/progress`)
   - Test DNA groups routes (`/api/groups`, `/api/dna-leaders/invite`)
   - Verify proper 401/403 responses for unauthorized access

### 2. Frontend Pages Migration

**Priority: MEDIUM**

Currently only API routes and auth system are migrated. Frontend pages still need updates:

#### Pages to Update

All pages should use `getUnifiedSession()` instead of old auth:

- `/src/app/dashboard/page.tsx`
- `/src/app/groups/page.tsx`
- `/src/app/groups/[id]/page.tsx`
- `/src/app/groups/new/page.tsx`
- `/src/app/admin/page.tsx`
- `/src/app/admin/church/[id]/page.tsx`
- `/src/app/portal/page.tsx`
- Any other authenticated pages

**Pattern:**
```typescript
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

### 3. Client Component Updates

**Priority: MEDIUM**

Update client-side components that fetch data or check auth:

- Components that call API routes
- Components with `useSession()` or similar hooks
- Components that check roles/permissions

### 4. Error Handling & User Experience

**Priority: LOW (after deployment)**

- Add better error messages for unauthorized access
- Create `/unauthorized` page with helpful messaging
- Add loading states during auth checks
- Handle edge cases (expired sessions, invalid tokens, etc.)

### 5. Documentation

**Priority: LOW**

- Update API documentation with new auth requirements
- Document role-based access patterns
- Create troubleshooting guide

---

## 🚀 Deployment Checklist

When ready to deploy:

- [ ] Run database migration in production Supabase
- [ ] Verify migration with test queries
- [ ] Deploy code to production
- [ ] Test all user flows in production
- [ ] Monitor for errors in first 24 hours
- [ ] Send email to users about re-login requirement (if needed)

---

## 📊 Migration Progress

| Component | Status |
|-----------|--------|
| Database Tables | ✅ Complete |
| Auth Library | ✅ Complete |
| UI Components | ✅ Complete |
| Auth Flow | ✅ Complete |
| **API Routes** | ✅ **Complete** |
| Frontend Pages | ⏳ Pending |
| Client Components | ⏳ Pending |
| Testing | ⏳ Pending |
| Deployment | ⏳ Pending |

---

## 🔗 Related Documentation

- [Unified Auth Plan](./UNIFIED-AUTH-PLAN.md) - Original implementation plan
- [Implementation Summary](./UNIFIED-AUTH-IMPLEMENTATION-SUMMARY.md) - Complete overview
- [Testing Guide](./TESTING-UNIFIED-AUTH.md) - Testing procedures
- [User Menu Navigation](./USER-MENU-NAVIGATION.md) - UI design details

---

## 💡 Notes for Next Session

**What works now:**
- Complete unified auth backend (database, auth lib, API routes)
- Complete UI navigation (TopNav, UserMenu)
- Login/logout flow with unified session cookie

**What needs work:**
- Frontend pages still using old `getSession()` in some places
- Need comprehensive testing before production deployment
- Some client components may need updates

**Recommended next task:**
Start with testing the current implementation to verify everything works correctly, then migrate frontend pages to use unified auth.
