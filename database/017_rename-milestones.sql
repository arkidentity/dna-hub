-- Migration: Rename milestone titles to remove "Notes" suffix
-- Run this in your Supabase SQL Editor

-- Update Onboarding phase milestones
UPDATE milestones SET title = 'Discovery Call' WHERE title = 'Discovery Call Notes';
UPDATE milestones SET title = 'Agreement Call' WHERE title = 'Agreement Call Notes';
UPDATE milestones SET title = 'Strategy Call' WHERE title = 'Strategy Call Notes';
UPDATE milestones SET title = 'Kick-Off Call' WHERE title = 'Kick-Off Notes';
