import { NextRequest, NextResponse } from 'next/server';
import { verifyDNALeaderMagicLinkToken, createDNALeaderSession } from '@/lib/auth';

// GET /api/auth/verify-dna-leader?token=xxx
// Verify a DNA leader magic link and create a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid', request.url));
    }

    const result = await verifyDNALeaderMagicLinkToken(token);

    if (!result.valid || !result.leader) {
      const errorType = result.error?.includes('expired') ? 'expired' : 'invalid';
      return NextResponse.redirect(new URL(`/login?error=${errorType}`, request.url));
    }

    // Create session for the DNA leader
    await createDNALeaderSession(result.leader.id, result.leader.church_id);

    // Redirect to DNA groups dashboard
    return NextResponse.redirect(new URL('/groups', request.url));

  } catch (error) {
    console.error('[Auth] Verify DNA leader error:', error);
    return NextResponse.redirect(new URL('/login?error=invalid', request.url));
  }
}
