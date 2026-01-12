-- Migration: Add Onboarding Phase (Phase 0)
-- Run this in your Supabase SQL Editor

-- Insert Phase 0 - Onboarding (before Phase 1)
INSERT INTO phases (phase_number, name, description, duration_weeks, display_order) VALUES
(0, 'Onboarding', 'Initial church partnership documents and meeting notes from Discovery, Agreement, and Strategy calls.', NULL, 0);

-- Insert Onboarding Milestones (document placeholders)
INSERT INTO milestones (phase_id, title, description, resource_type, display_order, is_key_milestone) VALUES
((SELECT id FROM phases WHERE phase_number = 0), 'Church Assessment', 'Completed church assessment form (PDF).', 'pdf', 1, FALSE),
((SELECT id FROM phases WHERE phase_number = 0), 'Discovery Call Notes', 'Notes and outcomes from the initial discovery conversation.', 'pdf', 2, FALSE),
((SELECT id FROM phases WHERE phase_number = 0), 'Agreement Call Notes', 'Notes from the partnership agreement discussion.', 'pdf', 3, FALSE),
((SELECT id FROM phases WHERE phase_number = 0), 'Strategy Call Notes', 'Notes and action items from the strategy planning session.', 'pdf', 4, TRUE);
