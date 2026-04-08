import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, isChurchLeader } from '@/lib/unified-auth';

// DELETE /api/cohort/training-groups/[id]
// Soft-deletes (deactivates) a training group.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session) && !isChurchLeader(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('dna_groups')
    .update({ is_active: false })
    .eq('id', id)
    .eq('group_type', 'training_cohort');

  if (error) {
    console.error('Training group delete error:', error);
    return NextResponse.json({ error: 'Failed to archive training group' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PUT /api/cohort/training-groups/[id]/members
// Replaces all member assignments for a training group.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(session) && !isChurchLeader(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { leaderId, coLeaderId, discipleIds, groupName } = body as {
    leaderId: string;
    coLeaderId?: string;
    discipleIds?: string[];
    groupName?: string;
  };

  if (!leaderId) {
    return NextResponse.json({ error: 'leaderId required' }, { status: 400 });
  }

  const disciples = (discipleIds || []).slice(0, 4);
  const supabase = getSupabaseAdmin();

  // Update group record
  const updates: Record<string, unknown> = {
    leader_id: leaderId,
    co_leader_id: coLeaderId || null,
  };
  if (groupName?.trim()) updates.group_name = groupName.trim();

  const { error: updateError } = await supabase
    .from('dna_groups')
    .update(updates)
    .eq('id', id)
    .eq('group_type', 'training_cohort');

  if (updateError) {
    console.error('Training group update error:', updateError);
    return NextResponse.json({ error: 'Failed to update training group' }, { status: 500 });
  }

  // Replace all training_group_members rows
  await supabase.from('training_group_members').delete().eq('group_id', id);

  const memberRows: Array<{ group_id: string; leader_id: string; role: string }> = [
    { group_id: id, leader_id: leaderId, role: 'leader' },
  ];
  if (coLeaderId) {
    memberRows.push({ group_id: id, leader_id: coLeaderId, role: 'co_leader' });
  }
  for (const did of disciples) {
    if (did && did !== leaderId && did !== coLeaderId) {
      memberRows.push({ group_id: id, leader_id: did, role: 'disciple' });
    }
  }

  const { error: membersError } = await supabase
    .from('training_group_members')
    .insert(memberRows);

  if (membersError) {
    console.error('Training group members update error:', membersError);
    return NextResponse.json({ error: 'Failed to update members' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
