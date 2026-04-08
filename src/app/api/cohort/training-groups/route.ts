import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, isChurchLeader } from '@/lib/unified-auth';

// GET /api/cohort/training-groups?cohortId=xxx
// Returns training groups for a cohort + cohort members for dropdowns.
export async function GET(request: NextRequest) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session) && !isChurchLeader(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const cohortId = searchParams.get('cohortId');
  if (!cohortId) return NextResponse.json({ error: 'cohortId required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const [groupsRes, membersRes] = await Promise.all([
    // Training groups for this cohort with their members
    supabase
      .from('dna_groups')
      .select('id, group_name, current_phase, start_date, leader_id, co_leader_id')
      .eq('cohort_id', cohortId)
      .eq('group_type', 'training_cohort')
      .eq('is_active', true)
      .order('created_at', { ascending: true }),

    // All cohort members (non-exempt) with their dna_leaders.id for dropdowns
    supabase
      .from('dna_cohort_members')
      .select('id, role, joined_at, leader:dna_leaders(id, name, email)')
      .eq('cohort_id', cohortId)
      .eq('cohort_exempt', false)
      .order('joined_at', { ascending: true }),
  ]);

  if (groupsRes.error) {
    console.error('Training groups fetch error:', groupsRes.error);
    return NextResponse.json({ error: 'Failed to fetch training groups' }, { status: 500 });
  }

  const groups = groupsRes.data || [];

  // Fetch training_group_members for all groups
  let groupMembers: Array<{ group_id: string; leader_id: string; role: string; leader_name: string }> = [];
  if (groups.length > 0) {
    const groupIds = groups.map((g) => g.id);
    const { data: tgmRows } = await supabase
      .from('training_group_members')
      .select('group_id, leader_id, role, leader:dna_leaders(name)')
      .in('group_id', groupIds)
      .order('group_id')
      .order('role');

    groupMembers = (tgmRows || []).map((row) => ({
      group_id: row.group_id,
      leader_id: row.leader_id,
      role: row.role,
      leader_name: (row.leader as unknown as { name: string } | null)?.name || 'Unknown',
    }));
  }

  const trainingGroups = groups.map((g) => ({
    id: g.id,
    groupName: g.group_name,
    currentPhase: g.current_phase,
    startDate: g.start_date,
    members: groupMembers.filter((m) => m.group_id === g.id),
  }));

  const cohortMembers = (membersRes.data || []).map((m) => {
    const leader = m.leader as unknown as { id: string; name: string; email: string } | null;
    return {
      leaderId: leader?.id || '',
      name: leader?.name || 'Unknown',
      email: leader?.email || '',
      cohortRole: m.role,
    };
  }).filter((m) => m.leaderId);

  return NextResponse.json({ trainingGroups, cohortMembers });
}

// POST /api/cohort/training-groups
// Creates a training group and assigns members.
export async function POST(request: NextRequest) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session) && !isChurchLeader(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { cohortId, groupName, leaderId, coLeaderId, discipleIds } = body as {
    cohortId: string;
    groupName: string;
    leaderId: string;
    coLeaderId?: string;
    discipleIds?: string[];
  };

  if (!cohortId || !groupName?.trim() || !leaderId) {
    return NextResponse.json({ error: 'cohortId, groupName, and leaderId are required' }, { status: 400 });
  }

  const disciples = (discipleIds || []).slice(0, 4);

  const supabase = getSupabaseAdmin();

  // Create the dna_groups record
  const { data: group, error: groupError } = await supabase
    .from('dna_groups')
    .insert({
      group_name: groupName.trim(),
      leader_id: leaderId,
      co_leader_id: coLeaderId || null,
      cohort_id: cohortId,
      group_type: 'training_cohort',
      current_phase: 'foundation',
      is_active: true,
    })
    .select('id')
    .single();

  if (groupError || !group) {
    console.error('Training group create error:', groupError);
    return NextResponse.json({ error: 'Failed to create training group' }, { status: 500 });
  }

  // Build training_group_members rows — leader + co_leader + disciples
  const memberRows: Array<{ group_id: string; leader_id: string; role: string }> = [
    { group_id: group.id, leader_id: leaderId, role: 'leader' },
  ];
  if (coLeaderId) {
    memberRows.push({ group_id: group.id, leader_id: coLeaderId, role: 'co_leader' });
  }
  for (const did of disciples) {
    if (did && did !== leaderId && did !== coLeaderId) {
      memberRows.push({ group_id: group.id, leader_id: did, role: 'disciple' });
    }
  }

  const { error: membersError } = await supabase
    .from('training_group_members')
    .insert(memberRows);

  if (membersError) {
    console.error('Training group members insert error:', membersError);
    // Roll back the group
    await supabase.from('dna_groups').delete().eq('id', group.id);
    return NextResponse.json({ error: 'Failed to assign members' }, { status: 500 });
  }

  return NextResponse.json({ id: group.id }, { status: 201 });
}
