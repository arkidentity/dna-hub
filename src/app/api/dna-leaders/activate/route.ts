import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// POST /api/dna-leaders/activate
// Activate a DNA leader account after they complete signup (legacy flow)
// NEW FLOW: Admin invites create user/role upfront, so this is only for legacy invitations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, name, phone } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find and validate the DNA leader
    const { data: leader, error: findError } = await supabase
      .from('dna_leaders')
      .select('id, email, church_id, signup_token_expires_at, activated_at')
      .eq('signup_token', token)
      .single();

    if (findError || !leader) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 404 }
      );
    }

    // Check if already activated
    if (leader.activated_at) {
      return NextResponse.json(
        { error: 'This account has already been activated' },
        { status: 400 }
      );
    }

    // Check if expired
    if (leader.signup_token_expires_at && new Date(leader.signup_token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // =====================================================
    // UNIFIED AUTH: Create user and role records
    // =====================================================

    // 1. Create or find the user in the unified users table
    let userId: string;
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', leader.email)
      .single();

    if (existingUser) {
      userId = existingUser.id;
      // Update name if needed
      await supabase
        .from('users')
        .update({ name: name.trim() })
        .eq('id', userId);
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: leader.email,
          name: name.trim(),
        })
        .select('id')
        .single();

      if (userError) {
        console.error('[DNA Leaders] User creation error:', userError);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }
      userId = newUser.id;
    }

    // 2. Add dna_leader role (if not already present)
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'dna_leader')
      .eq('church_id', leader.church_id)
      .maybeSingle();

    if (!existingRole) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'dna_leader',
          church_id: leader.church_id,
        });

      if (roleError) {
        console.error('[DNA Leaders] Role creation error:', roleError);
        // Continue anyway - the user can still log in
      }
    }

    // 2b. Add training_participant role (DNA leaders need training access)
    const { data: existingTrainingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'training_participant')
      .maybeSingle();

    if (!existingTrainingRole) {
      await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'training_participant',
          church_id: null,
        });
    }

    // 3. Activate the DNA leader record and link to user
    const { error: updateError } = await supabase
      .from('dna_leaders')
      .update({
        name: name.trim(),
        phone: phone?.trim() || null,
        activated_at: new Date().toISOString(),
        signup_token: null, // Clear the token after use
        signup_token_expires_at: null,
        user_id: userId, // Link to unified user
      })
      .eq('id', leader.id);

    if (updateError) {
      console.error('[DNA Leaders] Activation update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to activate account' },
        { status: 500 }
      );
    }

    // 4. Create magic link token for unified session
    const sessionToken = generateToken();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // 7-day expiry

    const { error: tokenError } = await supabase
      .from('magic_link_tokens')
      .insert({
        email: leader.email,
        token: sessionToken,
        expires_at: tokenExpiresAt.toISOString(),
        used: true, // Mark as used immediately (we're creating the session now)
      });

    if (tokenError) {
      console.error('[DNA Leaders] Magic token error:', tokenError);
      // Continue anyway
    }

    // 5. Set unified session cookie (not legacy dna_leader_session)
    const cookieStore = await cookies();

    // Clear any old session cookies
    cookieStore.delete('dna_leader_session');
    cookieStore.delete('church_leader_session');
    cookieStore.delete('training_session');

    // Set new unified session cookie
    cookieStore.set('user_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      leader: {
        id: leader.id,
        email: leader.email,
      },
    });

  } catch (error) {
    console.error('[DNA Leaders] Activate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
