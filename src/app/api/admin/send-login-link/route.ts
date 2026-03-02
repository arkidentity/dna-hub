import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, isAdmin, hasRole } from '@/lib/unified-auth';
import { sendMagicLinkEmail, sendDNALeaderDirectInviteEmail } from '@/lib/email';

/**
 * POST /api/admin/send-login-link
 *
 * Sends a login email to a leader. Two modes:
 *
 * linkType: 'magiclink' (default) — one-click login, no password needed.
 *   Used for church leaders and login reminders.
 *
 * linkType: 'setup' — password setup + Google auth option for first-time DNA leaders.
 *   Generates a recovery link → /auth/reset-password so they can create a password
 *   OR use Google sign-in with the same email address.
 *
 * Auth: admin or church_leader only.
 */
export async function POST(request: NextRequest) {
  const session = await getUnifiedSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdminUser = isAdmin(session);
  const isChurchLeader = hasRole(session, 'church_leader');

  if (!isAdminUser && !isChurchLeader) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, name, linkType = 'magiclink', churchName } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dnadiscipleship.com';

  try {
    if (linkType === 'setup') {
      // Recovery link — sends them to /auth/reset-password to create a password.
      // The email also mentions Google sign-in as an alternative.
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail,
        options: {
          redirectTo: `${baseUrl}/auth/reset-password`,
        },
      });

      if (linkError || !linkData?.properties?.action_link) {
        console.error('[send-login-link] Failed to generate setup link:', linkError);
        return NextResponse.json({ error: 'Failed to generate setup link' }, { status: 500 });
      }

      const setupLink = linkData.properties.action_link;

      const emailResult = await sendDNALeaderDirectInviteEmail(
        normalizedEmail,
        name || 'Leader',
        setupLink,
        churchName || null,
        'DNA Hub Admin',
        undefined
      );

      if (!emailResult.success) {
        console.error('[send-login-link] Setup email send failed:', emailResult.error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }
    } else {
      // Magic link — one-click login, no password required.
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
        },
      });

      if (linkError || !linkData?.properties?.action_link) {
        console.error('[send-login-link] Failed to generate magic link:', linkError);
        return NextResponse.json({ error: 'Failed to generate login link' }, { status: 500 });
      }

      const loginLink = linkData.properties.action_link;

      const emailResult = await sendMagicLinkEmail(
        normalizedEmail,
        name || 'Leader',
        loginLink
      );

      if (!emailResult.success) {
        console.error('[send-login-link] Email send failed:', emailResult.error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[send-login-link] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
