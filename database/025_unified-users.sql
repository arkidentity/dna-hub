-- Migration 025: Unified User Authentication System
-- Purpose: Create a single unified user table with role-based access
-- This allows users to have multiple roles (church_leader, dna_leader, training_participant)
-- and access multiple dashboards with one login

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

CREATE INDEX idx_users_email ON users(email);

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

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_church_id ON user_roles(church_id);

-- ============================================================================
-- STEP 3: Add user_id to existing tables
-- ============================================================================

-- Add user_id to church_leaders (nullable for now, we'll make it required after migration)
ALTER TABLE church_leaders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_church_leaders_user_id ON church_leaders(user_id);

-- Add user_id to dna_leaders (nullable for now)
ALTER TABLE dna_leaders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_dna_leaders_user_id ON dna_leaders(user_id);

-- Add user_id to training_participants (nullable for now)
ALTER TABLE training_participants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_training_participants_user_id ON training_participants(user_id);

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
-- STEP 6: Make user_id required (after migration is complete)
-- ============================================================================

-- Uncomment these after verifying migration was successful:
-- ALTER TABLE church_leaders ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE dna_leaders ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE training_participants ALTER COLUMN user_id SET NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES (run these to check migration)
-- ============================================================================

-- Check for church leaders without users (should be 0)
-- SELECT cl.id, cl.email FROM church_leaders cl WHERE cl.user_id IS NULL;

-- Check for DNA leaders without users (should be 0)
-- SELECT dl.id, dl.email FROM dna_leaders dl WHERE dl.user_id IS NULL;

-- Check for training participants without users (should be 0)
-- SELECT tp.id, tp.email FROM training_participants tp WHERE tp.user_id IS NULL;

-- Check for users without roles (should be 0 or only test accounts)
-- SELECT u.id, u.email, COUNT(ur.id) as role_count
-- FROM users u
-- LEFT JOIN user_roles ur ON u.id = ur.user_id
-- GROUP BY u.id, u.email
-- HAVING COUNT(ur.id) = 0;

-- Count users with multiple roles (expected for users who are both church leaders and DNA leaders)
-- SELECT u.email, array_agg(ur.role) as roles, COUNT(ur.id) as role_count
-- FROM users u
-- JOIN user_roles ur ON u.id = ur.user_id
-- GROUP BY u.email
-- HAVING COUNT(ur.id) > 1;

-- Check admin users
-- SELECT u.email, ur.role FROM users u
-- JOIN user_roles ur ON u.id = ur.user_id
-- WHERE ur.role = 'admin';
