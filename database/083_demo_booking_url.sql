-- 083_demo_booking_url
-- Adds per-coach booking URL to church_demo_settings.
-- Coaches paste their Calendly, Google Calendar, or any other
-- booking link here; it embeds as a pop-up modal on the demo page.

ALTER TABLE church_demo_settings
  ADD COLUMN IF NOT EXISTS booking_url TEXT;
