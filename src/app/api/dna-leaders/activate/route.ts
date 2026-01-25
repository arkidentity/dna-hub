import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const DNA_SESSION_COOKIE_NAME = 'dna_leader_session';

// POST /api/dna-leaders/activate
// Activate a DNA leader account after they complete signup
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

    // Activate the leader
    const { error: updateError } = await supabase
      .from('dna_leaders')
      .update({
        name: name.trim(),
        phone: phone?.trim() || null,
        activated_at: new Date().toISOString(),
        signup_token: null, // Clear the token after use
        signup_token_expires_at: null,
      })
      .eq('id', leader.id);

    if (updateError) {
      console.error('[DNA Leaders] Activation update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to activate account' },
        { status: 500 }
      );
    }

    // Create a session for the DNA leader
    const sessionToken = generateToken();
    const cookieStore = await cookies();

    cookieStore.set(DNA_SESSION_COOKIE_NAME, JSON.stringify({
      token: sessionToken,
      leaderId: leader.id,
      churchId: leader.church_id,
      createdAt: Date.now(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
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
