import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import {
  sendBookDiscoveryReminder,
  sendCallReminder24h,
  sendCallMissedEmail,
  sendProposalExpiringEmail,
  sendInactiveReminderEmail,
} from '@/lib/email';
import { sendServiceSummaryEmails } from '@/lib/service-summary';
import type { ResponseRow } from '@/lib/service-summary';

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

    if (needsDiscoveryReminder && needsDiscoveryReminder.length > 0) {
      // Batch: fetch all existing reminders for these churches in one query
      const churchIds = needsDiscoveryReminder.map(c => c.id);
      const { data: existingReminders } = await supabaseAdmin
        .from('follow_up_emails')
        .select('church_id')
        .in('church_id', churchIds)
        .eq('email_type', 'book_discovery_reminder');

      const alreadySent = new Set((existingReminders || []).map(r => r.church_id));

      for (const church of needsDiscoveryReminder) {
        if (alreadySent.has(church.id)) continue;

        const leader = church.church_leaders[0];
        if (leader) {
          try {
            await sendBookDiscoveryReminder(
              leader.email,
              leader.name.split(' ')[0],
              church.name,
              church.id
            );

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

    if (upcomingCalls && upcomingCalls.length > 0) {
      // Batch: fetch all churches and leaders for these calls in two queries
      const callChurchIds = [...new Set(upcomingCalls.map(c => c.church_id))];
      const { data: callChurches } = await supabaseAdmin
        .from('churches')
        .select('id, name')
        .in('id', callChurchIds);
      const { data: callLeaders } = await supabaseAdmin
        .from('church_leaders')
        .select('church_id, email, name')
        .in('church_id', callChurchIds)
        .eq('is_primary_contact', true);

      const churchMap = new Map((callChurches || []).map(c => [c.id, c]));
      const leaderMap = new Map((callLeaders || []).map(l => [l.church_id, l]));

      for (const call of upcomingCalls) {
        const church = churchMap.get(call.church_id);
        const leader = leaderMap.get(call.church_id);

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

    if (missedCalls && missedCalls.length > 0) {
      // Batch: fetch all existing missed-call reminders + church/leader data
      const missedCallIds = missedCalls.map(c => c.id);
      const missedChurchIds = [...new Set(missedCalls.map(c => c.church_id))];

      const { data: existingMissedReminders } = await supabaseAdmin
        .from('follow_up_emails')
        .select('scheduled_call_id')
        .in('scheduled_call_id', missedCallIds)
        .eq('email_type', 'call_missed');
      const alreadySentMissed = new Set((existingMissedReminders || []).map(r => r.scheduled_call_id));

      const { data: missedChurches } = await supabaseAdmin
        .from('churches')
        .select('id, name')
        .in('id', missedChurchIds);
      const { data: missedLeaders } = await supabaseAdmin
        .from('church_leaders')
        .select('church_id, email, name')
        .in('church_id', missedChurchIds)
        .eq('is_primary_contact', true);

      const missedChurchMap = new Map((missedChurches || []).map(c => [c.id, c]));
      const missedLeaderMap = new Map((missedLeaders || []).map(l => [l.church_id, l]));

      for (const call of missedCalls) {
        if (alreadySentMissed.has(call.id)) continue;

        const church = missedChurchMap.get(call.church_id);
        const leader = missedLeaderMap.get(call.church_id);

        if (leader && church) {
          try {
            await sendCallMissedEmail(
              leader.email,
              leader.name.split(' ')[0],
              church.name,
              call.call_type as 'discovery' | 'proposal' | 'strategy',
              church.id
            );

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

    if (proposalExpiring && proposalExpiring.length > 0) {
      // Batch: fetch all existing reminders + leaders
      const proposalChurchIds = proposalExpiring.map(c => c.id);

      const { data: existingProposalReminders } = await supabaseAdmin
        .from('follow_up_emails')
        .select('church_id')
        .in('church_id', proposalChurchIds)
        .eq('email_type', 'proposal_expiring');
      const alreadySentProposal = new Set((existingProposalReminders || []).map(r => r.church_id));

      const { data: proposalLeaders } = await supabaseAdmin
        .from('church_leaders')
        .select('church_id, email, name')
        .in('church_id', proposalChurchIds)
        .eq('is_primary_contact', true);
      const proposalLeaderMap = new Map((proposalLeaders || []).map(l => [l.church_id, l]));

      for (const church of proposalExpiring) {
        if (alreadySentProposal.has(church.id)) continue;

        const leader = proposalLeaderMap.get(church.id);
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

    if (inactiveChurches && inactiveChurches.length > 0) {
      // Batch: fetch recent inactive reminders + leaders
      const inactiveChurchIds = inactiveChurches.map(c => c.id);

      const { data: recentInactiveReminders } = await supabaseAdmin
        .from('follow_up_emails')
        .select('church_id')
        .in('church_id', inactiveChurchIds)
        .eq('email_type', 'inactive_reminder')
        .gte('sent_at', fourteenDaysAgo.toISOString());
      const recentlySentInactive = new Set((recentInactiveReminders || []).map(r => r.church_id));

      const { data: inactiveLeaders } = await supabaseAdmin
        .from('church_leaders')
        .select('church_id, email, name')
        .in('church_id', inactiveChurchIds)
        .eq('is_primary_contact', true);
      const inactiveLeaderMap = new Map((inactiveLeaders || []).map(l => [l.church_id, l]));

      for (const church of inactiveChurches) {
        if (recentlySentInactive.has(church.id)) continue;

        const leader = inactiveLeaderMap.get(church.id);
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

    // =====================================================
    // 6. SERVICE FOLLOW-UP SUMMARY EMAILS (Auto-send)
    // Ended live sessions that haven't had summary emails sent
    // Sends coordinator emails + master summary to service creator
    // =====================================================
    const { data: unsentSessions } = await supabaseAdmin
      .from('live_sessions')
      .select('id, church_id, service_id, ended_at')
      .not('ended_at', 'is', null)
      .is('summary_emailed_at', null)
      .order('ended_at', { ascending: false })
      .limit(50);

    if (unsentSessions && unsentSessions.length > 0) {
      console.log(`[CRON] Found ${unsentSessions.length} sessions needing summary emails`);

      for (const ls of unsentSessions) {
        try {
          // Get responses for this session
          const { data: responses, error: rpcError } = await supabaseAdmin.rpc(
            'get_service_responses_for_session',
            { p_session_id: ls.id }
          );

          if (rpcError) {
            console.error(`[CRON] RPC error for session ${ls.id}:`, rpcError);
            results.push({
              type: 'service_summary',
              churchId: ls.church_id,
              churchName: `session:${ls.id}`,
              success: false,
              error: rpcError.message,
            });
            continue;
          }

          const rows = (responses || []) as ResponseRow[];

          if (rows.length === 0) {
            // No actionable responses — mark as emailed so we don't keep checking
            await supabaseAdmin
              .from('live_sessions')
              .update({ summary_emailed_at: new Date().toISOString() })
              .eq('id', ls.id);
            continue;
          }

          // Look up the service creator's email for the master summary
          let creatorEmail: string | null = null;
          const { data: service } = await supabaseAdmin
            .from('interactive_services')
            .select('created_by')
            .eq('id', ls.service_id)
            .single();

          if (service?.created_by) {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(service.created_by);
            creatorEmail = userData?.user?.email || null;
          }

          const serviceTitle = rows[0]?.service_title || 'Service';
          const result = await sendServiceSummaryEmails(rows, ls.church_id, creatorEmail);

          // Mark session as emailed
          await supabaseAdmin
            .from('live_sessions')
            .update({ summary_emailed_at: new Date().toISOString() })
            .eq('id', ls.id);

          results.push({
            type: 'service_summary',
            churchId: ls.church_id,
            churchName: serviceTitle,
            success: true,
          });

          if (result.coordinators.length > 0) {
            console.log(
              `[CRON] Sent ${result.sent} emails for "${serviceTitle}" → ${result.coordinators.join(', ')}`
            );
          }
        } catch (err) {
          console.error(`[CRON] Error processing session ${ls.id}:`, err);
          results.push({
            type: 'service_summary',
            churchId: ls.church_id,
            churchName: `session:${ls.id}`,
            success: false,
            error: String(err),
          });
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
        service_summary: results.filter((r) => r.type === 'service_summary').length,
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
