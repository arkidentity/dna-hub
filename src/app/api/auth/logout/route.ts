import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { clearSessionCache } from '@/lib/unified-auth';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  // Clear session cache for this token before deleting the cookie
  const sessionToken = cookieStore.get('user_session')?.value;
  if (sessionToken) {
    clearSessionCache(sessionToken);
  }

  // Clear all session cookies (unified + legacy)
  cookieStore.delete('user_session');
  cookieStore.delete('church_leader_session');
  cookieStore.delete('dna_leader_session');
  cookieStore.delete('training_session');

  // Redirect to login page
  return NextResponse.redirect(new URL('/login', request.url));
}
