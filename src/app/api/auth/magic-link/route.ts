import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, generateToken } from '@/lib/auth';
import { sendMagicLinkEmail, sendDNALeaderMagicLinkEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, destination } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const supabase = getSupabaseAdmin();

    // Check if user exists in unified auth system
    console.log('[MAGIC-LINK] Looking up email in unified auth:', normalizedEmail);
    const { data: user } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        user_roles (
          role,
          church_id
        )
      `)
      .eq('email', normalizedEmail)
      .single();

    if (user && user.user_roles && user.user_roles.length > 0) {
      const roles = user.user_roles.map((r: { role: string }) => r.role);
      console.log('[MAGIC-LINK] Found user in unified auth:', user.name, '| Roles:', roles);

      // Create magic link token in magic_link_tokens table
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

      const { error: tokenError } = await supabase
        .from('magic_link_tokens')
        .insert({
          email: normalizedEmail,
          token,
          expires_at: expiresAt.toISOString(),
          used: false,
        });

      if (tokenError) {
        console.error('[MAGIC-LINK] Token creation error:', tokenError);
        return NextResponse.json(
          { error: 'Failed to create login link' },
          { status: 500 }
        );
      }

      // Determine destination based on roles (or use provided destination)
      let dest = destination || '';
      if (!dest) {
        if (roles.includes('church_leader')) {
          dest = 'dashboard';
        } else if (roles.includes('dna_leader')) {
          dest = 'groups';
        } else if (roles.includes('training_participant')) {
          dest = 'training';
        } else if (roles.includes('admin')) {
          dest = 'admin';
        }
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const magicLink = dest
        ? `${baseUrl}/api/auth/verify?token=${token}&destination=${dest}`
        : `${baseUrl}/api/auth/verify?token=${token}`;

      // Send appropriate email based on roles
      let emailResult;
      if (roles.includes('dna_leader') && !roles.includes('church_leader')) {
        console.log('[MAGIC-LINK] Sending DNA leader email to:', normalizedEmail);
        emailResult = await sendDNALeaderMagicLinkEmail(normalizedEmail, user.name || 'DNA Leader', magicLink);
      } else {
        console.log('[MAGIC-LINK] Sending standard magic link email to:', normalizedEmail);
        emailResult = await sendMagicLinkEmail(normalizedEmail, user.name || 'User', magicLink);
      }
      console.log('[MAGIC-LINK] Email result:', JSON.stringify(emailResult));

      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Login link created',
          devLink: magicLink,
          userType: roles[0],
        });
      }

      return NextResponse.json({
        success: true,
        message: 'If this email is registered, a login link has been sent.',
      });
    }

    // No user found - return generic success (don't reveal if email exists)
    console.log('[MAGIC-LINK] No user found for email:', normalizedEmail);
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
