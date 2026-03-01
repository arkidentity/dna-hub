-- Migration 089: Schedule push notification cron jobs via pg_cron + pg_net
--
-- Replaces Vercel cron (requires Pro plan) with Supabase-native scheduling.
-- Uses pg_net to make HTTP GET requests to the Daily DNA API endpoints.
--
-- PREREQUISITES:
--   1. Enable pg_cron extension in Supabase Dashboard → Database → Extensions
--   2. Enable pg_net extension (usually already enabled)
--   3. Add two vault secrets (run these in SQL Editor):
--
--        SELECT vault.create_secret('<YOUR_CRON_SECRET>', 'cron_secret',
--               'Bearer token for Daily DNA cron API routes');
--
--        SELECT vault.create_secret('https://dailydna.app', 'daily_dna_url',
--               'Base URL for Daily DNA app');
--
--   4. Then run this migration.

-- Ensure extensions are available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
-- pg_cron must be enabled via Dashboard first; this is a safety check
-- CREATE EXTENSION IF NOT EXISTS pg_cron;  -- uncomment if needed

-- ============================================
-- Helper function: call a Daily DNA cron endpoint
-- Reads base URL and secret from Supabase vault.
-- ============================================
CREATE OR REPLACE FUNCTION public.call_dna_cron(endpoint text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url text;
  secret text;
BEGIN
  SELECT decrypted_secret INTO base_url
    FROM vault.decrypted_secrets WHERE name = 'daily_dna_url';
  SELECT decrypted_secret INTO secret
    FROM vault.decrypted_secrets WHERE name = 'cron_secret';

  IF base_url IS NULL OR secret IS NULL THEN
    RAISE WARNING '[cron] Missing vault secrets: daily_dna_url or cron_secret';
    RETURN;
  END IF;

  -- Fire-and-forget HTTP GET via pg_net (async, non-blocking)
  PERFORM net.http_get(
    url := base_url || endpoint,
    headers := jsonb_build_object('Authorization', 'Bearer ' || secret)
  );
END;
$$;

-- Restrict to postgres role only (cron runs as postgres)
REVOKE ALL ON FUNCTION public.call_dna_cron(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.call_dna_cron(text) FROM anon, authenticated;

-- ============================================
-- Schedule: Daily reminder — every hour at :00
-- ============================================
SELECT cron.unschedule('daily-dna-daily-reminder')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'daily-dna-daily-reminder'
  );

SELECT cron.schedule(
  'daily-dna-daily-reminder',
  '0 * * * *',
  $$SELECT public.call_dna_cron('/api/cron/daily-reminder')$$
);

-- ============================================
-- Schedule: Event reminders — every 15 minutes
-- ============================================
SELECT cron.unschedule('daily-dna-event-reminders')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'daily-dna-event-reminders'
  );

SELECT cron.schedule(
  'daily-dna-event-reminders',
  '*/15 * * * *',
  $$SELECT public.call_dna_cron('/api/cron/event-reminders')$$
);
