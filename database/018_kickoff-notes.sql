-- Migration: Add Kick-Off Notes milestone to Onboarding Phase (Phase 0)
-- Run this in your Supabase SQL Editor

-- Insert new milestone into Phase 0 (Onboarding)
-- display_order = 5 places it after Strategy Call Notes
INSERT INTO milestones (phase_id, title, description, resource_type, display_order, is_key_milestone) VALUES
((SELECT id FROM phases WHERE phase_number = 0), 'Kick-Off Notes', 'Notes and action items from the kick-off meeting to officially begin implementation.', 'pdf', 5, FALSE);
