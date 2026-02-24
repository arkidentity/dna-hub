import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, isAdmin, hasRole } from '@/lib/unified-auth';
import { sendMagicLinkEmail } from '@/lib/email';

/**
 * POST /api/admin/send-login-link
 *
 * Sends a Supabase-native one-time login link to a leader.
 * Replaces the old custom magic_link_tokens system.
 *
 * The generated link routes through Supabase's auth endpoint, then
 * redirects to /auth/callback where exchangeCodeForSession() creates
 * a real Supabase session — no custom cookies or tokens needed.
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
  const { email, name } = body;

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
    // Generate a Supabase OTP magic link (one-time login, no password required).
    // When clicked: Supabase verifies → redirects to /auth/callback with a code →
    // exchangeCodeForSession() creates a real Supabase session → dashboard.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[send-login-link] Failed to generate link:', linkError);
      return NextResponse.json({ error: 'Failed to generate login link' }, { status: 500 });
    }

    const loginLink = linkData.properties.action_link;

    // Send via Resend using the existing branded email template
    const emailResult = await sendMagicLinkEmail(
      normalizedEmail,
      name || 'Leader',
      loginLink
    );

    if (!emailResult.success) {
      console.error('[send-login-link] Email send failed:', emailResult.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[send-login-link] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
