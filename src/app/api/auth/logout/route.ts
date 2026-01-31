import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  // Clear all session cookies (unified + legacy)
  cookieStore.delete('user_session');
  cookieStore.delete('church_leader_session');
  cookieStore.delete('dna_leader_session');
  cookieStore.delete('training_session');

  // Redirect to login page
  return NextResponse.redirect(new URL('/login', request.url));
}
