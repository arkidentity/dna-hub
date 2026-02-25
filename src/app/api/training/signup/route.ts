import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { initializeTrainingUser } from '@/lib/unified-auth';
import { sendTrainingWelcomeEmail } from '@/lib/email';
import crypto from 'crypto';

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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', trimmedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in instead.' },
        { status: 400 }
      );
    }

    // Create user in unified users table
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: trimmedEmail,
        name: trimmedName
      })
      .select('id')
      .single();

    if (createError || !newUser) {
      console.error('[Training Signup] Error creating user:', createError);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    // Add training_participant role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.id,
        role: 'training_participant'
      });

    if (roleError) {
      console.error('[Training Signup] Error adding role:', roleError);
    }

    // Initialize training data (progress + unlock flow assessment)
    await initializeTrainingUser(newUser.id);

    // Create magic link token for initial login
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
      console.error('[Training Signup] Failed to create magic link:', tokenError);
      return NextResponse.json(
        { error: 'Account created but failed to send login link. Please try logging in.' },
        { status: 500 }
      );
    }

    // Build login URL (unified verify endpoint)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginLink = `${baseUrl}/api/auth/verify?token=${token}&destination=training`;

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
