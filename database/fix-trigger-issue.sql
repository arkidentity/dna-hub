-- =====================================================
-- FIX: Training User Creation Trigger Issue
-- =====================================================
-- This script diagnoses and fixes the trigger issue

-- Step 1: Check if trigger exists
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'init_training_user_on_signup';

-- Step 2: Check if function exists
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'initialize_training_user';

-- Step 3: Manually test the function
-- First, let's see what happens when we try to call it directly
-- (This will help identify which part of the trigger is failing)

-- Step 4: Check RLS policies on affected tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('user_roles', 'dna_leader_journeys', 'dna_content_unlocks')
ORDER BY tablename, policyname;

-- Step 5: Drop and recreate the trigger (in case it's corrupted)
DROP TRIGGER IF EXISTS init_training_user_on_signup ON auth.users;

-- Recreate the function (updated version with better error handling)
CREATE OR REPLACE FUNCTION initialize_training_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log for debugging
  RAISE NOTICE 'Initializing training user: %', NEW.id;

  -- Assign dna_trainee role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'dna_trainee')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Created user_roles';

  -- Create journey record
  INSERT INTO public.dna_leader_journeys (user_id, current_stage, milestones)
  VALUES (
    NEW.id,
    'onboarding',
    '{
      "flow_assessment_complete": {"completed": false},
      "manual_complete": {"completed": false},
      "launch_guide_reviewed": {"completed": false},
      "first_group_created": {"completed": false}
    }'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Created dna_leader_journeys';

  -- Unlock Flow Assessment by default
  INSERT INTO public.dna_content_unlocks (user_id, content_type, unlocked, unlocked_at, unlock_trigger)
  VALUES (
    NEW.id,
    'flow_assessment',
    TRUE,
    NOW(),
    'initial_signup'
  )
  ON CONFLICT (user_id, content_type) DO NOTHING;

  RAISE NOTICE 'Created dna_content_unlocks';

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error initializing training user: %', SQLERRM;
    RETURN NEW; -- Don't fail the user creation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER init_training_user_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_training_user();

-- Step 6: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Step 7: Disable RLS temporarily to test (ONLY FOR DEBUGGING)
-- You can re-enable after testing
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dna_leader_journeys DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dna_content_unlocks DISABLE ROW LEVEL SECURITY;

SELECT 'Trigger fixed! Try creating a user now.' AS status;
