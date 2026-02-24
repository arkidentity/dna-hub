-- Migration 080: Add demo_user_id to church_demo_settings
-- Stores the Supabase Auth user ID for the seeded demo disciple account.
-- Used by the app-session API to generate sign-in tokens for the demo iframe.

ALTER TABLE church_demo_settings ADD COLUMN IF NOT EXISTS demo_user_id UUID;
