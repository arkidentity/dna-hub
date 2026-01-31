-- Migration 025: Unified User Authentication System
-- Final working version with proper order of operations

-- ============================================================================
-- STEP 1: Create unified users table FIRST
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
    CREATE INDEX idx_users_email ON users(email);
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Populate users table from existing data BEFORE creating user_roles
-- ============================================================================

-- Create users from church_leaders
INSERT INTO users (email, name)
SELECT DISTINCT email, name FROM church_leaders
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Create users from dna_leaders
INSERT INTO users (email, name)
SELECT DISTINCT email, name FROM dna_leaders
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- STEP 3: Clean up existing user_roles (now that users table exists)
-- ============================================================================

-- Delete orphaned user_roles records
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    DELETE FROM user_roles
    WHERE user_id NOT IN (SELECT id FROM users)
    OR user_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Create or fix user_roles table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('church_leader', 'dna_leader', 'training_participant', 'admin')),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add church_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_roles' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE user_roles ADD COLUMN church_id UUID REFERENCES churches(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_user_id') THEN
    CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_role') THEN
    CREATE INDEX idx_user_roles_role ON user_roles(role);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_church_id') THEN
    CREATE INDEX idx_user_roles_church_id ON user_roles(church_id);
  END IF;
END $$;

-- Drop and recreate unique indexes
DROP INDEX IF EXISTS idx_user_roles_unique;
DROP INDEX IF EXISTS idx_user_roles_unique_no_church;
CREATE UNIQUE INDEX idx_user_roles_unique ON user_roles(user_id, role, church_id) WHERE church_id IS NOT NULL;
CREATE UNIQUE INDEX idx_user_roles_unique_no_church ON user_roles(user_id, role) WHERE church_id IS NULL;

-- ============================================================================
-- STEP 5: Add user_id to existing tables
-- ============================================================================

-- Add user_id to church_leaders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'church_leaders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE church_leaders ADD COLUMN user_id UUID REFERENCES users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_church_leaders_user_id') THEN
    CREATE INDEX idx_church_leaders_user_id ON church_leaders(user_id);
  END IF;
END $$;

-- Add user_id to dna_leaders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dna_leaders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE dna_leaders ADD COLUMN user_id UUID REFERENCES users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_dna_leaders_user_id') THEN
    CREATE INDEX idx_dna_leaders_user_id ON dna_leaders(user_id);
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Link existing tables to users
-- ============================================================================

-- Link church_leaders to users
UPDATE church_leaders cl
SET user_id = u.id
FROM users u
WHERE cl.email = u.email
  AND cl.user_id IS NULL;

-- Link dna_leaders to users
UPDATE dna_leaders dl
SET user_id = u.id
FROM users u
WHERE dl.email = u.email
  AND dl.user_id IS NULL;

-- ============================================================================
-- STEP 7: Create role records
-- ============================================================================

-- Create church_leader roles
INSERT INTO user_roles (user_id, role, church_id)
SELECT cl.user_id, 'church_leader', cl.church_id
FROM church_leaders cl
WHERE cl.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create dna_leader roles
INSERT INTO user_roles (user_id, role, church_id)
SELECT dl.user_id, 'dna_leader', dl.church_id
FROM dna_leaders dl
WHERE dl.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create admin roles
INSERT INTO user_roles (user_id, role, church_id)
SELECT u.id, 'admin', NULL
FROM users u
WHERE u.email IN ('thearkidentity@gmail.com', 'travis@arkidentity.com')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT '=== MIGRATION COMPLETE ===' as status;
SELECT '' as blank;

SELECT 'Total Users' as metric, COUNT(*) as count FROM users;
SELECT 'Total Roles' as metric, COUNT(*) as count FROM user_roles;
SELECT '' as blank;

SELECT 'Roles by Type' as section;
SELECT
  role,
  COUNT(DISTINCT user_id) as users,
  COUNT(CASE WHEN church_id IS NOT NULL THEN 1 END) as with_church,
  COUNT(CASE WHEN church_id IS NULL THEN 1 END) as no_church
FROM user_roles
GROUP BY role
ORDER BY role;
SELECT '' as blank;

SELECT 'Issues Check' as section;
SELECT 'Church leaders missing user_id' as issue, COUNT(*) as count
FROM church_leaders WHERE user_id IS NULL;

SELECT 'DNA leaders missing user_id' as issue, COUNT(*) as count
FROM dna_leaders WHERE user_id IS NULL;

SELECT 'Church leader roles missing church_id' as issue, COUNT(*) as count
FROM user_roles WHERE role = 'church_leader' AND church_id IS NULL;
SELECT '' as blank;

SELECT 'Admin Users' as section;
SELECT u.email, u.name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY u.email;
SELECT '' as blank;

SELECT 'Users with Multiple Roles' as section;
SELECT
  u.email,
  u.name,
  array_agg(DISTINCT ur.role ORDER BY ur.role) as roles
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.name
HAVING COUNT(DISTINCT ur.role) > 1
ORDER BY u.email;
