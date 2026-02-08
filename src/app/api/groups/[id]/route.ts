import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole } from '@/lib/unified-auth';

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
    if (!hasRole(session, 'dna_leader')) {
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
        created_at
      `)
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify the current user is the leader or co-leader
    if (group.leader_id !== leaderId && group.co_leader_id !== leaderId) {
      return NextResponse.json({ error: 'Not authorized to view this group' }, { status: 403 });
    }

    // Get leader info
    const { data: leader } = await supabase
      .from('dna_leaders')
      .select('id, name')
      .eq('id', group.leader_id)
      .single();

    // Get co-leader info if exists
    let coLeader = null;
    if (group.co_leader_id) {
      const { data: coLeaderData } = await supabase
        .from('dna_leaders')
        .select('id, name')
        .eq('id', group.co_leader_id)
        .single();
      coLeader = coLeaderData;
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

    let assessmentsMap: Record<string, { week1?: string; week12?: string }> = {};
    let appStatsMap: Record<string, { current_streak: number; last_activity_date: string | null }> = {};

    if (discipleIds.length > 0) {
      // Fetch assessments and app stats in parallel
      const [assessmentsResult, appStatsResult] = await Promise.all([
        supabase
          .from('life_assessments')
          .select('disciple_id, assessment_week, sent_at, completed_at')
          .eq('group_id', groupId)
          .in('disciple_id', discipleIds),
        appAccountIds.length > 0
          ? supabase
              .from('disciple_progress')
              .select('account_id, current_streak, last_activity_date')
              .in('account_id', appAccountIds)
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

      if (appStatsResult.data) {
        appStatsResult.data.forEach(s => {
          appStatsMap[s.account_id] = {
            current_streak: s.current_streak,
            last_activity_date: s.last_activity_date,
          };
        });
      }
    }

    // Format disciples with assessment status and app stats
    const disciples = filteredDisciples.map(gd => {
      const disciple = gd.disciple as unknown as { id: string; name: string; email: string; phone?: string; app_account_id: string | null };
      const appStats = disciple.app_account_id ? appStatsMap[disciple.app_account_id] : null;
      return {
        id: disciple.id,
        name: disciple.name,
        email: disciple.email,
        phone: disciple.phone,
        joined_date: gd.joined_date,
        current_status: gd.current_status,
        week1_assessment_status: assessmentsMap[disciple.id]?.week1 || 'not_sent',
        week12_assessment_status: assessmentsMap[disciple.id]?.week12 || 'not_sent',
        app_connected: !!disciple.app_account_id,
        current_streak: appStats?.current_streak ?? null,
        last_activity_date: appStats?.last_activity_date ?? null,
      };
    });

    return NextResponse.json({
      group: {
        id: group.id,
        group_name: group.group_name,
        current_phase: group.current_phase,
        start_date: group.start_date,
        multiplication_target_date: group.multiplication_target_date,
        is_active: group.is_active,
        leader,
        co_leader: coLeader,
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
    if (!hasRole(session, 'dna_leader')) {
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
    const allowedFields = ['group_name', 'current_phase', 'multiplication_target_date', 'is_active'];
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
