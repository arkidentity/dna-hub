# 🚨 RUN THESE DATABASE MIGRATIONS NOW

## Why You're Seeing This

The signup is failing because your Supabase database doesn't have the required trigger to auto-initialize new training users.

## What To Do

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/ydlzqpxjxzmmhksiovsr/sql
2. Click "New query" button

### Step 2: Run Migration 022 (DNA Training System)

1. Open the file: `database/022_dna-training-system.sql`
2. Copy ALL the contents (478 lines)
3. Paste into the Supabase SQL Editor
4. Click "Run" button
5. Wait for success message

### Step 3: Run Migration 024 (Magic Links)

1. Open the file: `database/024_training-magic-links.sql`
2. Copy ALL the contents
3. Paste into a NEW query in Supabase SQL Editor
4. Click "Run" button
5. Wait for success message

### Step 4: Verify It Worked

Run this in your terminal:

```bash
node create-training-user.js
```

You should see:
```
✓ User created successfully!
```

### Step 5: Test Login Again

```bash
node test-training-detailed.js
```

You should now either:
- Get a magic link URL to click, OR
- Receive an email with the login link

---

## Quick Check: Did You Already Run the Migrations?

If you're not sure if you already ran these migrations, you can check:

1. Go to Supabase SQL Editor
2. Run this query:

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'init_training_user_on_signup';
```

**Expected result:**
- Should show 1 row with trigger on `users` table
- If empty → You need to run the migration

---

## After Running Migrations

Once the migrations are complete:
1. Try creating a user again: `node create-training-user.js`
2. Or try signup directly at: http://localhost:3000/training/login
3. You should receive an email OR see a magic link in the console

Let me know once you've run the migrations!
