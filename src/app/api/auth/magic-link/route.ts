import { NextRequest, NextResponse } from 'next/server';
import { getLeaderByEmail, createMagicLinkToken, getDNALeaderByEmail, createDNALeaderMagicLinkToken } from '@/lib/auth';
import { sendMagicLinkEmail, sendDNALeaderMagicLinkEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // First check if they're a church leader
    console.log('[MAGIC-LINK] Looking up email:', normalizedEmail);
    const churchLeader = await getLeaderByEmail(normalizedEmail);

    if (churchLeader) {
      console.log('[MAGIC-LINK] Found church leader:', churchLeader.name, '| Church status:', churchLeader.church?.status);

      // Allow login for any valid church status
      const validStatuses = [
        'pending_assessment',
        'awaiting_discovery',
        'proposal_sent',
        'awaiting_agreement',
        'awaiting_strategy',
        'active',
        'completed',
        'paused',
      ];

      if (churchLeader.church?.status && validStatuses.includes(churchLeader.church.status)) {
        // Create magic link token for church leader
        const token = await createMagicLinkToken(churchLeader.id, normalizedEmail);

        if (!token) {
          return NextResponse.json(
            { error: 'Failed to create login link' },
            { status: 500 }
          );
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;

        console.log('[MAGIC-LINK] Sending church leader email to:', email);
        const emailResult = await sendMagicLinkEmail(email, churchLeader.name, magicLink);
        console.log('[MAGIC-LINK] Email result:', JSON.stringify(emailResult));

        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json({
            success: true,
            message: 'Login link created',
            devLink: magicLink,
            userType: 'church_leader',
          });
        }

        return NextResponse.json({
          success: true,
          message: 'If this email is registered, a login link has been sent.',
        });
      }
    }

    // Check if they're a DNA leader
    const dnaLeader = await getDNALeaderByEmail(normalizedEmail);

    if (dnaLeader && dnaLeader.activated_at) {
      console.log('[MAGIC-LINK] Found DNA leader:', dnaLeader.name);

      // Create magic link token for DNA leader
      const token = await createDNALeaderMagicLinkToken(dnaLeader.id);

      if (!token) {
        return NextResponse.json(
          { error: 'Failed to create login link' },
          { status: 500 }
        );
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const magicLink = `${baseUrl}/api/auth/verify-dna-leader?token=${token}`;

      console.log('[MAGIC-LINK] Sending DNA leader email to:', email);
      const emailResult = await sendDNALeaderMagicLinkEmail(email, dnaLeader.name, magicLink);
      console.log('[MAGIC-LINK] Email result:', JSON.stringify(emailResult));

      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Login link created',
          devLink: magicLink,
          userType: 'dna_leader',
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
