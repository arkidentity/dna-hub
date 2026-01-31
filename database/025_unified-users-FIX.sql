-- Migration 025: Fix and Complete Unified User Authentication System
-- This fixes the user_roles table and completes the migration

-- ============================================================================
-- STEP 1: Add church_id column to user_roles if it doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_roles' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE user_roles ADD COLUMN church_id UUID REFERENCES churches(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create unique indexes (now that church_id exists)
-- ============================================================================

-- Drop existing indexes if they exist (to recreate them properly)
DROP INDEX IF EXISTS idx_user_roles_unique;
DROP INDEX IF EXISTS idx_user_roles_unique_no_church;

-- Create unique index for church-specific roles
CREATE UNIQUE INDEX idx_user_roles_unique ON user_roles(user_id, role, church_id) WHERE church_id IS NOT NULL;

-- Create unique index for non-church roles
CREATE UNIQUE INDEX idx_user_roles_unique_no_church ON user_roles(user_id, role) WHERE church_id IS NULL;

-- Create church_id index if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_roles_church_id') THEN
    CREATE INDEX idx_user_roles_church_id ON user_roles(church_id);
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Update existing role records with church_id
-- ============================================================================

-- Update church_leader roles to include church_id
UPDATE user_roles ur
SET church_id = cl.church_id
FROM church_leaders cl
WHERE ur.user_id = cl.user_id
  AND ur.role = 'church_leader'
  AND ur.church_id IS NULL;

-- Update dna_leader roles to include church_id (if the DNA leader has one)
UPDATE user_roles ur
SET church_id = dl.church_id
FROM dna_leaders dl
WHERE ur.user_id = dl.user_id
  AND ur.role = 'dna_leader'
  AND ur.church_id IS NULL
  AND dl.church_id IS NOT NULL;

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

-- Show migration results
SELECT 'Migration fix complete!' as status;

SELECT
  'Total users' as metric,
  COUNT(*) as count
FROM users;

SELECT
  'Total roles assigned' as metric,
  COUNT(*) as count
FROM user_roles;

SELECT
  role,
  COUNT(DISTINCT user_id) as user_count,
  COUNT(CASE WHEN church_id IS NOT NULL THEN 1 END) as with_church,
  COUNT(CASE WHEN church_id IS NULL THEN 1 END) as without_church
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
  'Church leader roles without church_id' as issue,
  COUNT(*) as count
FROM user_roles
WHERE role = 'church_leader' AND church_id IS NULL;

-- Show users with multiple roles
SELECT
  u.email,
  u.name,
  array_agg(
    CASE
      WHEN ur.church_id IS NOT NULL THEN ur.role || ' (church: ' || c.name || ')'
      ELSE ur.role
    END
    ORDER BY ur.role
  ) as roles,
  COUNT(ur.id) as role_count
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN churches c ON ur.church_id = c.id
GROUP BY u.id, u.email, u.name
HAVING COUNT(ur.id) > 1
ORDER BY u.email;
