-- Migration 025: Verification and Completion Script
-- Run this if the initial migration partially completed

-- ============================================================================
-- STEP 1: Verify tables exist
-- ============================================================================

-- Check if users table exists
SELECT 'users table exists' as status, COUNT(*) as row_count FROM users;

-- Check if user_roles table exists
SELECT 'user_roles table exists' as status, COUNT(*) as row_count FROM user_roles;

-- ============================================================================
-- STEP 2: Complete data migration (safe to re-run)
-- ============================================================================

-- Migrate church leaders (if not already done)
INSERT INTO users (email, name)
SELECT DISTINCT email, name FROM church_leaders
WHERE email IS NOT NULL
  AND email NOT IN (SELECT email FROM users)
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
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = cl.user_id
      AND ur.role = 'church_leader'
      AND ur.church_id = cl.church_id
  );

-- Migrate DNA leaders (if not already done)
INSERT INTO users (email, name)
SELECT DISTINCT email, name FROM dna_leaders
WHERE email IS NOT NULL
  AND email NOT IN (SELECT email FROM users)
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
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = dl.user_id
      AND ur.role = 'dna_leader'
      AND ur.church_id = dl.church_id
  );

-- Migrate training participants (if not already done)
INSERT INTO users (email, name)
SELECT DISTINCT email, name FROM training_participants
WHERE email IS NOT NULL
  AND email NOT IN (SELECT email FROM users)
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
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = tp.user_id
      AND ur.role = 'training_participant'
      AND ur.church_id IS NULL
  );

-- Mark admin users (safe to re-run)
INSERT INTO user_roles (user_id, role, church_id)
SELECT u.id, 'admin', NULL
FROM users u
WHERE u.email IN ('thearkidentity@gmail.com', 'travis@arkidentity.com')
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = u.id
      AND ur.role = 'admin'
  );

-- ============================================================================
-- STEP 3: Verification Queries
-- ============================================================================

-- Check for church leaders without users (should be 0)
SELECT 'Church leaders without user_id' as check_name, COUNT(*) as count
FROM church_leaders cl
WHERE cl.user_id IS NULL;

-- Check for DNA leaders without users (should be 0)
SELECT 'DNA leaders without user_id' as check_name, COUNT(*) as count
FROM dna_leaders dl
WHERE dl.user_id IS NULL;

-- Check for training participants without users (should be 0)
SELECT 'Training participants without user_id' as check_name, COUNT(*) as count
FROM training_participants tp
WHERE tp.user_id IS NULL;

-- Check for users without roles (should be 0 or very few)
SELECT 'Users without roles' as check_name, COUNT(*) as count
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.id IS NULL;

-- Count users with multiple roles (expected)
SELECT 'Users with multiple roles' as check_name, COUNT(*) as count
FROM (
  SELECT u.id
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id
  GROUP BY u.id
  HAVING COUNT(ur.id) > 1
) multi_role_users;

-- Check admin users (should show 2)
SELECT 'Admin users' as check_name, COUNT(*) as count
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';

-- Show summary
SELECT
  'SUMMARY' as status,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM user_roles) as total_roles,
  (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'church_leader') as church_leaders,
  (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'dna_leader') as dna_leaders,
  (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'training_participant') as training_participants,
  (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE role = 'admin') as admins;
