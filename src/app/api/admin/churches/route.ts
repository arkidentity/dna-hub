import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import {
  sendProposalReadyEmail,
  sendAgreementConfirmedEmail,
  sendDashboardAccessEmail,
  sendChurchLeaderInviteEmail,
  sendAssessmentInviteEmail,
} from '@/lib/email';
import { logStatusChange } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Get all churches with leader info
    const { data: churches, error: churchesError } = await supabase
      .from('churches')
      .select(`
        id,
        name,
        status,
        current_phase,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (churchesError) {
      console.error('[ADMIN] Churches error:', churchesError);
      return NextResponse.json({ error: 'Failed to fetch churches' }, { status: 500 });
    }

    // Run dependent queries in parallel for performance
    const churchIds = churches?.map(c => c.id) || [];
    const activeChurchIds = churches?.filter(c => c.status === 'active').map(c => c.id) || [];

    const [
      leadersResult,
      progressResult,
      phasesResult,
      scheduledCallsResult,
    ] = await Promise.all([
      supabase
        .from('church_leaders')
        .select('id, church_id, name, email')
        .in('church_id', churchIds)
        .eq('is_primary_contact', true),
      activeChurchIds.length > 0
        ? supabase
            .from('church_progress')
            .select('church_id, completed, target_date')
            .in('church_id', activeChurchIds)
        : Promise.resolve({ data: [] as { church_id: string; completed: boolean; target_date: string }[] }),
      supabase
        .from('phases')
        .select('id')
        .gt('phase_number', 0),
      churchIds.length > 0
        ? supabase
            .from('scheduled_calls')
            .select('church_id, call_type, scheduled_at')
            .in('church_id', churchIds)
            .eq('completed', false)
            .gt('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true })
        : Promise.resolve({ data: [] as { church_id: string; call_type: string; scheduled_at: string }[] }),
    ]);

    const { data: leaders } = leadersResult as { data: { id: string; church_id: string; name: string; email: string }[] | null };
    const progress = ('data' in progressResult ? progressResult.data : progressResult) as { church_id: string; completed: boolean; target_date: string }[] | null;
    const { data: phases } = phasesResult as { data: { id: string }[] | null };
    const scheduledCalls = ('data' in scheduledCallsResult ? scheduledCallsResult.data : scheduledCallsResult) as { church_id: string; call_type: string; scheduled_at: string }[] | null;

    // Get milestones count (depends on phases result)
    const phaseIds = phases?.map(p => p.id) || [];
    const { data: milestones } = phaseIds.length > 0
      ? await supabase
          .from('milestones')
          .select('id')
          .in('phase_id', phaseIds)
      : { data: [] };

    const totalMilestones = milestones?.length || 0;

    // Build church summaries
    const churchSummaries = churches?.map(church => {
      const churchLeader = leaders?.find(l => l.church_id === church.id);
      const churchProgress = progress?.filter(p => p.church_id === church.id) || [];
      const completedMilestones = churchProgress.filter(p => p.completed).length;

      // Check for overdue items
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const hasOverdue = churchProgress.some(p => {
        if (p.completed || !p.target_date) return false;
        const targetDate = new Date(p.target_date);
        return targetDate < today;
      });

      // Get next call
      const nextCall = scheduledCalls?.find(c => c.church_id === church.id);

      return {
        id: church.id,
        name: church.name,
        status: church.status,
        current_phase: church.current_phase,
        created_at: church.created_at,
        updated_at: church.updated_at,
        leader_name: churchLeader?.name || 'Unknown',
        leader_email: churchLeader?.email || '',
        leader_id: churchLeader?.id || '',
        completed_milestones: completedMilestones,
        total_milestones: totalMilestones,
        has_overdue: hasOverdue,
        next_call: nextCall ? {
          call_type: nextCall.call_type,
          scheduled_at: nextCall.scheduled_at,
        } : undefined,
        last_activity: church.updated_at,
      };
    }) || [];

    // Calculate stats
    const stats = {
      total: churches?.length || 0,
      byStatus: {} as Record<string, number>,
      activeThisWeek: 0,
    };

    churches?.forEach(church => {
      stats.byStatus[church.status] = (stats.byStatus[church.status] || 0) + 1;

      // Check if updated in last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (new Date(church.updated_at) > weekAgo) {
        stats.activeThisWeek++;
      }
    });

    return NextResponse.json({
      churches: churchSummaries,
      stats,
    });
  } catch (error) {
    console.error('[ADMIN] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      churchName,
      city,
      state,
      leaderName,
      leaderEmail,
      leaderPhone,
      leaderRole,
      initialStatus = 'prospect',
    } = body;

    if (!churchName?.trim()) {
      return NextResponse.json({ error: 'Church name is required' }, { status: 400 });
    }
    if (!leaderName?.trim()) {
      return NextResponse.json({ error: 'Leader name is required' }, { status: 400 });
    }
    if (!leaderEmail?.trim()) {
      return NextResponse.json({ error: 'Leader email is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const normalizedEmail = leaderEmail.trim().toLowerCase();

    // 1. Create the church record
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .insert({
        name: churchName.trim(),
        status: initialStatus,
      })
      .select()
      .single();

    if (churchError || !church) {
      console.error('[ADD CHURCH] church insert error:', churchError);
      return NextResponse.json({ error: 'Failed to create church' }, { status: 500 });
    }

    // 1b. Create a minimal assessment record to store city/state/contact info
    await supabase.from('church_assessments').insert({
      church_id: church.id,
      church_name: churchName.trim(),
      contact_name: leaderName.trim(),
      contact_email: leaderEmail.trim().toLowerCase(),
      contact_phone: leaderPhone?.trim() || null,
      church_city: city?.trim() || null,
      church_state: state?.trim() || null,
    });

    // 2. Create or find the user in unified auth
    let userId: string;
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({ email: normalizedEmail, name: leaderName.trim() })
        .select('id')
        .single();

      if (userError || !newUser) {
        console.error('[ADD CHURCH] user insert error:', userError);
        await supabase.from('churches').delete().eq('id', church.id);
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
      }
      userId = newUser.id;
    }

    // 3. Assign roles
    await supabase.from('user_roles').upsert(
      { user_id: userId, role: 'church_leader', church_id: church.id },
      { onConflict: 'user_id,role,church_id', ignoreDuplicates: true }
    );
    await supabase.from('user_roles').upsert(
      { user_id: userId, role: 'dna_leader', church_id: church.id },
      { onConflict: 'user_id,role,church_id', ignoreDuplicates: true }
    );
    await supabase.from('user_roles').upsert(
      { user_id: userId, role: 'training_participant' },
      { onConflict: 'user_id,role,church_id', ignoreDuplicates: true }
    );

    // 4. Create dna_leaders record (pre-activated)
    await supabase.from('dna_leaders').upsert(
      {
        email: normalizedEmail,
        name: leaderName.trim(),
        phone: leaderPhone?.trim() || null,
        church_id: church.id,
        user_id: userId,
        is_active: true,
        activated_at: new Date().toISOString(),
        invited_by_type: 'super_admin',
      },
      { onConflict: 'email' }
    );

    // 5. Create church_leaders record
    const { error: clError } = await supabase.from('church_leaders').insert({
      church_id: church.id,
      email: normalizedEmail,
      name: leaderName.trim(),
      role: leaderRole?.trim() || null,
      is_primary_contact: true,
      user_id: userId,
    });

    if (clError) {
      console.error('[ADD CHURCH] church_leaders insert error:', clError);
      // Non-fatal — church and auth records are fine
    }

    // Auth account and welcome email are deferred — they fire when the status is
    // promoted to 'active' via the PATCH handler. For prospect/demo/pending_assessment
    // the church leader doesn't know about the system yet.

    return NextResponse.json({ church: { id: church.id, name: church.name } }, { status: 201 });
  } catch (error) {
    console.error('[ADD CHURCH] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const body = await request.json();

    // Handle bulk operations
    if (body.bulk && Array.isArray(body.churchIds)) {
      return handleBulkUpdate(supabase, session, body);
    }

    const { churchId, status, current_phase, tierName, aliases, sendEmail = true } = body;

    if (!churchId) {
      return NextResponse.json({ error: 'Church ID required' }, { status: 400 });
    }

    // Get current church data and leader info for email notifications
    const { data: churchData } = await supabase
      .from('churches')
      .select('id, name, status')
      .eq('id', churchId)
      .single();

    const { data: leaderData } = await supabase
      .from('church_leaders')
      .select('name, email')
      .eq('church_id', churchId)
      .eq('is_primary_contact', true)
      .single();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
    }

    if (typeof current_phase === 'number') {
      updates.current_phase = current_phase;
    }

    // Store the selected tier when moving to awaiting_strategy
    if (tierName && status === 'awaiting_strategy') {
      updates.selected_tier = tierName;
    }

    // Update church aliases for calendar matching
    if (aliases !== undefined) {
      updates.aliases = aliases;
    }

    const { error: updateError } = await supabase
      .from('churches')
      .update(updates)
      .eq('id', churchId);

    if (updateError) {
      console.error('[ADMIN] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update church' }, { status: 500 });
    }

    // Log the status change to audit trail
    if (status && churchData && status !== churchData.status) {
      await logStatusChange(
        session.email,
        churchId,
        churchData.status,
        status,
        churchData.name
      );
    }

    // Send email notifications based on status change
    // prospect + demo: no email — admin is working behind the scenes
    // pending_assessment: assessment invite (warm, from DNA coach)
    // awaiting_discovery: no email — assessment form submission already handles this
    // proposal_sent: proposal ready email
    // awaiting_strategy: agreement confirmed email
    // active: dashboard access email + create auth account if not already done
    if (sendEmail && status && leaderData && churchData && status !== churchData.status) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dnadiscipleship.com';
      const portalUrl = `${baseUrl}/portal`;
      const dashboardUrl = `${baseUrl}/dashboard`;
      const loginUrl = `${baseUrl}/login`;
      const firstName = leaderData.name.split(' ')[0];
      const coachName = session.name || 'Travis';

      try {
        if (status === 'pending_assessment') {
          // Warm personal email from DNA coach with link to public assessment form
          const assessmentUrl = `${baseUrl}/assessment`;
          await sendAssessmentInviteEmail(
            leaderData.email,
            leaderData.name,
            churchData.name,
            assessmentUrl,
            coachName
          );
          console.log('[ADMIN] Sent assessment invite email to', leaderData.email);

        } else if (status === 'proposal_sent') {
          await sendProposalReadyEmail(
            leaderData.email,
            firstName,
            churchData.name,
            portalUrl,
            churchId
          );
          console.log('[ADMIN] Sent proposal ready email to', leaderData.email);

        } else if (status === 'awaiting_strategy') {
          await sendAgreementConfirmedEmail(
            leaderData.email,
            firstName,
            churchData.name,
            tierName || 'DNA Implementation',
            portalUrl,
            churchId
          );
          console.log('[ADMIN] Sent agreement confirmed email to', leaderData.email);

        } else if (status === 'active') {
          // Create Supabase Auth account now if it doesn't exist yet.
          // (Churches that came through the self-serve assessment already have one —
          //  the createUser call is idempotent and silently ignores duplicates.)
          const { error: authCreateError } = await supabase.auth.admin.createUser({
            email: leaderData.email,
            email_confirm: true,
            user_metadata: { name: leaderData.name, signup_source: 'status_activated' },
          });
          if (authCreateError &&
              !authCreateError.message?.includes('already been registered') &&
              !authCreateError.message?.includes('already exists')) {
            console.error('[ADMIN] Auth account creation error on activate:', authCreateError.message);
          }

          // Dashboard access email — includes login instructions
          await sendDashboardAccessEmail(
            leaderData.email,
            firstName,
            churchData.name,
            dashboardUrl,
            churchId
          );
          // Also send the "Set Up My Account" email so they know how to log in
          await sendChurchLeaderInviteEmail(
            leaderData.email,
            leaderData.name,
            loginUrl,
            churchData.name,
            coachName
          );
          console.log('[ADMIN] Sent dashboard access + login setup emails to', leaderData.email);
        }
      } catch (emailError) {
        console.error('[ADMIN] Email send error:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBulkUpdate(supabase: any, session: any, body: any) {
  const { churchIds, action, status, sendEmail = false } = body;

  if (!churchIds.length) {
    return NextResponse.json({ error: 'No churches selected' }, { status: 400 });
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Get church data for all selected churches
  const { data: churches } = await supabase
    .from('churches')
    .select('id, name, status')
    .in('id', churchIds);

  // Get leader data for email notifications
  const { data: leaders } = await supabase
    .from('church_leaders')
    .select('church_id, name, email')
    .in('church_id', churchIds)
    .eq('is_primary_contact', true);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dnadiscipleship.com';
  const portalUrl = `${baseUrl}/portal`;
  const dashboardUrl = `${baseUrl}/dashboard`;

  for (const churchId of churchIds) {
    try {
      const church = churches?.find((c: { id: string }) => c.id === churchId);
      const leader = leaders?.find((l: { church_id: string }) => l.church_id === churchId);

      if (!church) {
        results.failed++;
        results.errors.push(`Church ${churchId} not found`);
        continue;
      }

      if (action === 'status_change' && status) {
        // Update church status
        const { error: updateError } = await supabase
          .from('churches')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', churchId);

        if (updateError) {
          results.failed++;
          results.errors.push(`Failed to update ${church.name}`);
          continue;
        }

        // Log the status change
        if (status !== church.status) {
          await logStatusChange(
            session.email,
            churchId,
            church.status,
            status,
            church.name
          );
        }

        // Send emails if requested
        if (sendEmail && leader && status !== church.status) {
          const firstName = leader.name.split(' ')[0];
          try {
            if (status === 'proposal_sent') {
              await sendProposalReadyEmail(leader.email, firstName, church.name, portalUrl, churchId);
            } else if (status === 'active') {
              await sendDashboardAccessEmail(leader.email, firstName, church.name, dashboardUrl, churchId);
            }
          } catch {
            // Log but don't fail
            console.error(`[BULK] Failed to send email to ${leader.email}`);
          }
        }

        results.success++;
      } else if (action === 'send_login') {
        // Send magic link to leader
        if (!leader) {
          results.failed++;
          results.errors.push(`No leader found for ${church.name}`);
          continue;
        }

        // Magic links are sent via the existing endpoint
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`[BULK] Error processing church ${churchId}:`, error);
      results.failed++;
      results.errors.push(`Error processing church ${churchId}`);
    }
  }

  return NextResponse.json({
    success: true,
    results,
  });
}
