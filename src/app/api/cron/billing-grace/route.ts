import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendBillingDunningDay3Email,
  sendBillingSuspendingSoonEmail,
  sendBillingSuspendedEmail,
} from '@/lib/email';

const CRON_SECRET = process.env.CRON_SECRET;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GraceResult {
  churchId: string;
  churchName: string;
  action: string;
  success: boolean;
  error?: string;
}

/**
 * Grace period cron — run daily.
 *
 * Finds all past_due churches and determines which dunning action to take
 * based on how many days have passed since the invoice.payment_failed event.
 *
 * Day 3: send "reminder — 4 days left" email
 * Day 7: send "suspending tomorrow" email
 * Day 8+: suspend account + send suspended email
 *
 * Uses billing_events to track which dunning emails have already been sent
 * (synthetic stripe_event_id: dunning_{action}_{church_id}).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.log('[BILLING-CRON] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[BILLING-CRON] Starting billing grace period check');

  const results: GraceResult[] = [];

  // Fetch all past_due churches with their latest payment_failed event
  const { data: pastDueChurches, error: fetchError } = await supabaseAdmin
    .from('church_billing_status')
    .select('church_id, billing_email, churches(name)')
    .eq('status', 'past_due');

  if (fetchError) {
    console.error('[BILLING-CRON] Failed to fetch past_due churches:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!pastDueChurches || pastDueChurches.length === 0) {
    console.log('[BILLING-CRON] No past_due churches found');
    return NextResponse.json({ processed: 0, results: [] });
  }

  console.log(`[BILLING-CRON] Found ${pastDueChurches.length} past_due churches`);

  for (const row of pastDueChurches) {
    const churchId = row.church_id;
    const church = (row.churches as unknown) as { name: string } | null;
    const churchName = church?.name ?? 'Your church';
    // Use billing_email if set, else fall back to church leader email
    let recipientEmail = row.billing_email as string | null;

    if (!recipientEmail) {
      // Fall back to the first church leader's email
      const { data: leaderRow } = await supabaseAdmin
        .from('church_leaders')
        .select('users(email)')
        .eq('church_id', churchId)
        .limit(1)
        .single();
      const leaderUser = (leaderRow?.users as unknown) as { email: string } | null;
      recipientEmail = leaderUser?.email ?? null;
    }

    if (!recipientEmail) {
      console.warn(`[BILLING-CRON] No email for church ${churchId}, skipping`);
      continue;
    }

    // Find the most recent invoice.payment_failed event for this church
    const { data: failedEvent } = await supabaseAdmin
      .from('billing_events')
      .select('processed_at')
      .eq('church_id', churchId)
      .eq('event_type', 'invoice.payment_failed')
      .order('processed_at', { ascending: false })
      .limit(1)
      .single();

    if (!failedEvent) {
      console.warn(`[BILLING-CRON] No payment_failed event for past_due church ${churchId}, skipping`);
      continue;
    }

    const failedAt = new Date(failedEvent.processed_at);
    const now = new Date();
    const daysPastDue = Math.floor((now.getTime() - failedAt.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`[BILLING-CRON] Church ${churchId} (${churchName}): ${daysPastDue} days past due`);

    // Check which dunning emails have already been sent
    const sentEventIds = [`dunning_day3_${churchId}`, `dunning_day7_${churchId}`, `dunning_suspended_${churchId}`];
    const { data: sentEvents } = await supabaseAdmin
      .from('billing_events')
      .select('stripe_event_id')
      .in('stripe_event_id', sentEventIds);

    const alreadySent = new Set((sentEvents ?? []).map((e: { stripe_event_id: string }) => e.stripe_event_id));

    // Day 8+ — suspend
    if (daysPastDue >= 8 && !alreadySent.has(`dunning_suspended_${churchId}`)) {
      try {
        // Suspend: set status, disable live_service_enabled
        await supabaseAdmin
          .from('church_billing_status')
          .update({ status: 'suspended', suspended_at: now.toISOString() })
          .eq('church_id', churchId);

        // Look up subdomain to disable live service
        const { data: churchRow } = await supabaseAdmin
          .from('churches')
          .select('subdomain')
          .eq('id', churchId)
          .single();

        if (churchRow?.subdomain) {
          await supabaseAdmin
            .from('church_branding_settings')
            .update({ live_service_enabled: false })
            .eq('subdomain', churchRow.subdomain);
        }

        // Send suspension email
        await sendBillingSuspendedEmail(recipientEmail, churchName, churchId);

        // Log the dunning event
        await supabaseAdmin.from('billing_events').insert({
          church_id: churchId,
          stripe_event_id: `dunning_suspended_${churchId}`,
          event_type: 'dunning_suspended',
          payload: { days_past_due: daysPastDue, email_sent_to: recipientEmail },
        });

        results.push({ churchId, churchName, action: 'suspended', success: true });
        console.log(`[BILLING-CRON] Suspended church ${churchId}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ churchId, churchName, action: 'suspended', success: false, error: msg });
        console.error(`[BILLING-CRON] Failed to suspend church ${churchId}:`, msg);
      }
      continue; // Don't also send Day 7 email
    }

    // Day 7 — final warning
    if (daysPastDue >= 7 && !alreadySent.has(`dunning_day7_${churchId}`)) {
      try {
        await sendBillingSuspendingSoonEmail(recipientEmail, churchName, churchId);

        await supabaseAdmin.from('billing_events').insert({
          church_id: churchId,
          stripe_event_id: `dunning_day7_${churchId}`,
          event_type: 'dunning_day7',
          payload: { days_past_due: daysPastDue, email_sent_to: recipientEmail },
        });

        results.push({ churchId, churchName, action: 'day7_warning', success: true });
        console.log(`[BILLING-CRON] Sent Day 7 warning to church ${churchId}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ churchId, churchName, action: 'day7_warning', success: false, error: msg });
        console.error(`[BILLING-CRON] Day 7 email failed for church ${churchId}:`, msg);
      }
      continue;
    }

    // Day 3 — reminder
    if (daysPastDue >= 3 && !alreadySent.has(`dunning_day3_${churchId}`)) {
      try {
        await sendBillingDunningDay3Email(recipientEmail, churchName, churchId);

        await supabaseAdmin.from('billing_events').insert({
          church_id: churchId,
          stripe_event_id: `dunning_day3_${churchId}`,
          event_type: 'dunning_day3',
          payload: { days_past_due: daysPastDue, email_sent_to: recipientEmail },
        });

        results.push({ churchId, churchName, action: 'day3_reminder', success: true });
        console.log(`[BILLING-CRON] Sent Day 3 reminder to church ${churchId}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ churchId, churchName, action: 'day3_reminder', success: false, error: msg });
        console.error(`[BILLING-CRON] Day 3 email failed for church ${churchId}:`, msg);
      }
    }
  }

  console.log(`[BILLING-CRON] Done. Processed ${results.length} actions.`);
  return NextResponse.json({
    processed: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}
