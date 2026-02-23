import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, hasRole } from '@/lib/unified-auth';
import { sendCoLeaderInvitationEmail, sendCoLeaderNewUserInviteEmail } from '@/lib/email';

// POST /api/groups/[id]/co-leader
// Send an invitation to a potential co-leader (primary leader only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: groupId } = await params;
    const supabase = getSupabaseAdmin();

    // Get current DNA leader
    const { data: dnaLeader } = await supabase
      .from('dna_leaders')
      .select('id, name, email')
      .eq('email', session.email)
      .single();

    if (!dnaLeader) return NextResponse.json({ error: 'DNA leader not found' }, { status: 404 });

    // Get group and verify primary leader
    const { data: group } = await supabase
      .from('dna_groups')
      .select('id, group_name, leader_id, co_leader_id, pending_co_leader_id')
      .eq('id', groupId)
      .single();

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.leader_id !== dnaLeader.id) {
      return NextResponse.json({ error: 'Only the primary leader can manage co-leaders' }, { status: 403 });
    }

    if (group.co_leader_id) {
      return NextResponse.json({ error: 'Group already has a co-leader. Remove the current one first.' }, { status: 400 });
    }

    if (group.pending_co_leader_id) {
      return NextResponse.json({ error: 'A co-leader invitation is already pending. Cancel it first.' }, { status: 400 });
    }

    const body = await request.json();
    const { leader_id, name: inviteName, email: inviteEmail } = body;

    // --- PATH A: invite by email (new or unactivated person) ---
    if (!leader_id && inviteEmail) {
      const emailLower = inviteEmail.trim().toLowerCase();
      const nameTrimmed = (inviteName || '').trim();

      if (!nameTrimmed) {
        return NextResponse.json({ error: 'Name is required when inviting by email' }, { status: 400 });
      }

      if (emailLower === dnaLeader.email.toLowerCase()) {
        return NextResponse.json({ error: 'Cannot invite yourself as co-leader' }, { status: 400 });
      }

      // Look up existing dna_leaders record
      const { data: existingLeader } = await supabase
        .from('dna_leaders')
        .select('id, name, email, is_active, activated_at, signup_token')
        .eq('email', emailLower)
        .maybeSingle();

      let invitedLeaderId: string;
      let signupToken: string;

      if (existingLeader && existingLeader.is_active && existingLeader.activated_at) {
        // Case B: already an active leader — use existing flow
        invitedLeaderId = existingLeader.id;
        signupToken = ''; // not needed for existing leader path

        // Cancel previous pending invitations
        await supabase
          .from('co_leader_invitations')
          .update({ status: 'cancelled' })
          .eq('group_id', groupId)
          .eq('status', 'pending');

        const { data: invitation, error: inviteError } = await supabase
          .from('co_leader_invitations')
          .insert({
            group_id: groupId,
            invited_leader_id: invitedLeaderId,
            invited_by_leader_id: dnaLeader.id,
          })
          .select('id, token')
          .single();

        if (inviteError || !invitation) {
          console.error('[Co-Leader] Invitation create error:', inviteError);
          return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
        }

        await supabase
          .from('dna_groups')
          .update({ pending_co_leader_id: invitedLeaderId, co_leader_invited_at: new Date().toISOString() })
          .eq('id', groupId);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hub.dnadiscipleship.com';
        const invitationUrl = `${baseUrl}/groups/invitations/${invitation.token}`;
        await sendCoLeaderInvitationEmail(
          emailLower,
          existingLeader.name || emailLower,
          group.group_name,
          dnaLeader.name || dnaLeader.email,
          invitationUrl,
          invitationUrl
        );

        return NextResponse.json({
          success: true,
          message: `Invitation sent to ${existingLeader.name || emailLower}`,
          pending_co_leader: { id: invitedLeaderId, name: existingLeader.name, email: emailLower },
        });
      }

      // Case A/C: person doesn't exist yet, or exists but hasn't activated
      const newSignupToken = randomBytes(32).toString('hex');
      const signupExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      if (!existingLeader) {
        // Create users record (idempotent on email)
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', emailLower)
          .maybeSingle();

        let userId: string;
        if (existingUser) {
          userId = existingUser.id;
        } else {
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({ email: emailLower, name: nameTrimmed })
            .select('id')
            .single();
          if (userError || !newUser) {
            console.error('[Co-Leader] User create error:', userError);
            return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
          }
          userId = newUser.id;
        }

        // Assign dna_leader role (idempotent)
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', 'dna_leader')
          .maybeSingle();

        if (!existingRole) {
          await supabase.from('user_roles').insert({ user_id: userId, role: 'dna_leader' });
          await supabase.from('user_roles').insert({ user_id: userId, role: 'training_participant' });
        }

        // Create dna_leaders record
        const { data: newLeader, error: leaderError } = await supabase
          .from('dna_leaders')
          .insert({
            email: emailLower,
            name: nameTrimmed,
            user_id: userId,
            invited_by: dnaLeader.id,
            invited_by_type: 'dna_leader',
            invited_at: new Date().toISOString(),
            signup_token: newSignupToken,
            signup_token_expires_at: signupExpires,
            is_active: true,
          })
          .select('id')
          .single();

        if (leaderError || !newLeader) {
          console.error('[Co-Leader] Leader create error:', leaderError);
          return NextResponse.json({ error: 'Failed to create leader record' }, { status: 500 });
        }

        invitedLeaderId = newLeader.id;
        signupToken = newSignupToken;
      } else {
        // Case C: exists but not activated — refresh signup token
        invitedLeaderId = existingLeader.id;
        await supabase
          .from('dna_leaders')
          .update({ signup_token: newSignupToken, signup_token_expires_at: signupExpires, name: nameTrimmed })
          .eq('id', invitedLeaderId);
        signupToken = newSignupToken;
      }

      // Cancel previous pending invitations
      await supabase
        .from('co_leader_invitations')
        .update({ status: 'cancelled' })
        .eq('group_id', groupId)
        .eq('status', 'pending');

      // Create co-leader invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('co_leader_invitations')
        .insert({
          group_id: groupId,
          invited_leader_id: invitedLeaderId,
          invited_by_leader_id: dnaLeader.id,
        })
        .select('id, token')
        .single();

      if (inviteError || !invitation) {
        console.error('[Co-Leader] Invitation create error:', inviteError);
        return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
      }

      await supabase
        .from('dna_groups')
        .update({ pending_co_leader_id: invitedLeaderId, co_leader_invited_at: new Date().toISOString() })
        .eq('id', groupId);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hub.dnadiscipleship.com';
      const signupUrl = `${baseUrl}/groups/signup?token=${signupToken}&co_leader_token=${invitation.token}`;
      const existingAccountUrl = `${baseUrl}/groups/invitations/${invitation.token}`;

      await sendCoLeaderNewUserInviteEmail(
        emailLower,
        nameTrimmed,
        group.group_name,
        dnaLeader.name || dnaLeader.email,
        signupUrl,
        existingAccountUrl
      );

      return NextResponse.json({
        success: true,
        message: `Invitation sent to ${nameTrimmed} (${emailLower})`,
        pending_co_leader: { id: invitedLeaderId, name: nameTrimmed, email: emailLower },
      });
    }

    // --- PATH B: existing flow — invite by leader_id ---
    if (!leader_id) {
      return NextResponse.json({ error: 'leader_id or email is required' }, { status: 400 });
    }

    if (leader_id === dnaLeader.id) {
      return NextResponse.json({ error: 'Cannot invite yourself as co-leader' }, { status: 400 });
    }

    // Verify the invited leader exists and is active
    const { data: invitedLeader } = await supabase
      .from('dna_leaders')
      .select('id, name, email')
      .eq('id', leader_id)
      .eq('is_active', true)
      .single();

    if (!invitedLeader) {
      return NextResponse.json({ error: 'Leader not found or not active' }, { status: 404 });
    }

    // Cancel any previous pending invitations for this group
    await supabase
      .from('co_leader_invitations')
      .update({ status: 'cancelled' })
      .eq('group_id', groupId)
      .eq('status', 'pending');

    // Create new invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('co_leader_invitations')
      .insert({
        group_id: groupId,
        invited_leader_id: leader_id,
        invited_by_leader_id: dnaLeader.id,
      })
      .select('id, token')
      .single();

    if (inviteError || !invitation) {
      console.error('[Co-Leader] Invitation create error:', inviteError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Mark pending on the group
    await supabase
      .from('dna_groups')
      .update({
        pending_co_leader_id: leader_id,
        co_leader_invited_at: new Date().toISOString(),
      })
      .eq('id', groupId);

    // Send invitation email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hub.dnadiscipleship.com';
    const invitationUrl = `${baseUrl}/groups/invitations/${invitation.token}`;
    const acceptUrl = invitationUrl;
    const declineUrl = invitationUrl;

    await sendCoLeaderInvitationEmail(
      invitedLeader.email,
      invitedLeader.name || invitedLeader.email,
      group.group_name,
      dnaLeader.name || dnaLeader.email,
      acceptUrl,
      declineUrl
    );

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${invitedLeader.name || invitedLeader.email}`,
      pending_co_leader: { id: invitedLeader.id, name: invitedLeader.name, email: invitedLeader.email },
    });

  } catch (error) {
    console.error('[Co-Leader] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/groups/[id]/co-leader
// Remove or cancel: removes an active co-leader OR cancels a pending invitation (primary leader only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(hasRole(session, 'dna_leader') || hasRole(session, 'church_leader'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
      .select('id, leader_id, co_leader_id, pending_co_leader_id')
      .eq('id', groupId)
      .single();

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.leader_id !== dnaLeader.id) {
      return NextResponse.json({ error: 'Only the primary leader can remove co-leaders' }, { status: 403 });
    }

    if (!group.co_leader_id && !group.pending_co_leader_id) {
      return NextResponse.json({ error: 'Group has no co-leader or pending invitation' }, { status: 400 });
    }

    // Cancel any pending invitations
    await supabase
      .from('co_leader_invitations')
      .update({ status: 'cancelled' })
      .eq('group_id', groupId)
      .eq('status', 'pending');

    // Remove co-leader and pending state
    const { error: updateError } = await supabase
      .from('dna_groups')
      .update({ co_leader_id: null, pending_co_leader_id: null, co_leader_invited_at: null })
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
