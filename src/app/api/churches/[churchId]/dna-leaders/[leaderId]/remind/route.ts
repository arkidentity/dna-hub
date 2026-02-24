import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedSession, isAdmin, isChurchLeader } from '@/lib/unified-auth';
import { sendDNALeaderReminderEmail } from '@/lib/email';

// POST /api/churches/[churchId]/dna-leaders/[leaderId]/remind
// Sends a reminder email to a DNA leader (from the church leader)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ churchId: string; leaderId: string }> }
) {
  const session = await getUnifiedSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { churchId, leaderId } = await params;
  const admin = isAdmin(session);

  if (!admin && !isChurchLeader(session, churchId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch the leader
  const { data: leader, error: leaderError } = await supabase
    .from('dna_leaders')
    .select('id, email, name, activated_at, church_id')
    .eq('id', leaderId)
    .eq('church_id', churchId)
    .single();

  if (leaderError || !leader) {
    return NextResponse.json({ error: 'Leader not found' }, { status: 404 });
  }

  // Fetch church name
  const { data: church } = await supabase
    .from('churches')
    .select('name')
    .eq('id', churchId)
    .single();
  const churchName = church?.name || 'your church';

  // Determine reminder type
  const type: 'setup' | 'login' = leader.activated_at ? 'login' : 'setup';

  // Generate a login / setup link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dnadiscipleship.com';
  let loginUrl = `${baseUrl}/login`;

  try {
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: leader.email,
      options: {
        redirectTo: type === 'setup'
          ? `${baseUrl}/auth/reset-password`
          : `${baseUrl}/dashboard`,
      },
    });
    if (linkData?.properties?.action_link) {
      loginUrl = linkData.properties.action_link;
    }
  } catch (linkErr) {
    console.warn('[Remind] Could not generate recovery link, using fallback:', linkErr);
  }

  const fromName = session.name || 'Your Church Leader';

  const result = await sendDNALeaderReminderEmail(
    leader.email,
    leader.name,
    fromName,
    churchName,
    loginUrl,
    type
  );

  if (!result.success) {
    console.error('[Remind] Email send failed:', result.error);
    return NextResponse.json({ error: 'Failed to send reminder email' }, { status: 500 });
  }

  return NextResponse.json({ success: true, type });
}
