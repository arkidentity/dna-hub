import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, generateToken } from '@/lib/auth';
import { sendDiscoveryCallAccessEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, churchName, readinessLevel } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getSupabaseAdmin();

    // Look up the user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        user_roles (
          role,
          church_id
        )
      `)
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      console.error('[BOOK-CALL] User not found for email:', normalizedEmail, userError);
      // Return success anyway to avoid revealing if email exists
      return NextResponse.json({ success: true });
    }

    // Get church_id from user_roles (church_leader role)
    const churchLeaderRole = user.user_roles?.find(
      (r: { role: string; church_id: string }) => r.role === 'church_leader'
    );
    const churchId = churchLeaderRole?.church_id;

    // Update church status to 'portal' (indicates they've booked a call and have dashboard access)
    if (churchId) {
      const { error: statusError } = await supabase
        .from('churches')
        .update({ status: 'portal' })
        .eq('id', churchId);

      if (statusError) {
        console.error('[BOOK-CALL] Failed to update church status:', statusError);
        // Continue — still send the email even if status update fails
      } else {
        console.log('[BOOK-CALL] Updated church status to portal for church:', churchId);
      }
    }

    // Generate magic link token (7-day expiry)
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: tokenError } = await supabase
      .from('magic_link_tokens')
      .insert({
        email: normalizedEmail,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (tokenError) {
      console.error('[BOOK-CALL] Failed to create magic link token:', tokenError);
      return NextResponse.json({ error: 'Failed to create access link' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}&destination=dashboard`;

    // Send the discovery call access email with magic link
    // Launch Guide is inside the dashboard — no direct link in the email
    const displayName = firstName || user.name?.split(' ')[0] || 'Pastor';
    const displayChurchName = churchName || 'your church';

    await sendDiscoveryCallAccessEmail(
      normalizedEmail,
      displayName,
      displayChurchName,
      magicLink,
      churchId
    );

    console.log('[BOOK-CALL] Access email sent to:', normalizedEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[BOOK-CALL] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
