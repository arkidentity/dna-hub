import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole } from '@/lib/unified-auth';

// GET /api/groups/invitations
// Returns pending co-leader invitations for the current leader
export async function GET() {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) return NextResponse.json({ invitations: [] });

    const supabase = getSupabaseAdmin();

    // Get current DNA leader
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) return NextResponse.json({ invitations: [] });

    // Get pending invitations where this leader is the invitee
    const { data: invitations } = await supabase
      .from('co_leader_invitations')
      .select(`
        id, token, created_at, expires_at,
        group:dna_groups (id, group_name),
        invited_by:dna_leaders!invited_by_leader_id (id, name, email)
      `)
      .eq('invited_leader_id', dnaLeader.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    return NextResponse.json({ invitations: invitations || [] });

  } catch (error) {
    console.error('[Invitations] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
