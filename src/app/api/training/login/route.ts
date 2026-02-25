import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendTrainingLoginEmail } from '@/lib/email';
import crypto from 'crypto';

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

    // Check if user exists in unified users table
    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', trimmedEmail)
      .single();

    if (!user) {
      // Don't reveal if user exists - return success anyway
      // This prevents email enumeration attacks
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a login link.'
      });
    }

    // Create magic link token using unified system
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to match session cookie

    const { error: tokenError } = await supabase
      .from('magic_link_tokens')
      .insert({
        email: trimmedEmail,
        token,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (tokenError) {
      console.error('[Training Login] Failed to create magic link:', tokenError);
      return NextResponse.json(
        { error: 'Failed to send login link. Please try again.' },
        { status: 500 }
      );
    }

    // Build login URL (unified verify endpoint with training destination)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginLink = `${baseUrl}/api/auth/verify?token=${token}&destination=training`;

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
