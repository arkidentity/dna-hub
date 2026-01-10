import { NextRequest, NextResponse } from 'next/server';
import { getLeaderByEmail, createMagicLinkToken } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the leader by email
    const leader = await getLeaderByEmail(email);

    if (!leader) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, a login link has been sent.',
      });
    }

    // Check if church is active
    if (leader.church?.status !== 'active') {
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, a login link has been sent.',
      });
    }

    // Create magic link token
    const token = await createMagicLinkToken(leader.id);

    if (!token) {
      return NextResponse.json(
        { error: 'Failed to create login link' },
        { status: 500 }
      );
    }

    // Build magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;

    // Send email with magic link
    await sendMagicLinkEmail(email, leader.name, magicLink);

    // In development, also return the link directly for testing
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        message: 'Login link created',
        devLink: magicLink,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If this email is registered, a login link has been sent.',
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
