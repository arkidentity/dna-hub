# DNA Training Platform - Quick Start

**Goal:** Get Flow Assessment running by end of week

---

## Step 1: Database Setup (Do This Now)

### 1.1 Run Migration 022
```sql
-- In Supabase SQL Editor:
-- Copy/paste entire file: database/022_dna-training-system.sql
-- Click "Run"
```

**Expected result:** 5 new tables created
- `dna_leader_journeys`
- `dna_training_modules`
- `dna_flow_assessments`
- `dna_content_unlocks`
- `user_roles`

### 1.2 Assign Admin Roles (Optional)
```sql
-- In Supabase SQL Editor:
-- Copy/paste entire file: database/023_assign-admin-roles.sql
-- Click "Run"
```

This assigns `admin` role to your email addresses.

---

## Step 2: Verify Tables

Run this query to confirm everything is set up:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'dna_%'
ORDER BY table_name;
```

**Expected output:**
```
dna_content_unlocks
dna_flow_assessments
dna_groups
dna_leader_journeys
dna_leaders
dna_training_modules
user_roles
```

---

## Step 3: Test Auto-Initialization

The system should auto-create records when a new user signs up.

You can test manually:

```sql
-- Simulate a new user signup
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get your user ID (replace with your email)
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'your-email@example.com';

  -- Check if journey was created
  IF EXISTS (SELECT 1 FROM dna_leader_journeys WHERE user_id = test_user_id) THEN
    RAISE NOTICE 'Journey exists for user';
  ELSE
    RAISE NOTICE 'No journey found - trigger may not be working';
  END IF;

  -- Check if Flow Assessment is unlocked
  IF EXISTS (
    SELECT 1 FROM dna_content_unlocks
    WHERE user_id = test_user_id
    AND content_type = 'flow_assessment'
    AND unlocked = TRUE
  ) THEN
    RAISE NOTICE 'Flow Assessment is unlocked';
  ELSE
    RAISE NOTICE 'Flow Assessment not unlocked';
  END IF;
END $$;
```

---

## Step 4: Push Code to GitHub

```bash
git push
```

---

## Step 5: What's Next

Once database is set up, I'm building:

### Week 1 (This Week)
- [ ] `/signup` - Public signup page
- [ ] `/login` - Magic link login
- [ ] `/training` - Training dashboard
- [ ] `/training/assessment` - Flow Assessment (7 questions)
- [ ] API routes for auth and assessment

### Testing Flow
1. User visits `dnadiscipleship.com`
2. Clicks "Start Training" → `/signup`
3. Enters email → Gets magic link
4. Clicks link → Lands on `/training` dashboard
5. Sees Flow Assessment card (unlocked)
6. Clicks "Start Assessment" → `/training/assessment`
7. Completes 7 questions
8. Sees results + action plan
9. DNA Manual unlocks automatically

---

## Troubleshooting

### Error: "column church_leaders.user_id does not exist"
- **Fix:** Use the updated `022_dna-training-system.sql` from the latest commit
- The admin policies now use `user_roles` table instead

### Error: "trigger already exists"
- **Fix:** Drop the trigger first:
  ```sql
  DROP TRIGGER IF EXISTS init_training_user_on_signup ON auth.users;
  ```
- Then re-run the migration

### Tables not created
- Check for errors in Supabase SQL Editor
- Make sure you're running the query as the service role (not as a user)

---

## Ready to Build?

Once you confirm the database is set up, I'll start building the UI components and API routes.

Let me know if you hit any errors!
