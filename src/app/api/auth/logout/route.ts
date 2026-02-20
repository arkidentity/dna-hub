import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabase } from '@/lib/supabase-server';
import { clearSessionCache } from '@/lib/unified-auth';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  // Clear in-memory role cache
  const legacyToken = cookieStore.get('user_session')?.value;
  clearSessionCache(legacyToken || undefined);

  // Sign out of Supabase Auth (clears auth cookies)
  try {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  } catch {
    // Ignore — we'll clear cookies manually below as fallback
  }

  // Clear legacy session cookies
  cookieStore.delete('user_session');
  cookieStore.delete('church_leader_session');
  cookieStore.delete('dna_leader_session');
  cookieStore.delete('training_session');

  // Redirect to login page
  return NextResponse.redirect(new URL('/login', request.url));
}
