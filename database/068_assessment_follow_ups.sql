-- Migration 068: Add follow_ups JSONB column to life_assessment_responses
--
-- Several Life Assessment questions have follow-up prompts (e.g. "Explain:",
-- "If yes, what:", "Why?"). The disciple's text answers to these prompts are
-- stored in a separate `followUps` object in the Daily DNA app, but were never
-- synced to Supabase because no column existed.
--
-- This adds the column so leaders can see the full context of each answer.

ALTER TABLE public.life_assessment_responses
  ADD COLUMN IF NOT EXISTS follow_ups JSONB DEFAULT '{}';

COMMENT ON COLUMN public.life_assessment_responses.follow_ups
  IS 'Follow-up text answers keyed by question id, e.g. {"3": "I feel...", "8": "Anger"}';
