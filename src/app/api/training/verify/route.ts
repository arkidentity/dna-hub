import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLink } from '@/lib/training-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      // Redirect to login with error
      return NextResponse.redirect(new URL('/login?error=missing', request.url));
    }

    // Verify the magic link token
    const result = await verifyMagicLink(token);

    if (!result.success || !result.user) {
      // Redirect to login with error
      return NextResponse.redirect(new URL('/login?error=invalid', request.url));
    }

    // Session is created inside verifyMagicLink
    // Redirect to training dashboard
    return NextResponse.redirect(new URL('/training', request.url));

  } catch (error) {
    console.error('[Training Verify] Error:', error);
    return NextResponse.redirect(new URL('/login?error=unknown', request.url));
  }
}
