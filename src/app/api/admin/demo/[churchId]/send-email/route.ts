import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin } from '@/lib/unified-auth';
import { sendDemoInviteEmail } from '@/lib/email';

/**
 * POST /api/admin/demo/[churchId]/send-email
 * Admin-only. Sends the demo invite email to the church's primary leader.
 *
 * Validates:
 *   - Admin auth
 *   - Church exists with a subdomain
 *   - demo_enabled = true
 *   - Church has a leader with an email address
 *
 * Auto-advances church status to 'demo_sent' if currently 'prospect' or 'demo'.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  try {
    const session = await getUnifiedSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { churchId } = await params;

    const supabase = getSupabaseAdmin();

    // 1. Fetch church
    const { data: church } = await supabase
      .from('churches')
      .select('id, name, subdomain, status')
      .eq('id', churchId)
      .single();

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    if (!church.subdomain) {
      return NextResponse.json({ error: 'Church has no subdomain configured' }, { status: 400 });
    }

    // 2. Check demo_enabled
    const { data: demo } = await supabase
      .from('church_demo_settings')
      .select('demo_enabled')
      .eq('church_id', churchId)
      .single();

    if (!demo?.demo_enabled) {
      return NextResponse.json({ error: 'Demo is not enabled for this church' }, { status: 400 });
    }

    // 3. Get church leader
    const { data: leader } = await supabase
      .from('church_leaders')
      .select('name, email')
      .eq('church_id', churchId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!leader?.email) {
      return NextResponse.json({ error: 'No leader email found for this church' }, { status: 400 });
    }

    // 4. Construct demo URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dnadiscipleship.com';
    const demoUrl = `${siteUrl}/demo/${church.subdomain}`;

    // 5. Send email
    const firstName = (leader.name || 'there').split(' ')[0];
    const result = await sendDemoInviteEmail(
      leader.email,
      firstName,
      church.name,
      demoUrl,
      churchId
    );

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // 6. Auto-advance status to demo_sent (only if early in funnel)
    let statusAdvanced = false;
    if (church.status === 'prospect' || church.status === 'demo') {
      const { error: statusError } = await supabase
        .from('churches')
        .update({ status: 'demo_sent' })
        .eq('id', churchId);

      if (!statusError) {
        statusAdvanced = true;
      } else {
        console.error('[DEMO EMAIL] Failed to advance status:', statusError);
      }
    }

    return NextResponse.json({
      success: true,
      sent_to: leader.email,
      status_advanced: statusAdvanced,
    });
  } catch (error) {
    console.error('[DEMO EMAIL] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
