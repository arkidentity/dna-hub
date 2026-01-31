import { NextRequest, NextResponse } from 'next/server';
import { createMagicLink, getTrainingUserByEmail } from '@/lib/training-auth';
import { sendTrainingLoginEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await getTrainingUserByEmail(trimmedEmail);

    if (!user) {
      // Don't reveal if user exists - return success anyway
      // This prevents email enumeration attacks
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a login link.'
      });
    }

    // Create magic link
    const magicLinkResult = await createMagicLink(trimmedEmail);

    if (!magicLinkResult.success || !magicLinkResult.token) {
      console.error('[Training Login] Failed to create magic link');
      return NextResponse.json(
        { error: 'Failed to send login link. Please try again.' },
        { status: 500 }
      );
    }

    // Build login URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginLink = `${baseUrl}/api/training/verify?token=${magicLinkResult.token}`;

    // Send login email
    const emailResult = await sendTrainingLoginEmail(
      trimmedEmail,
      user.name || 'there',
      loginLink
    );

    if (!emailResult.success) {
      console.error('[Training Login] Failed to send login email');
    }

    // In development, return the link directly for testing
    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json({
      success: true,
      message: 'Check your email for a login link.',
      ...(isDev && { devLink: loginLink })
    });

  } catch (error) {
    console.error('[Training Login] Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
