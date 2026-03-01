-- Migration 090: Add subdomain to push subscriptions
--
-- Stores the subdomain (e.g., 'life', 'arkiowa') per push subscription
-- so notifications use the correct church branding for each device.
-- A user may have the PWA installed from different subdomains on different devices.

ALTER TABLE disciple_push_subscriptions
  ADD COLUMN IF NOT EXISTS subdomain TEXT;

-- Backfill existing subscriptions from the account's church_subdomain
UPDATE disciple_push_subscriptions dps
SET subdomain = daa.church_subdomain
FROM disciple_app_accounts daa
WHERE dps.account_id = daa.id
  AND dps.subdomain IS NULL
  AND daa.church_subdomain IS NOT NULL;
