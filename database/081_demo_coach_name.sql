-- Migration 081: Add coach_name to church_demo_settings
-- Stores the name of the DNA coach who recorded the personal video.
-- Displayed as the caption below the video on the demo landing page.
-- Defaults to 'Travis' (current sole coach) — can be updated per church as other coaches onboard.

ALTER TABLE church_demo_settings
  ADD COLUMN IF NOT EXISTS coach_name TEXT DEFAULT 'Travis';
