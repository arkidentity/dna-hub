import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole, isAdmin } from '@/lib/unified-auth';

// GET /api/groups/[id]
// Get a single group with its disciples
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a DNA leader
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) {
      return NextResponse.json(
        { error: 'Forbidden - DNA leader access required' },
        { status: 403 }
      );
    }

    const { id: groupId } = await params;
    const supabase = getSupabaseAdmin();

    // Get DNA leader record
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) {
      return NextResponse.json(
        { error: 'DNA leader not found' },
        { status: 404 }
      );
    }

    const leaderId = dnaLeader.id;

    // Get the group
    const { data: group, error: groupError } = await supabase
      .from('dna_groups')
      .select(`
        id,
        group_name,
        current_phase,
        start_date,
        multiplication_target_date,
        is_active,
        leader_id,
        co_leader_id,
        pending_co_leader_id,
        co_leader_invited_at,
        created_at
      `)
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('[Groups] Group query error:', groupError);
      return NextResponse.json({ error: 'Failed to load group' }, { status: 500 });
    }

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify the current user is the leader or co-leader
    if (group.leader_id !== leaderId && group.co_leader_id !== leaderId) {
      console.error('[Groups] Auth mismatch — group.leader_id:', group.leader_id, 'group.co_leader_id:', group.co_leader_id, 'leaderId:', leaderId);
      return NextResponse.json({ error: 'Not authorized to view this group' }, { status: 403 });
    }

    // Get leader info
    const { data: leader } = await supabase
      .from('dna_leaders')
      .select('id, name, email')
      .eq('id', group.leader_id)
      .single();

    // Get co-leader info if exists
    let coLeader: { id: string; name: string; email: string } | null = null;
    if (group.co_leader_id) {
      const { data: coLeaderData } = await supabase
        .from('dna_leaders')
        .select('id, name, email')
        .eq('id', group.co_leader_id)
        .single();
      coLeader = coLeaderData;
    }

    // Get pending co-leader info if exists
    let pendingCoLeader = null;
    if (group.pending_co_leader_id) {
      const { data: pendingData } = await supabase
        .from('dna_leaders')
        .select('id, name, email')
        .eq('id', group.pending_co_leader_id)
        .single();
      pendingCoLeader = pendingData;
    }

    // Get disciples in this group (include app_account_id for app connection status)
    const { data: groupDisciples, error: disciplesError } = await supabase
      .from('group_disciples')
      .select(`
        id,
        joined_date,
        current_status,
        disciple:disciples(
          id,
          name,
          email,
          phone,
          app_account_id
        )
      `)
      .eq('group_id', groupId)
      .order('joined_date', { ascending: true });

    if (disciplesError) {
      console.error('[Groups] Disciples fetch error:', disciplesError);
    }

    // Get assessment status and app stats for each disciple
    const filteredDisciples = (groupDisciples || []).filter(gd => gd.disciple);
    const discipleIds = filteredDisciples.map(gd => (gd.disciple as unknown as { id: string }).id);

    // Collect app account IDs for connected disciples
    const appAccountIds = filteredDisciples
      .map(gd => (gd.disciple as unknown as { app_account_id: string | null }).app_account_id)
      .filter((id): id is string => id !== null);

    // Fallback: for disciples with no app_account_id, look up by email in disciple_app_accounts.
    // This mirrors the healing logic in the disciple profile route and covers cases where
    // the auto_link trigger didn't fire (e.g. existing disciples added to a new group).
    const unlinkedDisciples = filteredDisciples.filter(
      gd => (gd.disciple as unknown as { app_account_id: string | null }).app_account_id === null
    );
    let emailToAccountId: Record<string, string> = {};
    if (unlinkedDisciples.length > 0) {
      // Look up each unlinked disciple individually using .ilike() — the same
      // proven approach the disciple profile route uses. Running in parallel
      // keeps it fast. This avoids .or() filter syntax issues with @ in emails.
      const lookupResults = await Promise.all(
        unlinkedDisciples.map(async gd => {
          const email = (gd.disciple as unknown as { email: string }).email;
          if (!email) return null;
          const { data } = await supabase
            .from('disciple_app_accounts')
            .select('id, email')
            .ilike('email', email)
            .maybeSingle();
          return data as { id: string; email: string } | null;
        })
      );

      const foundAccounts = lookupResults.filter((a): a is { id: string; email: string } => a !== null);

      foundAccounts.forEach(acc => {
        emailToAccountId[acc.email.toLowerCase()] = acc.id;
        if (!appAccountIds.includes(acc.id)) appAccountIds.push(acc.id);
      });

      // Heal the links so subsequent loads don't need this fallback (fire-and-forget)
      if (foundAccounts.length > 0) {
        void (async () => {
          for (const acc of foundAccounts) {
            const gd = unlinkedDisciples.find(
              x => (x.disciple as unknown as { email: string }).email?.toLowerCase() === acc.email?.toLowerCase()
            );
            if (gd) {
              const d = gd.disciple as unknown as { id: string };
              await supabase.from('disciples').update({ app_account_id: acc.id }).eq('id', d.id).is('app_account_id', null);
              await supabase.from('disciple_app_accounts').update({ disciple_id: d.id }).eq('id', acc.id).is('disciple_id', null);
            }
          }
        })();
      }
    }

    let assessmentsMap: Record<string, { week1?: string; week12?: string }> = {};
    let assessmentScoresMap: Record<string, { week1_score?: number | null; week12_score?: number | null }> = {};
    let appStatsMap: Record<string, { current_streak: number; last_activity_date: string | null; total_journal_entries: number; total_prayer_sessions: number; total_prayer_cards: number }> = {};
    let creedMasteredMap: Record<string, number> = {};

    if (discipleIds.length > 0) {
      // Unified stats via get_user_stats RPC — replaces disciple_progress +
      // disciple_creed_progress + live journal/prayer count queries.
      const [assessmentsResult, userStatsResult, assessmentScoresResult] = await Promise.all([
        supabase
          .from('life_assessments')
          .select('disciple_id, assessment_week, sent_at, completed_at')
          .eq('group_id', groupId)
          .in('disciple_id', discipleIds),
        appAccountIds.length > 0
          ? supabase.rpc('get_user_stats', { p_account_ids: appAccountIds })
          : Promise.resolve({ data: null }),
        // Life assessment scores (synced from Daily DNA app)
        appAccountIds.length > 0
          ? supabase
              .from('life_assessment_responses')
              .select('account_id, assessment_type, overall_score')
              .in('account_id', appAccountIds)
              .eq('status', 'submitted')
          : Promise.resolve({ data: null }),
      ]);

      if (assessmentsResult.data) {
        assessmentsResult.data.forEach(a => {
          if (!assessmentsMap[a.disciple_id]) {
            assessmentsMap[a.disciple_id] = {};
          }
          const status = a.completed_at ? 'completed' : a.sent_at ? 'sent' : 'not_sent';
          if (a.assessment_week === 1) {
            assessmentsMap[a.disciple_id].week1 = status;
          } else if (a.assessment_week === 12) {
            assessmentsMap[a.disciple_id].week12 = status;
          }
        });
      }

      if (userStatsResult.data) {
        (userStatsResult.data as Array<{
          account_id: string;
          current_streak: number | null;
          last_activity_date: string | null;
          journal_count: number | string;
          prayer_count: number | string;
          prayer_sessions_count: number | null;
          cards_mastered_count: number | null;
        }>).forEach(s => {
          appStatsMap[s.account_id] = {
            current_streak: s.current_streak ?? 0,
            last_activity_date: s.last_activity_date,
            total_journal_entries: Number(s.journal_count) || 0,
            total_prayer_sessions: s.prayer_sessions_count ?? 0,
            total_prayer_cards: Number(s.prayer_count) || 0,
          };
          creedMasteredMap[s.account_id] = s.cards_mastered_count ?? 0;
        });
      }

      // Map assessment scores by account_id → disciple_id
      if (assessmentScoresResult.data) {
        // Build account→disciple lookup
        const accountToDisciple: Record<string, string> = {};
        filteredDisciples.forEach(gd => {
          const d = gd.disciple as unknown as { id: string; email: string; app_account_id: string | null };
          const effectiveId = d.app_account_id ?? emailToAccountId[d.email?.toLowerCase() ?? ''] ?? null;
          if (effectiveId) accountToDisciple[effectiveId] = d.id;
        });
        (assessmentScoresResult.data as Array<{ account_id: string; assessment_type: string; overall_score: number | null }>).forEach(r => {
          const discipleId = accountToDisciple[r.account_id];
          if (!discipleId) return;
          if (!assessmentScoresMap[discipleId]) assessmentScoresMap[discipleId] = {};
          if (r.assessment_type === 'week_1') assessmentScoresMap[discipleId].week1_score = r.overall_score;
          if (r.assessment_type === 'week_12') assessmentScoresMap[discipleId].week12_score = r.overall_score;
        });
      }
    }

    // Format disciples with assessment status and app stats
    const disciples = filteredDisciples.map(gd => {
      const disciple = gd.disciple as unknown as { id: string; name: string; email: string; phone?: string; app_account_id: string | null };
      // Use direct link or email-fallback account ID
      const effectiveAccountId = disciple.app_account_id ?? emailToAccountId[disciple.email?.toLowerCase() ?? ''] ?? null;
      const appStats = effectiveAccountId ? appStatsMap[effectiveAccountId] : null;
      const creedCount = effectiveAccountId ? (creedMasteredMap[effectiveAccountId] || 0) : 0;
      return {
        id: disciple.id,
        name: disciple.name,
        email: disciple.email,
        phone: disciple.phone,
        joined_date: gd.joined_date,
        current_status: gd.current_status,
        week1_assessment_status: assessmentsMap[disciple.id]?.week1 || 'not_sent',
        week1_assessment_score: assessmentScoresMap[disciple.id]?.week1_score ?? null,
        week12_assessment_status: assessmentsMap[disciple.id]?.week12 || 'not_sent',
        week12_assessment_score: assessmentScoresMap[disciple.id]?.week12_score ?? null,
        app_connected: !!effectiveAccountId,
        current_streak: appStats?.current_streak ?? null,
        last_activity_date: appStats?.last_activity_date ?? null,
        total_journal_entries: appStats?.total_journal_entries ?? 0,
        total_prayer_cards: appStats?.total_prayer_cards ?? 0,
        creed_cards_mastered: creedCount,
      };
    });

    // Fetch leader & co-leader app stats for transparency
    const leaderEmails = [leader?.email, coLeader?.email].filter((e): e is string => !!e);
    let leaderStatsMap: Record<string, { current_streak: number; total_journal_entries: number; total_prayer_cards: number; creed_cards_mastered: number }> = {};
    if (leaderEmails.length > 0) {
      // Look up their app accounts by email
      const leaderAccountResults = await Promise.all(
        leaderEmails.map(async email => {
          const { data } = await supabase
            .from('disciple_app_accounts')
            .select('id, email')
            .ilike('email', email)
            .maybeSingle();
          return data as { id: string; email: string } | null;
        })
      );
      const leaderAccountIds = leaderAccountResults.filter((a): a is { id: string; email: string } => a !== null);
      if (leaderAccountIds.length > 0) {
        const ids = leaderAccountIds.map(a => a.id);
        const [lProgress, lCreed, lJournals, lPrayer] = await Promise.all([
          supabase.from('disciple_progress').select('account_id, current_streak').in('account_id', ids),
          supabase.from('disciple_creed_progress').select('account_id, cards_mastered').in('account_id', ids),
          supabase.from('disciple_journal_entries').select('account_id').in('account_id', ids).is('deleted_at', null),
          supabase.from('disciple_prayer_cards').select('account_id').in('account_id', ids).is('deleted_at', null),
        ]);
        // Build per-email stats
        const emailToId: Record<string, string> = {};
        leaderAccountIds.forEach(a => { emailToId[a.email.toLowerCase()] = a.id; });
        const streakMap: Record<string, number> = {};
        (lProgress.data || []).forEach((p: { account_id: string; current_streak: number }) => { streakMap[p.account_id] = p.current_streak; });
        const creedMap: Record<string, number> = {};
        (lCreed.data || []).forEach((c: { account_id: string; cards_mastered: number[] | null }) => { creedMap[c.account_id] = (c.cards_mastered || []).length; });
        const journalMap: Record<string, number> = {};
        (lJournals.data || []).forEach((j: { account_id: string }) => { journalMap[j.account_id] = (journalMap[j.account_id] || 0) + 1; });
        const prayerMap: Record<string, number> = {};
        (lPrayer.data || []).forEach((p: { account_id: string }) => { prayerMap[p.account_id] = (prayerMap[p.account_id] || 0) + 1; });
        for (const email of leaderEmails) {
          const accId = emailToId[email.toLowerCase()];
          if (accId) {
            leaderStatsMap[email.toLowerCase()] = {
              current_streak: streakMap[accId] ?? 0,
              total_journal_entries: journalMap[accId] ?? 0,
              total_prayer_cards: prayerMap[accId] ?? 0,
              creed_cards_mastered: creedMap[accId] ?? 0,
            };
          }
        }
      }
    }

    const leaderWithStats = leader ? {
      ...leader,
      app_stats: leaderStatsMap[leader.email?.toLowerCase()] ?? null,
    } : null;
    const coLeaderWithStats = coLeader ? {
      ...coLeader,
      app_stats: leaderStatsMap[coLeader.email?.toLowerCase()] ?? null,
    } : null;

    return NextResponse.json({
      group: {
        id: group.id,
        group_name: group.group_name,
        current_phase: group.current_phase,
        start_date: group.start_date,
        multiplication_target_date: group.multiplication_target_date,
        is_active: group.is_active,
        leader: leaderWithStats,
        co_leader: coLeaderWithStats,
        pending_co_leader: pendingCoLeader,
        co_leader_invited_at: group.co_leader_invited_at || null,
        disciples,
      },
    });

  } catch (error) {
    console.error('[Groups] Get error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[id]
// Update a group
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a DNA leader
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) {
      return NextResponse.json(
        { error: 'Forbidden - DNA leader access required' },
        { status: 403 }
      );
    }

    const { id: groupId } = await params;
    const supabase = getSupabaseAdmin();

    // Get DNA leader record
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) {
      return NextResponse.json(
        { error: 'DNA leader not found' },
        { status: 404 }
      );
    }

    const leaderId = dnaLeader.id;

    // Verify ownership
    const { data: group } = await supabase
      .from('dna_groups')
      .select('leader_id, co_leader_id, current_phase')
      .eq('id', groupId)
      .single();

    if (!group || (group.leader_id !== leaderId && group.co_leader_id !== leaderId)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = ['group_name', 'current_phase', 'start_date', 'multiplication_target_date', 'is_active'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Phase advancement validation
    if (updates.current_phase) {
      const phaseOrder = ['pre-launch', 'invitation', 'foundation', 'growth', 'multiplication'];
      const currentIndex = phaseOrder.indexOf(group.current_phase);
      const newIndex = phaseOrder.indexOf(updates.current_phase as string);

      if (newIndex < 0) {
        return NextResponse.json({ error: 'Invalid phase' }, { status: 400 });
      }

      // Only allow advancing one phase at a time
      if (newIndex > currentIndex + 1) {
        return NextResponse.json({ error: 'Can only advance one phase at a time' }, { status: 400 });
      }

      // Only the primary leader can advance phases
      if (group.leader_id !== leaderId) {
        return NextResponse.json({ error: 'Only the primary leader can advance phases' }, { status: 403 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updatedGroup, error: updateError } = await supabase
      .from('dna_groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();

    if (updateError) {
      console.error('[Groups] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }

    return NextResponse.json({ group: updatedGroup });

  } catch (error) {
    console.error('[Groups] Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]
// Soft-delete a group (set is_active = false). Primary leader only.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader') || isAdmin(session))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: groupId } = await params;
    const supabase = getSupabaseAdmin();

    // Get DNA leader record
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) {
      return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });
    }

    // Verify primary leader ownership (only primary leader can delete)
    const { data: group } = await supabase
      .from('dna_groups')
      .select('leader_id')
      .eq('id', groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.leader_id !== dnaLeader.id && !isAdmin(session)) {
      return NextResponse.json({ error: 'Only the primary leader can delete this group' }, { status: 403 });
    }

    // Soft delete: mark inactive and drop all active disciples
    const { error: updateError } = await supabase
      .from('dna_groups')
      .update({ is_active: false })
      .eq('id', groupId);

    if (updateError) {
      console.error('[Groups] Delete error:', updateError);
      return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
    }

    // Mark all active disciples in this group as dropped
    await supabase
      .from('group_disciples')
      .update({ current_status: 'dropped' })
      .eq('group_id', groupId)
      .eq('current_status', 'active');

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Groups] Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
