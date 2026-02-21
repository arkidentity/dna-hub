import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

/**
 * Called by the login page immediately after a successful
 * signInWithPassword() to stamp last_login_at.
 * The Supabase Auth session cookie is already set by the client
 * before this is called, so auth.getUser() resolves the identity
 * server-side without needing any body params.
 */
export async function POST() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await getSupabaseAdmin()
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('email', user.email.toLowerCase());

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[session-start] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
