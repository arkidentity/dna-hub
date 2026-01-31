-- Migration 025: Unified User Authentication System (Clean Install)
-- Purpose: Create a single unified user table with role-based access

-- ============================================================================
-- STEP 1: Create unified users table
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only create index if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
    CREATE INDEX idx_users_email ON users(email);
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create role assignments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('church_leader', 'dna_leader', 'training_participant', 'admin')),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role, church_id)
);

-- Only create indexes if they don't exist
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

-- ============================================================================
-- STEP 3: Add user_id to existing tables
-- ============================================================================

-- Add user_id to church_leaders (nullable for now)
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

-- Add user_id to dna_leaders (nullable for now)
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

-- Add user_id to training_participants (nullable for now)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_participants' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE training_participants ADD COLUMN user_id UUID REFERENCES users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_training_participants_user_id') THEN
    CREATE INDEX idx_training_participants_user_id ON training_participants(user_id);
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Migrate existing data
-- ============================================================================

-- Migrate church leaders
INSERT INTO users (email, name)
SELECT DISTINCT email, name FROM church_leaders
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

UPDATE church_leaders cl
SET user_id = u.id
FROM users u
WHERE cl.email = u.email
AND cl.user_id IS NULL;

INSERT INTO user_roles (user_id, role, church_id)
SELECT cl.user_id, 'church_leader', cl.church_id
FROM church_leaders cl
WHERE cl.user_id IS NOT NULL
ON CONFLICT (user_id, role, church_id) DO NOTHING;

-- Migrate DNA leaders
INSERT INTO users (email, name)
SELECT DISTINCT email, name FROM dna_leaders
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

UPDATE dna_leaders dl
SET user_id = u.id
FROM users u
WHERE dl.email = u.email
AND dl.user_id IS NULL;

INSERT INTO user_roles (user_id, role, church_id)
SELECT dl.user_id, 'dna_leader', dl.church_id
FROM dna_leaders dl
WHERE dl.user_id IS NOT NULL
ON CONFLICT (user_id, role, church_id) DO NOTHING;

-- Migrate training participants
INSERT INTO users (email, name)
SELECT DISTINCT email, name FROM training_participants
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

UPDATE training_participants tp
SET user_id = u.id
FROM users u
WHERE tp.email = u.email
AND tp.user_id IS NULL;

INSERT INTO user_roles (user_id, role, church_id)
SELECT tp.user_id, 'training_participant', NULL
FROM training_participants tp
WHERE tp.user_id IS NOT NULL
ON CONFLICT (user_id, role, church_id) DO NOTHING;

-- ============================================================================
-- STEP 5: Mark admin users
-- ============================================================================

INSERT INTO user_roles (user_id, role, church_id)
SELECT u.id, 'admin', NULL
FROM users u
WHERE u.email IN ('thearkidentity@gmail.com', 'travis@arkidentity.com')
ON CONFLICT (user_id, role, church_id) DO NOTHING;

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================

-- Show migration results
SELECT 'Migration complete!' as status;

SELECT
  'Total users created' as metric,
  COUNT(*) as count
FROM users;

SELECT
  'Total roles assigned' as metric,
  COUNT(*) as count
FROM user_roles;

SELECT
  role,
  COUNT(DISTINCT user_id) as user_count
FROM user_roles
GROUP BY role
ORDER BY role;

-- Check for any issues
SELECT
  'Church leaders without user_id' as issue,
  COUNT(*) as count
FROM church_leaders
WHERE user_id IS NULL;

SELECT
  'DNA leaders without user_id' as issue,
  COUNT(*) as count
FROM dna_leaders
WHERE user_id IS NULL;

SELECT
  'Training participants without user_id' as issue,
  COUNT(*) as count
FROM training_participants
WHERE user_id IS NULL;
