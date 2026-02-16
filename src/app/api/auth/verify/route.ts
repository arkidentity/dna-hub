import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const destination = request.nextUrl.searchParams.get('destination'); // Optional: 'training', 'groups', 'dashboard'

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid', request.url));
  }

  const supabase = getSupabaseAdmin();

  // Verify token
  const { data: tokenData, error: tokenError } = await supabase
    .from('magic_link_tokens')
    .select('email, expires_at, used')
    .eq('token', token)
    .single();

  if (tokenError || !tokenData) {
    return NextResponse.redirect(new URL('/login?error=expired', request.url));
  }

  // Check if token is already used
  if (tokenData.used) {
    return NextResponse.redirect(new URL('/login?error=used', request.url));
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/login?error=expired', request.url));
  }

  // Mark token as used
  await supabase
    .from('magic_link_tokens')
    .update({ used: true })
    .eq('token', token);

  // Set unified session cookie
  const cookieStore = await cookies();

  // Clear old session cookies (if any)
  cookieStore.delete('church_leader_session');
  cookieStore.delete('dna_leader_session');
  cookieStore.delete('training_session');
  cookieStore.delete('dna_training_session'); // Old training auth cookie

  // Set new unified session cookie
  cookieStore.set('user_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  });

  // Get user to determine where to redirect
  const { data: user } = await supabase
    .from('users')
    .select(`
      id,
      user_roles (
        role,
        church_id
      )
    `)
    .eq('email', tokenData.email)
    .single();

  // Determine redirect based on destination param or roles
  let redirectTo = '/dashboard'; // default

  // If a specific destination was requested, use it (if user has access)
  if (destination) {
    const validDestinations: Record<string, string> = {
      'training': '/training',
      'groups': '/groups',
      'dashboard': '/dashboard',
      'admin': '/admin'
    };
    if (validDestinations[destination]) {
      redirectTo = validDestinations[destination];
    }
  } else if (user && user.user_roles) {
    // Default: determine based on roles (priority: church_leader > dna_leader > training_participant)
    const roles = user.user_roles.map((r: any) => r.role);

    if (roles.includes('church_leader')) {
      redirectTo = '/dashboard';
    } else if (roles.includes('dna_leader')) {
      redirectTo = '/groups';
    } else if (roles.includes('training_participant')) {
      redirectTo = '/training';
    } else if (roles.includes('admin')) {
      redirectTo = '/admin';
    }
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
