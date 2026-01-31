# Testing Unified Authentication System

## ✅ Pre-Test Checklist

- [x] Database migration completed successfully
- [x] Build passes without errors
- [x] Dev server is running

## Test Plan

### Test 1: Church Leader Login

**Goal:** Verify church leader can log in and see the user menu with "My Church"

**Steps:**
1. Go to http://localhost:3000/login
2. Enter a church leader email (e.g., from your `church_leaders` table)
3. Check email for magic link
4. Click magic link
5. Should redirect to `/dashboard`
6. Look for TopNav in top-right corner
7. Click on your name
8. Should see dropdown with:
   - ✓ My Church (with checkmark - currently active)
   - Email address
   - Logout button

**Expected Result:**
- ✅ Redirected to `/dashboard`
- ✅ TopNav shows your name
- ✅ Dropdown shows "My Church" option
- ✅ Session persists (refresh page, still logged in)

---

### Test 2: DNA Leader Login

**Goal:** Verify DNA leader can log in and see "My Groups"

**Steps:**
1. Log out from previous test
2. Go to http://localhost:3000/login
3. Enter a DNA leader email (from your `dna_leaders` table)
4. Check email for magic link
5. Click magic link
6. Should redirect to `/groups`
7. Click on your name in top-right
8. Should see dropdown with:
   - ✓ My Groups (with checkmark)
   - DNA Training (if they're also in training)
   - Email address
   - Logout button

**Expected Result:**
- ✅ Redirected to `/groups`
- ✅ TopNav shows your name
- ✅ Dropdown shows "My Groups" option
- ✅ Can navigate to DNA Groups dashboard

---

### Test 3: Multi-Role User (Church Leader + DNA Leader)

**Goal:** Verify user with multiple roles sees multiple dashboards

**Setup:**
1. Find or create a user who is both a church leader AND a DNA leader
   - Check in Supabase:
   ```sql
   SELECT u.email, array_agg(ur.role) as roles
   FROM users u
   JOIN user_roles ur ON u.id = ur.user_id
   GROUP BY u.email
   HAVING COUNT(DISTINCT ur.role) > 1;
   ```
   - Or invite yourself as a DNA leader using your church leader email

**Steps:**
1. Log in with the multi-role email
2. Should redirect to `/dashboard` (church leader is primary)
3. Click on your name in top-right
4. Should see dropdown with:
   - ✓ My Church (active)
   - My Groups
   - DNA Training (if applicable)
   - Email address
   - Logout

**Test Navigation:**
5. Click "My Groups" in dropdown
6. Should navigate to `/groups` without re-login
7. Page should load showing DNA groups
8. Click name again
9. Should see:
   - My Church
   - ✓ My Groups (active now)
   - DNA Training
   - Email
   - Logout
10. Click "My Church"
11. Should navigate back to `/dashboard` without re-login

**Expected Result:**
- ✅ Can switch between dashboards using dropdown
- ✅ No re-login required
- ✅ Session persists across dashboards
- ✅ Active dashboard is marked with ✓

---

### Test 4: Admin User

**Goal:** Verify admin can access all dashboards

**Steps:**
1. Log in with admin email (thearkidentity@gmail.com or travis@arkidentity.com)
2. Should see "Admin" badge next to name
3. Click on name in dropdown
4. Should see all dashboard options:
   - My Church (if you have a church)
   - My Groups (if you have groups)
   - DNA Training (if you're in training)
   - Email
   - Logout

**Expected Result:**
- ✅ Admin badge visible
- ✅ Can access all relevant dashboards
- ✅ Admin badge links to `/admin`

---

### Test 5: Session Persistence

**Goal:** Verify session cookie works correctly

**Steps:**
1. Log in as any user
2. Refresh the page
3. Should still be logged in
4. Open DevTools → Application → Cookies
5. Find cookie named `user_session`
6. Close browser tab
7. Open new tab, go to http://localhost:3000/dashboard
8. Should still be logged in (session persists for 7 days)

**Expected Result:**
- ✅ Session persists across page refreshes
- ✅ `user_session` cookie exists
- ✅ Old cookies (`church_leader_session`, `dna_leader_session`) are deleted

---

### Test 6: Logout

**Goal:** Verify logout works correctly

**Steps:**
1. Log in as any user
2. Click name in top-right
3. Click "Logout"
4. Should be logged out
5. Try to access http://localhost:3000/dashboard
6. Should redirect to `/login` or show unauthorized

**Expected Result:**
- ✅ Logout clears session
- ✅ Cannot access protected pages after logout
- ✅ All session cookies are cleared

---

### Test 7: Public Pages Don't Show Nav

**Goal:** Verify TopNav only shows on authenticated pages

**Steps:**
1. Log out
2. Visit these pages (should NOT see TopNav):
   - http://localhost:3000/ (landing page)
   - http://localhost:3000/login
   - http://localhost:3000/assessment
3. Log in
4. TopNav should appear

**Expected Result:**
- ✅ No TopNav on public pages
- ✅ TopNav appears only when logged in

---

## Database Verification Queries

Run these in Supabase SQL Editor to verify data integrity:

### Check Users Table
```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
```

### Check User Roles
```sql
SELECT
  u.email,
  u.name,
  ur.role,
  c.name as church_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN churches c ON ur.church_id = c.id
ORDER BY u.email;
```

### Check Multi-Role Users
```sql
SELECT
  u.email,
  array_agg(DISTINCT ur.role ORDER BY ur.role) as roles,
  COUNT(DISTINCT ur.role) as role_count
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email
ORDER BY role_count DESC, u.email;
```

### Check Admin Users
```sql
SELECT u.email, u.name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';
```

### Verify All Church Leaders Have Users
```sql
SELECT
  'Church leaders without user_id' as issue,
  COUNT(*) as count
FROM church_leaders
WHERE user_id IS NULL;
-- Should return 0
```

### Verify All DNA Leaders Have Users
```sql
SELECT
  'DNA leaders without user_id' as issue,
  COUNT(*) as count
FROM dna_leaders
WHERE user_id IS NULL;
-- Should return 0
```

---

## Known Issues / Edge Cases

### Issue: User Not in Database Yet
**Scenario:** Someone tries to log in but they're not in church_leaders or dna_leaders tables

**Expected Behavior:**
- They should get "Invalid or expired token" error
- OR we need to handle this case better

**Test:** Try logging in with an email that's not in the system

---

## Success Criteria

All tests must pass:
- ✅ Church leaders can log in and access dashboard
- ✅ DNA leaders can log in and access groups
- ✅ Multi-role users see all their dashboards
- ✅ Navigation between dashboards works without re-login
- ✅ Session persists correctly
- ✅ Logout works
- ✅ TopNav only shows when authenticated
- ✅ Admin users have full access

---

## Next Steps After Testing

If all tests pass:
1. Commit the changes
2. Deploy to production
3. Test in production with real users
4. Monitor for any issues

If tests fail:
1. Document the failure
2. Fix the issue
3. Re-test
4. Repeat until all pass
