import { NextRequest, NextResponse } from 'next/server';
import { getDNALeaderSession, getSupabaseAdmin } from '@/lib/auth';

// GET /api/groups/[id]
// Get a single group with its disciples
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getDNALeaderSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;
    const supabase = getSupabaseAdmin();
    const leaderId = session.leader.id;

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

    // Get disciples in this group
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
          phone
        )
      `)
      .eq('group_id', groupId)
      .order('joined_date', { ascending: true });

    if (disciplesError) {
      console.error('[Groups] Disciples fetch error:', disciplesError);
    }

    // Get assessment status for each disciple
    const discipleIds = (groupDisciples || [])
      .filter(gd => gd.disciple)
      .map(gd => (gd.disciple as unknown as { id: string }).id);

    let assessmentsMap: Record<string, { week1?: string; week8?: string }> = {};

    if (discipleIds.length > 0) {
      const { data: assessments } = await supabase
        .from('life_assessments')
        .select('disciple_id, assessment_week, sent_at, completed_at')
        .eq('group_id', groupId)
        .in('disciple_id', discipleIds);

      if (assessments) {
        assessments.forEach(a => {
          if (!assessmentsMap[a.disciple_id]) {
            assessmentsMap[a.disciple_id] = {};
          }
          const status = a.completed_at ? 'completed' : a.sent_at ? 'sent' : 'not_sent';
          if (a.assessment_week === 1) {
            assessmentsMap[a.disciple_id].week1 = status;
          } else if (a.assessment_week === 8) {
            assessmentsMap[a.disciple_id].week8 = status;
          }
        });
      }
    }

    // Format disciples with assessment status
    const disciples = (groupDisciples || [])
      .filter(gd => gd.disciple)
      .map(gd => {
        const disciple = gd.disciple as unknown as { id: string; name: string; email: string; phone?: string };
        return {
          id: disciple.id,
          name: disciple.name,
          email: disciple.email,
          phone: disciple.phone,
          joined_date: gd.joined_date,
          current_status: gd.current_status,
          week1_assessment_status: assessmentsMap[disciple.id]?.week1 || 'not_sent',
          week8_assessment_status: assessmentsMap[disciple.id]?.week8 || 'not_sent',
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
    const session = await getDNALeaderSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;
    const supabase = getSupabaseAdmin();
    const leaderId = session.leader.id;

    // Verify ownership
    const { data: group } = await supabase
      .from('dna_groups')
      .select('leader_id, co_leader_id')
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
