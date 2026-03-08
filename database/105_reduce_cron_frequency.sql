-- Migration 105: Reduce cron frequency to save Vercel Active CPU hours
--
-- Event reminders: every 15 min → every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)
-- The event-reminders route window has been widened to 18-24 hours to compensate.

-- ============================================
-- Update: Event reminders — every 6 hours
-- ============================================
SELECT cron.unschedule('daily-dna-event-reminders')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'daily-dna-event-reminders'
  );

SELECT cron.schedule(
  'daily-dna-event-reminders',
  '0 */6 * * *',
  $$SELECT public.call_dna_cron('/api/cron/event-reminders')$$
);
