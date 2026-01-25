import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';

// GET /api/dna-leaders/verify-token?token=xxx
// Verify a signup token and return invitation details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find the DNA leader with this token
    const { data: leader, error } = await supabase
      .from('dna_leaders')
      .select(`
        id,
        email,
        name,
        church_id,
        signup_token_expires_at,
        activated_at,
        church:churches(id, name)
      `)
      .eq('signup_token', token)
      .single();

    if (error || !leader) {
      return NextResponse.json(
        { error: 'Invalid invitation link. Please check your email for the correct link.' },
        { status: 404 }
      );
    }

    // Check if already activated
    if (leader.activated_at) {
      return NextResponse.json(
        { error: 'This invitation has already been used. Please log in to your dashboard.' },
        { status: 400 }
      );
    }

    // Check if expired
    if (leader.signup_token_expires_at && new Date(leader.signup_token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired. Please contact the person who invited you to send a new invitation.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      invitation: {
        id: leader.id,
        email: leader.email,
        name: leader.name,
        church: leader.church,
      },
    });

  } catch (error) {
    console.error('[DNA Leaders] Verify token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
