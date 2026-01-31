import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import {
  sendBookDiscoveryReminder,
  sendCallReminder24h,
  sendCallMissedEmail,
  sendProposalExpiringEmail,
  sendInactiveReminderEmail,
} from '@/lib/email';

// Vercel Cron jobs send a specific header to authenticate
const CRON_SECRET = process.env.CRON_SECRET;

interface FollowUpResult {
  type: string;
  churchId: string;
  churchName: string;
  success: boolean;
  error?: string;
}

export async function GET(request: NextRequest) {
  // Verify cron authentication
  const authHeader = request.headers.get('authorization');

  // In production, verify the cron secret
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.log('[CRON] Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON] Starting follow-up email processing...');

  const supabaseAdmin = getSupabaseAdmin();
  const results: FollowUpResult[] = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dnadiscipleship.com';

  try {
    // =====================================================
    // 1. BOOK DISCOVERY REMINDERS
    // Churches that submitted assessment 3+ days ago but haven't booked a discovery call
    // =====================================================
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: needsDiscoveryReminder } = await supabaseAdmin
      .from('churches')
      .select(`
        id,
        name,
        created_at,
        church_leaders!inner(email, name)
      `)
      .eq('status', 'pending_assessment')
      .lt('created_at', threeDaysAgo.toISOString());

    if (needsDiscoveryReminder) {
      for (const church of needsDiscoveryReminder) {
        // Check if we already sent this reminder
        const { data: existingReminder } = await supabaseAdmin
          .from('follow_up_emails')
          .select('id')
          .eq('church_id', church.id)
          .eq('email_type', 'book_discovery_reminder')
          .single();

        if (!existingReminder) {
          const leader = church.church_leaders[0];
          if (leader) {
            try {
              await sendBookDiscoveryReminder(
                leader.email,
                leader.name.split(' ')[0],
                church.name,
                church.id
              );

              // Record that we sent this reminder
              await supabaseAdmin.from('follow_up_emails').insert({
                church_id: church.id,
                email_type: 'book_discovery_reminder',
              });

              results.push({
                type: 'book_discovery_reminder',
                churchId: church.id,
                churchName: church.name,
                success: true,
              });
            } catch (error) {
              results.push({
                type: 'book_discovery_reminder',
                churchId: church.id,
                churchName: church.name,
                success: false,
                error: String(error),
              });
            }
          }
        }
      }
    }

    // =====================================================
    // 2. CALL REMINDERS (24 hours before)
    // Scheduled calls happening in the next 23-25 hours
    // =====================================================
    const now = new Date();
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: upcomingCalls } = await supabaseAdmin
      .from('scheduled_calls')
      .select('id, church_id, call_type, scheduled_at, reminder_sent')
      .eq('completed', false)
      .eq('reminder_sent', false)
      .gte('scheduled_at', in23Hours.toISOString())
      .lte('scheduled_at', in25Hours.toISOString());

    if (upcomingCalls) {
      for (const call of upcomingCalls) {
        // Get the church info
        const { data: church } = await supabaseAdmin
          .from('churches')
          .select('id, name')
          .eq('id', call.church_id)
          .single();

        // Get the primary leader for this church
        const { data: leaders } = await supabaseAdmin
          .from('church_leaders')
          .select('email, name')
          .eq('church_id', call.church_id)
          .eq('is_primary_contact', true)
          .limit(1);

        const leader = leaders?.[0];

        if (leader && church) {
          try {
            await sendCallReminder24h(
              leader.email,
              leader.name.split(' ')[0],
              church.name,
              call.call_type as 'discovery' | 'proposal' | 'strategy',
              new Date(call.scheduled_at),
              church.id
            );

            // Mark reminder as sent
            await supabaseAdmin
              .from('scheduled_calls')
              .update({ reminder_sent: true })
              .eq('id', call.id);

            results.push({
              type: 'call_reminder_24h',
              churchId: church.id,
              churchName: church.name,
              success: true,
            });
          } catch (error) {
            results.push({
              type: 'call_reminder_24h',
              churchId: church.id,
              churchName: church.name,
              success: false,
              error: String(error),
            });
          }
        }
      }
    }

    // =====================================================
    // 3. MISSED CALL NOTIFICATIONS
    // Calls that were scheduled for 1-2 days ago but not completed
    // =====================================================
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const { data: missedCalls } = await supabaseAdmin
      .from('scheduled_calls')
      .select('id, church_id, call_type, scheduled_at')
      .eq('completed', false)
      .lt('scheduled_at', oneDayAgo.toISOString())
      .gt('scheduled_at', twoDaysAgo.toISOString());

    if (missedCalls) {
      for (const call of missedCalls) {
        // Check if we already sent a missed call notification
        const { data: existingReminder } = await supabaseAdmin
          .from('follow_up_emails')
          .select('id')
          .eq('church_id', call.church_id)
          .eq('email_type', 'call_missed')
          .eq('scheduled_call_id', call.id)
          .single();

        if (!existingReminder) {
          // Get church info
          const { data: church } = await supabaseAdmin
            .from('churches')
            .select('id, name')
            .eq('id', call.church_id)
            .single();

          const { data: leaders } = await supabaseAdmin
            .from('church_leaders')
            .select('email, name')
            .eq('church_id', call.church_id)
            .eq('is_primary_contact', true)
            .limit(1);

          const leader = leaders?.[0];

          if (leader && church) {
            try {
              await sendCallMissedEmail(
                leader.email,
                leader.name.split(' ')[0],
                church.name,
                call.call_type as 'discovery' | 'proposal' | 'strategy',
                church.id
              );

              // Record that we sent this notification
              await supabaseAdmin.from('follow_up_emails').insert({
                church_id: church.id,
                email_type: 'call_missed',
                scheduled_call_id: call.id,
              });

              results.push({
                type: 'call_missed',
                churchId: church.id,
                churchName: church.name,
                success: true,
              });
            } catch (error) {
              results.push({
                type: 'call_missed',
                churchId: church.id,
                churchName: church.name,
                success: false,
                error: String(error),
              });
            }
          }
        }
      }
    }

    // =====================================================
    // 4. PROPOSAL EXPIRING REMINDERS
    // Churches in 'proposal_sent' status for 7+ days
    // =====================================================
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: proposalExpiring } = await supabaseAdmin
      .from('churches')
      .select(`
        id,
        name,
        updated_at
      `)
      .eq('status', 'proposal_sent')
      .lt('updated_at', sevenDaysAgo.toISOString());

    if (proposalExpiring) {
      for (const church of proposalExpiring) {
        // Check if we already sent this reminder
        const { data: existingReminder } = await supabaseAdmin
          .from('follow_up_emails')
          .select('id')
          .eq('church_id', church.id)
          .eq('email_type', 'proposal_expiring')
          .single();

        if (!existingReminder) {
          const { data: leaders } = await supabaseAdmin
            .from('church_leaders')
            .select('email, name')
            .eq('church_id', church.id)
            .eq('is_primary_contact', true)
            .limit(1);

          const leader = leaders?.[0];

          if (leader) {
            const portalUrl = `${appUrl}/portal?church=${church.id}`;

            try {
              await sendProposalExpiringEmail(
                leader.email,
                leader.name.split(' ')[0],
                church.name,
                portalUrl,
                church.id
              );

              // Record that we sent this reminder
              await supabaseAdmin.from('follow_up_emails').insert({
                church_id: church.id,
                email_type: 'proposal_expiring',
              });

              results.push({
                type: 'proposal_expiring',
                churchId: church.id,
                churchName: church.name,
                success: true,
              });
            } catch (error) {
              results.push({
                type: 'proposal_expiring',
                churchId: church.id,
                churchName: church.name,
                success: false,
                error: String(error),
              });
            }
          }
        }
      }
    }

    // =====================================================
    // 5. INACTIVE CHURCH REMINDERS
    // Active churches with no progress update in 14+ days
    // =====================================================
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: inactiveChurches } = await supabaseAdmin
      .from('churches')
      .select(`
        id,
        name,
        current_phase,
        updated_at
      `)
      .eq('status', 'active')
      .lt('updated_at', fourteenDaysAgo.toISOString());

    if (inactiveChurches) {
      for (const church of inactiveChurches) {
        // Check if we already sent this reminder (within the last 14 days)
        const { data: existingReminder } = await supabaseAdmin
          .from('follow_up_emails')
          .select('id, sent_at')
          .eq('church_id', church.id)
          .eq('email_type', 'inactive_reminder')
          .gte('sent_at', fourteenDaysAgo.toISOString())
          .single();

        if (!existingReminder) {
          const { data: leaders } = await supabaseAdmin
            .from('church_leaders')
            .select('email, name')
            .eq('church_id', church.id)
            .eq('is_primary_contact', true)
            .limit(1);

          const leader = leaders?.[0];

          if (leader) {
            const dashboardUrl = `${appUrl}/dashboard`;

            try {
              await sendInactiveReminderEmail(
                leader.email,
                leader.name.split(' ')[0],
                church.name,
                church.current_phase,
                dashboardUrl,
                church.id
              );

              // Record that we sent this reminder
              await supabaseAdmin.from('follow_up_emails').insert({
                church_id: church.id,
                email_type: 'inactive_reminder',
              });

              results.push({
                type: 'inactive_reminder',
                churchId: church.id,
                churchName: church.name,
                success: true,
              });
            } catch (error) {
              results.push({
                type: 'inactive_reminder',
                churchId: church.id,
                churchName: church.name,
                success: false,
                error: String(error),
              });
            }
          }
        }
      }
    }

    // =====================================================
    // SUMMARY
    // =====================================================
    const summary = {
      timestamp: new Date().toISOString(),
      totalProcessed: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      byType: {
        book_discovery_reminder: results.filter((r) => r.type === 'book_discovery_reminder').length,
        call_reminder_24h: results.filter((r) => r.type === 'call_reminder_24h').length,
        call_missed: results.filter((r) => r.type === 'call_missed').length,
        proposal_expiring: results.filter((r) => r.type === 'proposal_expiring').length,
        inactive_reminder: results.filter((r) => r.type === 'inactive_reminder').length,
      },
      results,
    };

    console.log('[CRON] Follow-up processing complete:', summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[CRON] Error processing follow-ups:', error);
    return NextResponse.json(
      { error: 'Failed to process follow-ups', details: String(error) },
      { status: 500 }
    );
  }
}
