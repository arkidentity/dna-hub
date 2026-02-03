-- Step 2: Test if we can update church_progress.milestone_id
-- Run this AFTER step 1

-- First verify no FK constraints exist
SELECT 'Checking constraints on church_progress:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'church_progress'::regclass
AND contype = 'f';

-- If the above shows NO rows, try a test update
-- This uses a fake UUID to see if the FK constraint is truly gone
DO $$
BEGIN
    -- Try to update a single row with a random UUID
    -- This SHOULD fail if FK constraint exists, succeed if not
    UPDATE church_progress
    SET milestone_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    WHERE id = (SELECT id FROM church_progress LIMIT 1);

    RAISE NOTICE 'SUCCESS - No FK constraint blocking updates!';

    -- Rollback the test change
    RAISE EXCEPTION 'Rolling back test change';
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'FAILED - FK constraint still exists!';
    WHEN OTHERS THEN
        IF SQLERRM = 'Rolling back test change' THEN
            RAISE NOTICE 'Test passed - rolling back';
        ELSE
            RAISE NOTICE 'Other error: %', SQLERRM;
        END IF;
END $$;
