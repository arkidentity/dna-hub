import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLinkToken, createSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid', request.url));
  }

  const result = await verifyMagicLinkToken(token);

  if (!result.valid || !result.leader) {
    return NextResponse.redirect(new URL('/login?error=expired', request.url));
  }

  // Create session
  await createSession(result.leader.id, result.leader.church_id);

  // Redirect to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
