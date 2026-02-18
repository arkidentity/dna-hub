import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole, isAdmin } from '@/lib/unified-auth';

// PATCH /api/cohort/members/[id]
// Promote or demote a cohort member (trainer-only action).
// Body: { role: 'trainer' | 'leader' }
// [id] is the dna_cohort_members row id
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!hasRole(session, 'dna_leader') && !hasRole(session, 'church_leader') && !isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { role } = await req.json();
    if (role !== 'trainer' && role !== 'leader') {
      return NextResponse.json({ error: 'Invalid role. Must be "trainer" or "leader".' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const memberId = params.id; // dna_cohort_members.id

    // Fetch the target member row to get their cohort_id
    const { data: targetMember, error: fetchErr } = await supabase
      .from('dna_cohort_members')
      .select('id, cohort_id, role, leader_id')
      .eq('id', memberId)
      .single();

    if (fetchErr || !targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Verify the caller is a trainer in the same cohort
    const { data: callerLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!callerLeader) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: callerMembership } = await supabase
      .from('dna_cohort_members')
      .select('role')
      .eq('cohort_id', targetMember.cohort_id)
      .eq('leader_id', callerLeader.id)
      .single();

    // Must be a trainer in this cohort (or global admin) to promote/demote
    if (!isAdmin(session) && callerMembership?.role !== 'trainer') {
      return NextResponse.json({ error: 'Only trainers can promote or demote members' }, { status: 403 });
    }

    // Cannot demote yourself (a trainer cannot remove their own trainer status)
    if (callerLeader.id === targetMember.leader_id && role === 'leader') {
      return NextResponse.json({ error: 'You cannot remove your own trainer status' }, { status: 400 });
    }

    // Perform the update
    const { data: updated, error: updateErr } = await supabase
      .from('dna_cohort_members')
      .update({ role })
      .eq('id', memberId)
      .select('id, role')
      .single();

    if (updateErr) {
      console.error('Error updating member role:', updateErr);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    return NextResponse.json({ member: updated });
  } catch (err) {
    console.error('PATCH /api/cohort/members/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
