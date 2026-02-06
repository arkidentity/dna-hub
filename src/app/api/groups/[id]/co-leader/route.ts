import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole } from '@/lib/unified-auth';

// POST /api/groups/[id]/co-leader
// Set a co-leader for the group (primary leader only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(session, 'dna_leader')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: groupId } = await params;
    const supabase = getSupabaseAdmin();

    // Get current DNA leader
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });

    // Get group and verify primary leader
    const { data: group } = await supabase
      .from('dna_groups')
      .select('id, leader_id, co_leader_id')
      .eq('id', groupId)
      .single();

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.leader_id !== dnaLeader.id) {
      return NextResponse.json({ error: 'Only the primary leader can manage co-leaders' }, { status: 403 });
    }

    if (group.co_leader_id) {
      return NextResponse.json({ error: 'Group already has a co-leader. Remove the current one first.' }, { status: 400 });
    }

    const body = await request.json();
    const { leader_id } = body;

    if (!leader_id) {
      return NextResponse.json({ error: 'leader_id is required' }, { status: 400 });
    }

    if (leader_id === dnaLeader.id) {
      return NextResponse.json({ error: 'Cannot set yourself as co-leader' }, { status: 400 });
    }

    // Verify the co-leader exists and is active
    const { data: coLeader } = await supabase
      .from('dna_leaders')
      .select('id, name, email')
      .eq('id', leader_id)
      .eq('is_active', true)
      .single();

    if (!coLeader) {
      return NextResponse.json({ error: 'Leader not found or not active' }, { status: 404 });
    }

    // Set co-leader
    const { error: updateError } = await supabase
      .from('dna_groups')
      .update({ co_leader_id: leader_id })
      .eq('id', groupId);

    if (updateError) {
      console.error('[Co-Leader] Set error:', updateError);
      return NextResponse.json({ error: 'Failed to set co-leader' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      co_leader: { id: coLeader.id, name: coLeader.name, email: coLeader.email },
    });

  } catch (error) {
    console.error('[Co-Leader] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/groups/[id]/co-leader
// Remove the co-leader from the group (primary leader only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(session, 'dna_leader')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: groupId } = await params;
    const supabase = getSupabaseAdmin();

    // Get current DNA leader
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });

    // Get group and verify primary leader
    const { data: group } = await supabase
      .from('dna_groups')
      .select('id, leader_id, co_leader_id')
      .eq('id', groupId)
      .single();

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.leader_id !== dnaLeader.id) {
      return NextResponse.json({ error: 'Only the primary leader can remove co-leaders' }, { status: 403 });
    }

    if (!group.co_leader_id) {
      return NextResponse.json({ error: 'Group has no co-leader' }, { status: 400 });
    }

    // Remove co-leader
    const { error: updateError } = await supabase
      .from('dna_groups')
      .update({ co_leader_id: null })
      .eq('id', groupId);

    if (updateError) {
      console.error('[Co-Leader] Remove error:', updateError);
      return NextResponse.json({ error: 'Failed to remove co-leader' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Co-Leader] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
