import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { getUnifiedSession, isAdmin, isAdminOrCoach, isChurchLeader } from '@/lib/unified-auth';
import { sendServiceSummaryEmails } from '@/lib/service-summary';
import type { ResponseRow } from '@/lib/service-summary';

async function authorize(churchId: string) {
  const session = await getUnifiedSession();
  if (!session) return null;
  if (isAdmin(session) || isAdminOrCoach(session) || isChurchLeader(session, churchId)) {
    return session;
  }
  return null;
}

// ============================================
// POST — Send person-centric coordinator summary emails
// Body: { church_id, session_id }
//
// Manual trigger from Hub dashboard.
// Also marks session as emailed so cron doesn't re-send.
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { church_id: churchId, session_id: sessionId } = body;

    if (!churchId || !sessionId) {
      return NextResponse.json({ error: 'church_id and session_id are required' }, { status: 400 });
    }

    const session = await authorize(churchId);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: responses, error } = await supabase.rpc('get_service_responses_for_session', {
      p_session_id: sessionId,
    });

    if (error) {
      console.error('Service responses fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
    }

    const rows = (responses || []) as ResponseRow[];
    const result = await sendServiceSummaryEmails(rows, churchId, session.email);

    // Mark session as emailed so cron doesn't re-send
    if (result.sent > 0) {
      await supabase
        .from('live_sessions')
        .update({ summary_emailed_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Send summary error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
