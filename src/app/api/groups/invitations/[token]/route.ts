import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession } from '@/lib/unified-auth';

// GET /api/groups/invitations/[token]
// Returns invitation details (for the accept/decline page)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = getSupabaseAdmin();

    const { data: invitation, error } = await supabase
      .from('co_leader_invitations')
      .select(`
        id, status, expires_at,
        group:dna_groups (id, group_name),
        invited_leader:dna_leaders!invited_leader_id (id, name, email),
        invited_by:dna_leaders!invited_by_leader_id (id, name, email)
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation is no longer active', status: invitation.status }, { status: 410 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('co_leader_invitations')
        .update({ status: 'expired' })
        .eq('token', token);
      return NextResponse.json({ error: 'Invitation has expired', status: 'expired' }, { status: 410 });
    }

    return NextResponse.json({ invitation });

  } catch (error) {
    console.error('[Invitation] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/groups/invitations/[token]
// Accept or decline the invitation (body: { action: 'accept' | 'decline' })
// The invited leader must be logged in and their email must match.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', requiresLogin: true }, { status: 401 });
    }

    const { token } = await params;
    const { action } = await request.json();

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ error: 'action must be accept or decline' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Load invitation with related data
    const { data: invitation, error } = await supabase
      .from('co_leader_invitations')
      .select(`
        id, group_id, status, expires_at,
        invited_leader:dna_leaders!invited_leader_id (id, email)
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation is no longer active', status: invitation.status }, { status: 410 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await supabase.from('co_leader_invitations').update({ status: 'expired' }).eq('token', token);
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Verify the logged-in user is the invited leader
    const invitedLeader = Array.isArray(invitation.invited_leader)
      ? invitation.invited_leader[0]
      : invitation.invited_leader;

    if (!invitedLeader || invitedLeader.email.toLowerCase() !== session.email.toLowerCase()) {
      return NextResponse.json({ error: 'This invitation is not for your account' }, { status: 403 });
    }

    // Update invitation status
    await supabase
      .from('co_leader_invitations')
      .update({ status: action === 'accept' ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
      .eq('token', token);

    if (action === 'accept') {
      // Set as active co-leader and clear pending state
      await supabase
        .from('dna_groups')
        .update({
          co_leader_id: invitedLeader.id,
          pending_co_leader_id: null,
          co_leader_invited_at: null,
        })
        .eq('id', invitation.group_id);
    } else {
      // Clear pending state
      await supabase
        .from('dna_groups')
        .update({ pending_co_leader_id: null, co_leader_invited_at: null })
        .eq('id', invitation.group_id);
    }

    return NextResponse.json({ success: true, action });

  } catch (error) {
    console.error('[Invitation] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
