-- Migration 067: Add unique constraint for life assessment upsert
--
-- The life_assessment_responses table has no unique constraint on
-- (account_id, assessment_type). The Daily DNA app's assessmentSync.ts
-- uses Supabase's .upsert() with onConflict: 'account_id,assessment_type',
-- which silently fails without a matching unique constraint.
--
-- This migration adds the unique constraint so upserts work correctly.

-- Add unique constraint on (account_id, assessment_type)
-- This ensures one record per assessment type per disciple, and enables
-- the PostgREST upsert to detect conflicts and update existing rows.
ALTER TABLE public.life_assessment_responses
  ADD CONSTRAINT life_assessment_responses_account_type_unique
  UNIQUE (account_id, assessment_type);
