# DNA Training Migration - Verification Checklist

**Run this after executing migration 022**

---

## ✅ Step 1: Verify Tables Created

Run this query in Supabase SQL Editor:

```sql
SELECT table_name,
       (SELECT COUNT(*)
        FROM information_schema.columns
        WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name LIKE 'dna_%' OR table_name = 'user_roles')
ORDER BY table_name;
```

**Expected output:**
```
dna_content_unlocks    | 7 columns
dna_flow_assessments   | 11 columns
dna_groups             | (existing table)
dna_leader_journeys    | 7 columns
dna_leaders            | (existing table)
dna_training_modules   | 10 columns
user_roles             | 4 columns
```

---

## ✅ Step 2: Verify Indexes Created

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND (tablename LIKE 'dna_%' OR tablename = 'user_roles')
AND indexname NOT LIKE '%pkey'
ORDER BY tablename, indexname;
```

**Expected indexes:**
- `idx_dna_content_unlocks_unlocked`
- `idx_dna_content_unlocks_user_id`
- `idx_dna_flow_assessments_completed`
- `idx_dna_flow_assessments_is_draft`
- `idx_dna_flow_assessments_user_id`
- `idx_dna_leader_journeys_stage`
- `idx_dna_leader_journeys_user_id`
- `idx_dna_training_modules_completed`
- `idx_dna_training_modules_type`
- `idx_dna_training_modules_user_id`
- `idx_dna_training_modules_user_type`
- `idx_user_roles_role`
- `idx_user_roles_user_id`

---

## ✅ Step 3: Verify RLS Policies

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND (tablename LIKE 'dna_%' OR tablename = 'user_roles')
ORDER BY tablename, policyname;
```

**Expected policies (at least these):**
- `dna_content_unlocks`: Users can view/insert/update own, Admins can view all
- `dna_flow_assessments`: Users can view/insert/update own, Admins can view all
- `dna_leader_journeys`: Users can view/insert/update own, Admins can view all
- `dna_training_modules`: Users can view/insert/update own, Admins can view all
- `user_roles`: Users can view own, Admins can view all, System can insert

---

## ✅ Step 4: Verify Functions

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%dna%'
ORDER BY routine_name;
```

**Expected functions:**
- `initialize_training_user` (function)
- `promote_to_dna_leader` (function)
- `update_dna_journey_stage` (function)

---

## ✅ Step 5: Verify Triggers

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND (trigger_name LIKE '%dna%' OR trigger_name LIKE '%training%')
ORDER BY trigger_name;
```

**Expected triggers:**
- `init_training_user_on_signup` on `auth.users`
- `promote_on_first_group_create` on `dna_groups`
- `update_stage_on_milestone_change` on `dna_leader_journeys`

---

## ✅ Step 6: Test Auto-Initialization

This tests if the triggers work correctly when a new user signs up.

**Option A: If you have a test user**
```sql
-- Check if journey was auto-created for your user
SELECT
  u.email,
  j.current_stage,
  j.milestones,
  cu.content_type,
  cu.unlocked
FROM auth.users u
LEFT JOIN dna_leader_journeys j ON j.user_id = u.id
LEFT JOIN dna_content_unlocks cu ON cu.user_id = u.id
WHERE u.email = 'your-test-email@example.com';
```

**Expected result:**
- Journey exists with `current_stage = 'onboarding'`
- Milestones JSONB with all false
- Content unlock row with `content_type = 'flow_assessment'` and `unlocked = true`

**Option B: Create a test user manually**
```sql
-- Insert a test user (use Supabase service role)
-- This will trigger the auto-initialization
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  gen_random_uuid(),
  'test-dna-user@example.com',
  crypt('test-password', gen_salt('bf')),
  NOW()
);

-- Wait 1 second for triggers to fire, then check
SELECT
  u.email,
  j.current_stage,
  ur.role,
  cu.content_type
FROM auth.users u
LEFT JOIN dna_leader_journeys j ON j.user_id = u.id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN dna_content_unlocks cu ON cu.user_id = u.id
WHERE u.email = 'test-dna-user@example.com';
```

**Expected result:**
- 1 row for journey (`current_stage = 'onboarding'`)
- 1 row for role (`role = 'dna_trainee'`)
- 1 row for unlock (`content_type = 'flow_assessment'`)

---

## ✅ Step 7: Run Migration 023 (Assign Admin Roles)

```sql
-- Copy/paste database/023_assign-admin-roles.sql
-- This assigns admin role to your email addresses
```

Then verify:
```sql
SELECT u.email, ur.role, ur.created_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin';
```

**Expected:**
- Your admin emails should appear with `role = 'admin'`

---

## 🎉 Success Criteria

All checks above should pass. If any fail, check the Supabase logs for errors.

**Once all checks pass, you're ready for the UI build!**

---

## 🚨 Troubleshooting

### "relation does not exist" error
- Make sure you ran the LATEST version of migration 022 (after the fix)
- The `user_roles` table must be created BEFORE RLS policies

### Triggers not firing
- Check if triggers exist: `SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public'`
- Make sure the trigger function exists: `SELECT * FROM pg_proc WHERE proname LIKE '%dna%'`
- Try manually calling the function to test it

### RLS policies blocking queries
- Make sure you're querying as the correct user (check `auth.uid()`)
- Admins need the `admin` role in `user_roles` table
- Service role queries bypass RLS

---

## 📧 Next Steps

Once verified, reply: **"Database is ready"**

Then I'll start building:
1. `/signup` page
2. `/login` page
3. `/training` dashboard
4. `/training/assessment` (Flow Assessment)
5. API routes

**Target: Flow Assessment live by end of week**
