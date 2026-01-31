import { NextRequest, NextResponse } from 'next/server';
import { createTrainingUser, createMagicLink } from '@/lib/training-auth';
import { sendTrainingWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please enter your name.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Create user
    const result = await createTrainingUser(trimmedEmail, trimmedName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Create magic link for initial login
    const magicLinkResult = await createMagicLink(trimmedEmail);

    if (!magicLinkResult.success || !magicLinkResult.token) {
      console.error('[Training Signup] Failed to create magic link');
      return NextResponse.json(
        { error: 'Account created but failed to send login link. Please try logging in.' },
        { status: 500 }
      );
    }

    // Build login URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginLink = `${baseUrl}/api/training/verify?token=${magicLinkResult.token}`;

    // Send welcome email
    const emailResult = await sendTrainingWelcomeEmail(trimmedEmail, trimmedName, loginLink);

    if (!emailResult.success) {
      console.error('[Training Signup] Failed to send welcome email');
    }

    // In development, return the link directly for testing
    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json({
      success: true,
      message: 'Account created! Check your email for a login link.',
      ...(isDev && { devLink: loginLink })
    });

  } catch (error) {
    console.error('[Training Signup] Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
