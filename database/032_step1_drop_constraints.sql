-- Step 1: Drop ALL foreign key constraints
-- Run this FIRST, separately

-- Check current constraints BEFORE
SELECT 'BEFORE - Constraints on church_progress:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'church_progress'::regclass
AND contype = 'f';

-- Drop using dynamic SQL
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'church_progress'::regclass
        AND contype = 'f'
    ) LOOP
        EXECUTE 'ALTER TABLE church_progress DROP CONSTRAINT ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped: %', r.conname;
    END LOOP;
END $$;

-- Also try explicit drop
ALTER TABLE church_progress DROP CONSTRAINT IF EXISTS church_progress_milestone_id_fkey;

-- Check current constraints AFTER
SELECT 'AFTER - Constraints on church_progress:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'church_progress'::regclass
AND contype = 'f';

-- Should show empty result after this
